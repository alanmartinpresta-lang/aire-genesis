/* ============================================================
   AIRE — EXPÉRIENCE 01 : ÉMERGENCE DE L'ASSEMBLAGE
   ------------------------------------------------------------
   Module d'observation expérimental.

   IMPORTANT :
   - aucune récompense d'assemblage n'est ajoutée ;
   - aucune préférence n'est imposée à Alpha ;
   - aucune modification du code du moteur ;
   - les données observées sont conservées pour analyse.
   ============================================================ */

(() => {
  "use strict";

  if (window.AIRE_ASSEMBLY_EXPERIMENT_V1) return;
  window.AIRE_ASSEMBLY_EXPERIMENT_V1 = true;

  const EXP = {
    id: "assembly_emergence_v1",
    version: 1,
    startedAt: new Date().toISOString(),
    phase: "APPRENTISSAGE",
    step: 0,

    minAssemblyDistance: 1.25,
    maxAssemblyDistance: 1.75,
    preferenceWindow: 40,

    trials: [],
    transitions: [],
    assemblyEvents: [],
    preferences: {},

    counts: {
      totalSteps: 0,
      interactions: 0,
      successfulAssemblies: 0,
      candidateAssemblies: 0
    }
  };

  window.AIRE_ASSEMBLY_EXPERIMENT = EXP;

  const $ = id =>
    document.getElementById(id);


  /* ==========================================================
     ACCÈS À L'ÉTAT AIRE
     ========================================================== */

  function state() {
    return (
      window.last ||
      window.aireState ||
      {}
    );
  }


  function posOf(o) {

    const p =
      o?.position ||
      o?.pos;

    if (Array.isArray(p)) {

      return [
        +(p[0] || 0),
        +(p[1] || 0),
        +(p[2] || 0)
      ];
    }

    if (
      p &&
      typeof p === "object"
    ) {

      return [
        +(p.x || 0),
        +(p.y || 0),
        +(p.z || 0)
      ];
    }

    return [
      +(o?.x || 0),
      +(o?.y || 0),
      +(o?.z || 0)
    ];
  }


  function distance(a, b) {

    const dx =
      a[0] - b[0];

    const dy =
      a[1] - b[1];

    const dz =
      a[2] - b[2];

    return Math.sqrt(
      dx * dx +
      dy * dy +
      dz * dz
    );
  }


  function objects(s) {

    const list =
      s?.objects ||
      s?.world?.objects ||
      s?.environment?.objects ||
      [];

    return Array.isArray(list)
      ? list
      : [];
  }


  function objectId(o, i) {

    return String(
      o?.id ??
      o?.uid ??
      o?.uuid ??
      o?.name ??
      o?.label ??
      `${o?.type || "object"}_${i}`
    );
  }


  function objectType(o) {

    return String(
      o?.type ??
      o?.kind ??
      o?.category ??
      o?.name ??
      "unknown"
    ).toLowerCase();
  }


  function alphaPosition(s) {

    const p =
      s?.position ||
      s?.pos ||
      s?.alpha?.position ||
      s?.alpha?.pos;

    if (p) {

      return posOf({
        position: p
      });
    }

    return [
      0,
      0,
      0
    ];
  }


  /* ==========================================================
     DÉTECTION D'UN RAPPROCHEMENT ENTRE OBJETS
     ========================================================== */

  /*
    Cette fonction OBSERVE uniquement.

    Elle ne dit jamais à Alpha :
      "assemble A+B".

    Elle détecte seulement lorsqu'une paire d'objets
    de catégories différentes se retrouve suffisamment proche.
  */

  function detectAssemblies(s) {

    const list =
      objects(s);

    for (
      let i = 0;
      i < list.length;
      i++
    ) {

      for (
        let j = i + 1;
        j < list.length;
        j++
      ) {

        const a =
          list[i];

        const b =
          list[j];

        const d =
          distance(
            posOf(a),
            posOf(b)
          );

        if (
          d >=
            EXP.minAssemblyDistance &&
          d <=
            EXP.maxAssemblyDistance
        ) {
          continue;
        }

        if (
          objectType(a) ===
          objectType(b)
        ) {
          continue;
        }

        const event = {

          step:
            EXP.step,

          time:
            Date.now(),

          a:
            objectId(a, i),

          b:
            objectId(b, j),

          typeA:
            objectType(a),

          typeB:
            objectType(b),

          distance:
            Number(
              d.toFixed(4)
            ),

          alphaPosition:
            alphaPosition(s)
        };


        const previous =
          EXP.assemblyEvents[
            EXP.assemblyEvents.length - 1
          ];


        /*
          Une deuxième observation consécutive
          de la même paire est considérée comme
          un événement potentiellement stable.

          Ce n'est toujours PAS une récompense.
        */

        if (
          previous &&
          previous.a ===
            event.a &&
          previous.b ===
            event.b
        ) {

          event.stable =
            true;

          EXP.counts
            .successfulAssemblies++;

        } else {

          event.stable =
            false;

          EXP.counts
            .candidateAssemblies++;
        }


        EXP.assemblyEvents
          .push(event);


        if (
          EXP.assemblyEvents.length >
          1000
        ) {

          EXP.assemblyEvents.shift();
        }
      }
    }
  }


  /* ==========================================================
     ACTION / RÉCOMPENSE OBSERVÉES
     ========================================================== */

  function actionOf(s) {

    return String(

      s?.action ??

      s?.last_action ??

      s?.lastAction ??

      $("action")?.textContent ??

      ""

    );
  }


  function rewardOf(s) {

    const candidates = [

      s?.reward,

      s?.last_reward,

      s?.learning?.reward,

      s?.q?.reward

    ];


    for (
      const value of candidates
    ) {

      if (
        typeof value ===
          "number" &&
        Number.isFinite(value)
      ) {

        return value;
      }
    }


    return null;
  }


  /* ==========================================================
     ENREGISTREMENT D'UNE ÉTAPE
     ========================================================== */

  function recordStep(s) {

    const action =
      actionOf(s);

    const reward =
      rewardOf(s);

    const p =
      alphaPosition(s);


    const row = {

      step:
        EXP.step,

      time:
        Date.now(),

      action:

        action,

      reward:

        reward,

      alphaPosition:

        p,

      objectCount:

        objects(s).length
    };


    EXP.trials.push(
      row
    );


    if (
      EXP.trials.length >
      5000
    ) {

      EXP.trials.shift();
    }


    if (action) {

      EXP.counts
        .interactions++;
    }
  }


  /* ==========================================================
     ANALYSE DES ACTIONS FRÉQUENTES
     ========================================================== */

  function analyzePreferences() {

    const rows =
      EXP.trials;

    if (
      rows.length <
      EXP.preferenceWindow
    ) {

      return;
    }


    const recent =
      rows.slice(
        -EXP.preferenceWindow
      );


    const counts =
      {};


    for (
      const row of recent
    ) {

      const a =
        row.action.trim();

      if (!a) {
        continue;
      }


      counts[a] =
        (counts[a] || 0) +
        1;
    }


    EXP.preferences =
      Object.fromEntries(

        Object.entries(
          counts
        ).sort(
          (a, b) =>
            b[1] - a[1]
        )
      );
  }


  /* ==========================================================
     SNAPSHOT
     ========================================================== */

  function snapshot() {

    return {

      experiment:
        EXP.id,

      version:
        EXP.version,

      phase:
        EXP.phase,

      step:
        EXP.step,

      counts:
        {
          ...EXP.counts
        },

      preferences:
        {
          ...EXP.preferences
        },

      lastAssembly:
        EXP.assemblyEvents.at(-1) ||
        null,

      timestamp:
        new Date().toISOString()
    };
  }


  /* ==========================================================
     EXPORT DES DONNÉES
     ========================================================== */

  function downloadResults() {

    const payload = {

      experiment:
        EXP,

      exportedAt:
        new Date().toISOString()
    };


    const blob =
      new Blob(
        [
          JSON.stringify(
            payload,
            null,
            2
          )
        ],
        {
          type:
            "application/json"
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const a =
      document.createElement(
        "a"
      );


    a.href =
      url;

    a.download =
      `aire_${EXP.id}_${Date.now()}.json`;


    a.click();


    setTimeout(
      () =>
        URL.revokeObjectURL(
          url
        ),
      1000
    );
  }


  window.AIRE_ASSEMBLY_EXPORT =
    downloadResults;


  window.AIRE_ASSEMBLY_SNAPSHOT =
    snapshot;


  /* ==========================================================
     PANNEAU EXPÉRIMENTAL
     ========================================================== */

  function createPanel() {

    if (
      $("aire-assembly-panel")
    ) {
      return;
    }


    const panel =
      document.createElement(
        "section"
      );


    panel.id =
      "aire-assembly-panel";


    panel.innerHTML = `

      <div
        class="aire-assembly-head">

        <strong>
          EXPÉRIENCE 01 —
          ÉMERGENCE DE L'ASSEMBLAGE
        </strong>

        <span
          id="aire-assembly-status">

          APPRENTISSAGE

        </span>

      </div>


      <div
        class="aire-assembly-grid">

        <div>

          <small>
            ÉTAPES
          </small>

          <b
            id="aire-assembly-steps">
            0
          </b>

        </div>


        <div>

          <small>
            INTERACTIONS
          </small>

          <b
            id="aire-assembly-interactions">
            0
          </b>

        </div>


        <div>

          <small>
            CANDIDATURES
          </small>

          <b
            id="aire-assembly-candidates">
            0
          </b>

        </div>


        <div>

          <small>
            ASSEMBLAGES STABLES
          </small>

          <b
            id="aire-assembly-success">
            0
          </b>

        </div>

      </div>


      <div
        class="aire-assembly-actions">

        <button
          id="aire-assembly-export">

          Exporter les données

        </button>


        <button
          id="aire-assembly-phase">

          Passer en phase TEST

        </button>

      </div>


      <pre
        id="aire-assembly-log">

En attente des données du moteur AIRE…

      </pre>
    `;


    const target =
      $("aire-v7-bottom") ||
      $("world")?.parentNode;


    if (target) {

      target.parentNode.insertBefore(
        panel,
        target.nextSibling
      );
    }


    $("aire-assembly-export").onclick =
      downloadResults;


    $("aire-assembly-phase").onclick =
      () => {

        EXP.phase =
          EXP.phase ===
            "APPRENTISSAGE"

            ? "TEST"

            : "APPRENTISSAGE";


        updatePanel();
      };
  }


  /* ==========================================================
     STYLE DU PANNEAU
     ========================================================== */

  function installCSS() {

    if (
      $("aire-assembly-style")
    ) {

      return;
    }


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "aire-assembly-style";


    style.textContent = `

      #aire-assembly-panel {

        margin-top:
          10px;

        padding:
          14px;

        border:
          1px solid #34505d;

        border-radius:
          14px;

        background:
          #071722;

        color:
          #dbeaf0;
      }


      .aire-assembly-head {

        display:
          flex;

        justify-content:
          space-between;

        gap:
          10px;

        align-items:
          center;

        font-size:
          12px;
      }


      #aire-assembly-status {

        padding:
          5px 8px;

        border-radius:
          8px;

        border:
          1px solid #62e0c277;

        color:
          #62e0c2;

        font-size:
          10px;
      }


      .aire-assembly-grid {

        display:
          grid;

        grid-template-columns:
          repeat(4,1fr);

        gap:
          7px;

        margin-top:
          10px;
      }


      .aire-assembly-grid div {

        padding:
          9px;

        border-radius:
          9px;

        background:
          #0c202d;
      }


      .aire-assembly-grid small {

        display:
          block;

        color:
          #78909c;

        font-size:
          9px;
      }


      .aire-assembly-grid b {

        display:
          block;

        margin-top:
          3px;

        font-size:
          15px;
      }


      .aire-assembly-actions {

        display:
          flex;

        gap:
          7px;

        margin-top:
          10px;
      }


      .aire-assembly-actions button {

        padding:
          9px 11px;

        border-radius:
          9px;

        border:
          1px solid #31566a;

        background:
          #122c3d;

        color:
          #eaf7fa;

        font-weight:
          700;
      }


      #aire-assembly-log {

        margin:
          10px 0 0;

        padding:
          9px;

        max-height:
          150px;

        overflow:
          auto;

        border-radius:
          9px;

        background:
          #050f16;

        color:
          #8da8b4;

        font-size:
          10px;

        white-space:
          pre-wrap;
      }


      @media(max-width:760px) {

        .aire-assembly-grid {

          grid-template-columns:
            1fr 1fr;
        }


        .aire-assembly-actions {

          flex-direction:
            column;
        }
      }

    `;


    document.head.appendChild(
      style
    );
  }


  /* ==========================================================
     MISE À JOUR DU PANNEAU
     ========================================================== */

  function updatePanel() {

    const snap =
      snapshot();


    const set =
      (
        id,
        value
      ) => {

        const e =
          $(id);

        if (e) {

          e.textContent =
            String(value);
        }
      };


    set(
      "aire-assembly-status",
      EXP.phase
    );


    set(
      "aire-assembly-steps",
      EXP.counts.totalSteps
    );


    set(
      "aire-assembly-interactions",
      EXP.counts.interactions
    );


    set(
      "aire-assembly-candidates",
      EXP.counts.candidateAssemblies
    );


    set(
      "aire-assembly-success",
      EXP.counts.successfulAssemblies
    );


    const log =
      $("aire-assembly-log");


    if (!log) {
      return;
    }


    const top =
      Object.entries(
        snap.preferences
      ).slice(0, 6);


    log.textContent = [

      `Phase : ${snap.phase}`,

      `Étapes : ${snap.step}`,

      "",

      "Actions les plus fréquentes :",

      ...(
        top.length

          ? top.map(
              ([a, n]) =>
                `• ${a} : ${n}`
            )

          : [
              "• aucune donnée"
            ]
      ),

      "",

      "Dernier événement d'assemblage :",

      snap.lastAssembly

        ? JSON.stringify(
            snap.lastAssembly
          )

        : "aucun"

    ].join("\n");
  }


  /* ==========================================================
     TICK EXPÉRIMENTAL
     ========================================================== */

  function tick() {

    const s =
      state();


    EXP.step++;

    EXP.counts.totalSteps++;


    recordStep(
      s
    );


    detectAssemblies(
      s
    );


    analyzePreferences();


    updatePanel();
  }


  /* ==========================================================
     INITIALISATION
     ========================================================== */

  function start() {

    installCSS();

    createPanel();


    /*
      OBSERVATION UNIQUEMENT.

      Le moteur AIRE continue à décider
      et à évoluer selon ses propres règles.
    */

    setInterval(
      tick,
      250
    );


    console.log(
      "[AIRE] Expérience assemblage V1 active."
    );
  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      () =>
        setTimeout(
          start,
          700
        ),
      {
        once:true
      }
    );

  } else {

    setTimeout(
      start,
      700
    );
  }

})();
