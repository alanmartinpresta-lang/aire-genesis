/* ============================================================
   AIRE GENESIS — UI PATCH MONITEUR V9
   Module expérimental : perception / préférence / assemblage

   IMPORTANT :
   - Ne remplace aucun moteur existant.
   - Ne modifie pas le code source d'Alpha.
   - Fonctionne comme une couche expérimentale indépendante.
   - Peut être supprimé sans casser V2/V4/V5/V7/V8.
   ============================================================ */

(() => {
  "use strict";

  if (window.__AIRE_V9_LOADED__) return;
  window.__AIRE_V9_LOADED__ = true;

  /* ------------------------------------------------------------
     ETAT DU MODULE
     ------------------------------------------------------------ */

  const state = {
    running: true,
    discoveries: 0,
    observations: 0,
    experiments: 0,

    memory: [],

    preferences: {},

    objects: new Map(),

    selectedObject: null,

    assembly: {
      attempts: 0,
      successes: 0,
      discoveries: 0
    },

    lastAction: "Observation",
    lastResult: "Aucune expérience nouvelle",
    lastObject: "Aucun",

    startedAt: Date.now()
  };

  const MAX_MEMORY = 512;

  /* ------------------------------------------------------------
     OUTILS
     ------------------------------------------------------------ */

  const esc = value =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const clamp = (v, a, b) =>
    Math.max(a, Math.min(b, v));

  function remember(entry) {
    state.memory.push({
      t: Date.now(),
      ...entry
    });

    if (state.memory.length > MAX_MEMORY) {
      state.memory.shift();
    }
  }

  function preferenceKey(objectId) {
    return `object:${objectId}`;
  }

  function getPreference(objectId) {
    const key = preferenceKey(objectId);

    if (!state.preferences[key]) {
      state.preferences[key] = {
        attraction: 0,
        usefulness: 0,
        familiarity: 0,
        kept: 0,
        released: 0,
        successful: 0
      };
    }

    return state.preferences[key];
  }

  function updatePreference(objectId, delta) {
    const p = getPreference(objectId);

    for (const k of Object.keys(delta)) {
      p[k] = clamp(
        (p[k] || 0) + delta[k],
        -100,
        100
      );
    }

    render();
  }

  /* ------------------------------------------------------------
     OBJETS
     ------------------------------------------------------------ */

  function registerObject(data = {}) {

    const id =
      data.id ||
      `obj_${Math.random().toString(36).slice(2, 9)}`;

    if (!state.objects.has(id)) {

      state.objects.set(id, {
        id,

        type:
          data.type ||
          "objet inconnu",

        material:
          data.material ||
          "inconnu",

        energy:
          Number(data.energy ?? 0.5),

        utility:
          Number(data.utility ?? 0.5),

        novelty:
          Number(data.novelty ?? 0.5),

        compatible:
          Array.isArray(data.compatible)
            ? data.compatible
            : [],

        observations: 0,

        interactions: 0,

        kept: false,

        discoveredAt: Date.now()
      });

    }

    return state.objects.get(id);
  }

  /* ------------------------------------------------------------
     PERCEPTION
     ------------------------------------------------------------ */

  function observeObject(object) {

    const obj = registerObject(object);

    obj.observations++;
    state.observations++;

    const p = getPreference(obj.id);

    p.familiarity =
      clamp(
        p.familiarity + 0.2,
        -100,
        100
      );

    state.lastObject = obj.type;
    state.lastAction = "Observation";

    remember({
      action: "observer",
      object: obj.id,
      result: "information acquise"
    });

    render();
  }

  /* ------------------------------------------------------------
     INTERACTION
     ------------------------------------------------------------ */

  function interact(objectId, action) {

    const obj = state.objects.get(objectId);

    if (!obj) return;

    obj.interactions++;

    state.lastObject = obj.type;
    state.lastAction = action;

    let reward = 0;
    let result = "";

    switch (action) {

      case "observer":
        reward = 0.1;
        result = "nouvelle observation";
        break;

      case "toucher":
        reward =
          0.1 +
          obj.novelty * 0.2;

        result = "propriété tactile observée";
        break;

      case "saisir":
        reward =
          obj.utility * 0.5;

        result =
          obj.utility > 0.6
            ? "objet potentiellement utile"
            : "objet peu utile";
        break;

      case "deplacer":
        reward =
          obj.utility * 0.3;

        result = "déplacement réussi";
        break;

      case "garder":
        obj.kept = true;

        reward =
          0.5 +
          obj.utility * 0.5;

        getPreference(obj.id).kept++;

        result = "objet conservé volontairement";
        break;

      case "relacher":
        obj.kept = false;

        reward =
          obj.utility < 0.4
            ? 0.2
            : -0.1;

        getPreference(obj.id).released++;

        result = "objet relâché";
        break;

      default:
        result = "interaction inconnue";
    }

    const p = getPreference(obj.id);

    p.attraction += reward;
    p.usefulness +=
      (obj.utility - 0.5) * 0.5;

    if (reward > 0) {
      p.successful++;
    }

    remember({
      action,
      object: objectId,
      reward,
      result
    });

    state.lastResult = result;

    render();
  }

  /* ------------------------------------------------------------
     DECISION
     ------------------------------------------------------------ */

  function chooseAction(objectId) {

    const obj = state.objects.get(objectId);

    if (!obj) return "observer";

    const p = getPreference(objectId);

    /*
      La préférence ne donne pas une capacité nouvelle.
      Elle modifie simplement la probabilité de choisir
      une action déjà disponible.
    */

    if (obj.utility > 0.75 && p.attraction > 1) {
      return "garder";
    }

    if (obj.utility < 0.25 && p.attraction < -1) {
      return "relacher";
    }

    if (obj.novelty > 0.7 &&
        p.familiarity < 1) {
      return "toucher";
    }

    if (p.usefulness > 0.5) {
      return "saisir";
    }

    return "observer";
  }

  /* ------------------------------------------------------------
     ASSEMBLAGE
     ------------------------------------------------------------ */

  function attemptAssembly(idA, idB) {

    const a = state.objects.get(idA);
    const b = state.objects.get(idB);

    if (!a || !b || idA === idB) {
      return false;
    }

    state.assembly.attempts++;

    const explicitCompatibility =
      a.compatible.includes(b.type) ||
      b.compatible.includes(a.type);

    const emergentCompatibility =
      (
        a.utility +
        b.utility +
        a.energy +
        b.energy
      ) / 4 > 0.72;

    const success =
      explicitCompatibility ||
      emergentCompatibility;

    if (success) {

      state.assembly.successes++;
      state.assembly.discoveries++;
      state.discoveries++;

      const resultId =
        `assembly_${Date.now().toString(36)}`;

      state.objects.set(resultId, {

        id: resultId,

        type:
          `${a.type} + ${b.type}`,

        material:
          "combinaison",

        energy:
          clamp(
            (a.energy + b.energy) / 2,
            0,
            1
          ),

        utility:
          clamp(
            (a.utility + b.utility) / 2 + 0.15,
            0,
            1
          ),

        novelty: 1,

        compatible: [],

        observations: 0,

        interactions: 0,

        kept: false,

        discoveredAt: Date.now(),

        derivedFrom: [
          idA,
          idB
        ]
      });

      state.lastAction = "Assemblage";
      state.lastResult =
        `Nouvelle combinaison découverte : ${a.type} + ${b.type}`;

      remember({
        action: "assemblage",
        object: resultId,
        parents: [idA, idB],
        reward: 1,
        result: state.lastResult
      });

      render();

      return resultId;
    }

    state.lastAction = "Assemblage";
    state.lastResult =
      "Combinaison testée sans résultat exploitable";

    remember({
      action: "assemblage",
      object: `${idA}+${idB}`,
      reward: -0.05,
      result: state.lastResult
    });

    render();

    return false;
  }

  /* ------------------------------------------------------------
     EXPERIMENTATION
     ------------------------------------------------------------ */

  function runExperiment() {

    state.experiments++;

    /*
      Quelques objets expérimentaux seulement.
      Le but est de fournir au système un espace
      d'expérimentation suffisamment varié.
    */

    const samples = [

      {
        type: "fragment minéral",
        material: "minéral",
        energy: 0.25,
        utility: 0.45,
        novelty: 0.35,
        compatible: ["cristal"]
      },

      {
        type: "cristal",
        material: "cristallin",
        energy: 0.65,
        utility: 0.8,
        novelty: 0.8,
        compatible: ["fragment minéral"]
      },

      {
        type: "fibre végétale",
        material: "organique",
        energy: 0.35,
        utility: 0.65,
        novelty: 0.55,
        compatible: ["résine"]
      },

      {
        type: "résine",
        material: "organique",
        energy: 0.55,
        utility: 0.7,
        novelty: 0.7,
        compatible: ["fibre végétale"]
      }
    ];

    for (const sample of samples) {

      const obj = registerObject(sample);

      observeObject(obj);

      const action =
        chooseAction(obj.id);

      interact(
        obj.id,
        action
      );
    }

    const objects =
      [...state.objects.values()]
        .filter(o => !o.derivedFrom);

    if (objects.length >= 2) {

      const a =
        objects[
          Math.floor(
            Math.random() *
            objects.length
          )
        ];

      const b =
        objects[
          Math.floor(
            Math.random() *
            objects.length
          )
        ];

      if (a && b && a.id !== b.id) {
        attemptAssembly(
          a.id,
          b.id
        );
      }
    }

    render();
  }

  /* ------------------------------------------------------------
     INTERFACE
     ------------------------------------------------------------ */

  let panel = null;

  function createPanel() {

    if (document.getElementById(
      "aire-v9-panel"
    )) {
      panel =
        document.getElementById(
          "aire-v9-panel"
        );

      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "aire-v9-style";

    style.textContent = `

      #aire-v9-panel{
        margin:24px 0;
        padding:22px;
        border:1px solid rgba(90,220,210,.28);
        border-radius:22px;
        background:
          linear-gradient(
            145deg,
            rgba(7,24,35,.98),
            rgba(8,18,29,.98)
          );
        color:#e8f4f7;
        font-family:
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
        box-shadow:
          0 18px 50px rgba(0,0,0,.22);
      }

      #aire-v9-panel h2{
        margin:0 0 6px;
        font-size:25px;
      }

      #aire-v9-panel .v9-sub{
        color:#91a8b2;
        margin-bottom:18px;
      }

      #aire-v9-panel .v9-grid{
        display:grid;
        grid-template-columns:
          repeat(2,minmax(0,1fr));
        gap:10px;
      }

      #aire-v9-panel .v9-card{
        background:#081625;
        border:1px solid
          rgba(100,150,180,.14);
        border-radius:15px;
        padding:14px;
      }

      #aire-v9-panel .v9-label{
        display:block;
        font-size:12px;
        color:#829ba8;
        margin-bottom:5px;
      }

      #aire-v9-panel .v9-value{
        font-size:19px;
        font-weight:700;
      }

      #aire-v9-panel button{
        width:100%;
        margin-top:10px;
        border:1px solid
          rgba(90,190,220,.28);
        background:#122b43;
        color:#edf8fa;
        border-radius:12px;
        padding:13px 10px;
        font-size:15px;
        font-weight:700;
        cursor:pointer;
      }

      #aire-v9-panel button:active{
        transform:scale(.98);
      }

      #aire-v9-panel .v9-status{
        margin-top:15px;
        padding:13px;
        border-radius:12px;
        background:#06121e;
        color:#9fc0cb;
        font-size:13px;
        line-height:1.45;
      }

      #aire-v9-panel .v9-object{
        display:flex;
        justify-content:space-between;
        gap:8px;
        align-items:center;
        margin-top:8px;
        padding:10px;
        border-radius:10px;
        background:#0a1c2c;
      }

      @media(max-width:600px){

        #aire-v9-panel{
          margin-left:0;
          margin-right:0;
          padding:17px;
        }

        #aire-v9-panel .v9-grid{
          grid-template-columns:1fr;
        }

      }
    `;

    document.head.appendChild(style);

    panel =
      document.createElement("section");

    panel.id =
      "aire-v9-panel";

    panel.innerHTML = `

      <h2>🧪 Laboratoire d’Alpha</h2>

      <div class="v9-sub">
        Perception · préférences · mémoire · assemblage
      </div>

      <div class="v9-grid">

        <div class="v9-card">
          <span class="v9-label">
            Observations
          </span>
          <span
            id="v9-observations"
            class="v9-value"
          >0</span>
        </div>

        <div class="v9-card">
          <span class="v9-label">
            Expériences
          </span>
          <span
            id="v9-experiments"
            class="v9-value"
          >0</span>
        </div>

        <div class="v9-card">
          <span class="v9-label">
            Découvertes
          </span>
          <span
            id="v9-discoveries"
            class="v9-value"
          >0</span>
        </div>

        <div class="v9-card">
          <span class="v9-label">
            Assemblages réussis
          </span>
          <span
            id="v9-assemblies"
            class="v9-value"
          >0</span>
        </div>

      </div>

      <button id="v9-run">
        ▶ Lancer une expérience
      </button>

      <button id="v9-assemble">
        🧩 Tester un assemblage
      </button>

      <button id="v9-memory">
        🧠 Voir la mémoire récente
      </button>

      <div
        id="v9-status"
        class="v9-status"
      >
        Module expérimental prêt.
      </div>

      <div
        id="v9-objects"
        style="margin-top:14px"
      ></div>
    `;

    /*
      On place le module avant la fin du contenu.
      Cela évite de dépendre d'un identifiant précis
      dans l'ancienne interface.
    */

    const main =
      document.querySelector("main");

    if (main) {
      main.appendChild(panel);
    } else {
      document.body.appendChild(panel);
    }

    document
      .getElementById("v9-run")
      .addEventListener(
        "click",
        runExperiment
      );

    document
      .getElementById("v9-assemble")
      .addEventListener(
        "click",
        manualAssembly
      );

    document
      .getElementById("v9-memory")
      .addEventListener(
        "click",
        showMemory
      );

    render();
  }

  /* ------------------------------------------------------------
     ASSEMBLAGE MANUEL
     ------------------------------------------------------------ */

  function manualAssembly() {

    const objects =
      [...state.objects.values()]
        .filter(o => !o.derivedFrom);

    if (objects.length < 2) {
      runExperiment();
      return;
    }

    const a = objects[0];
    const b = objects[1];

    attemptAssembly(
      a.id,
      b.id
    );
  }

  /* ------------------------------------------------------------
     MEMOIRE
     ------------------------------------------------------------ */

  function showMemory() {

    const recent =
      state.memory
        .slice(-8)
        .reverse();

    const text =
      recent.length
        ? recent
            .map(
              x =>
                `${x.action} → ${x.result || ""}`
            )
            .join(" | ")
        : "Mémoire vide.";

    const status =
      document.getElementById(
        "v9-status"
      );

    if (status) {
      status.textContent =
        text;
    }
  }

  /* ------------------------------------------------------------
     RENDU
     ------------------------------------------------------------ */

  function render() {

    if (!panel) return;

    const set =
      (id, value) => {

        const el =
          document.getElementById(id);

        if (el) {
          el.textContent =
            value;
        }
      };

    set(
      "v9-observations",
      state.observations
    );

    set(
      "v9-experiments",
      state.experiments
    );

    set(
      "v9-discoveries",
      state.discoveries
    );

    set(
      "v9-assemblies",
      `${state.assembly.successes}/${state.assembly.attempts}`
    );

    const status =
      document.getElementById(
        "v9-status"
      );

    if (status) {

      status.innerHTML = `
        <strong>Dernière action :</strong>
        ${esc(state.lastAction)}
        <br>
        <strong>Objet :</strong>
        ${esc(state.lastObject)}
        <br>
        <strong>Résultat :</strong>
        ${esc(state.lastResult)}
      `;
    }

    const objectsEl =
      document.getElementById(
        "v9-objects"
      );

    if (!objectsEl) return;

    const objects =
      [...state.objects.values()]
        .slice(-8)
        .reverse();

    objectsEl.innerHTML =
      objects
        .map(obj => {

          const p =
            getPreference(obj.id);

          return `
            <div class="v9-object">

              <div>
                <strong>
                  ${esc(obj.type)}
                </strong>

                <div
                  style="
                    font-size:11px;
                    color:#8198a4;
                    margin-top:3px
                  "
                >
                  utilité
                  ${obj.utility.toFixed(2)}
                  · préférence
                  ${p.attraction.toFixed(2)}
                  ${obj.kept
                    ? " · conservé"
                    : ""}
                </div>
              </div>

              <button
                style="
                  width:auto;
                  margin:0;
                  padding:8px 10px;
                  font-size:12px
                "
                data-v9-object="${esc(obj.id)}"
              >
                ${
                  obj.kept
                    ? "Relâcher"
                    : "Garder"
                }
              </button>

            </div>
          `;
        })
        .join("");

    objectsEl
      .querySelectorAll(
        "[data-v9-object]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const id =
              button.dataset.v9Object;

            const obj =
              state.objects.get(id);

            if (!obj) return;

            interact(
              id,
              obj.kept
                ? "relacher"
                : "garder"
            );
          }
        );

      });
  }

  /* ------------------------------------------------------------
     API PUBLIQUE
     ------------------------------------------------------------ */

  window.AlphaLabV9 = {

    state,

    observe: observeObject,

    interact,

    registerObject,

    chooseAction,

    assemble: attemptAssembly,

    experiment: runExperiment,

    reset() {

      state.observations = 0;
      state.discoveries = 0;
      state.experiments = 0;

      state.memory = [];

      state.preferences = {};

      state.objects.clear();

      state.assembly = {
        attempts: 0,
        successes: 0,
        discoveries: 0
      };

      state.lastAction =
        "Réinitialisation";

      state.lastResult =
        "Laboratoire réinitialisé";

      render();
    }
  };

  /* ------------------------------------------------------------
     INITIALISATION
     ------------------------------------------------------------ */

  function bootV9() {

    createPanel();

    /*
      Première petite expérience contrôlée.
      Elle ne touche pas au moteur principal.
    */

    setTimeout(() => {

      if (
        window.AlphaLabV9 &&
        state.experiments === 0
      ) {
        runExperiment();
      }

    }, 1200);
  }

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      bootV9,
      { once: true }
    );

  } else {

    bootV9();

  }

})();
