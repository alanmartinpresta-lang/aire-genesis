/* ============================================================
   AIRE GENESIS — MONITEUR V5
   Environnement léger + caméra centrée + animations d'action
   + inventaire visuel + interface française.
   Couche d'affichage uniquement : ne modifie pas la physique.
   ============================================================ */

(() => {
  "use strict";

  if (window.AIRE_MONITEUR_V5) return;
  window.AIRE_MONITEUR_V5 = true;

  let lastState = null;
  let visualInventory = 0;
  let lastAction = "";

  const ACTIONS = {
    move_x: "Déplacement",
    move_y: "Déplacement",
    move_z: "Déplacement vertical",
    move: "Déplacement",
    grasp: "Ramassage",
    release: "Relâchement",
    intake: "Absorption",
    push: "Poussée",
    rest: "Repos",
    observe: "Observation"
  };

  const trAction = value => {
    const a = String(value || "").toLowerCase().replace(/[-_]/g, " ");

    for (const [key, label] of Object.entries(ACTIONS)) {
      if (a.includes(key.replace("_", " "))) {
        return label;
      }
    }

    return value || "Observation";
  };

  function getNumber(id) {
    const e = document.getElementById(id);

    if (!e) return 0;

    const m = String(e.textContent || "")
      .replace(",", ".")
      .match(/-?\d+(?:\.\d+)?/);

    return m ? Number(m[0]) : 0;
  }

  function getAction() {
    const e = document.getElementById("action");

    if (!e) return "";

    return String(
      e.dataset.aireV5Raw ||
      e.textContent ||
      ""
    ).trim();
  }

  function getPosition(state) {

    const candidates = [
      state?.position,
      state?.pos,
      state?.alpha?.position,
      state?.alpha?.pos,
      state?.self?.position,
      state?.self?.pos
    ];

    for (const p of candidates) {

      if (Array.isArray(p) && p.length >= 2) {

        return [
          Number(p[0]) || 0,
          Number(p[1]) || 0,
          Number(p[2]) || 0
        ];

      }

      if (p && typeof p === "object") {

        return [
          Number(p.x) || 0,
          Number(p.y) || 0,
          Number(p.z) || 0
        ];

      }
    }

    const text =
      document.getElementById("position")?.textContent || "";

    const n =
      text.match(/[-+]?\d+(?:\.\d+)?/g);

    return n && n.length >= 2
      ? [
          Number(n[0]) || 0,
          Number(n[1]) || 0,
          Number(n[2]) || 0
        ]
      : [0, 0, 0];
  }

  function getObjects(state) {

    const list =
      state?.objects ||
      state?.world?.objects ||
      [];

    return Array.isArray(list)
      ? list
      : [];
  }

  function objectPosition(o) {

    const p =
      o?.position ||
      o?.pos;

    if (Array.isArray(p)) {

      return [
        Number(p[0]) || 0,
        Number(p[1]) || 0,
        Number(p[2]) || 0
      ];

    }

    if (p && typeof p === "object") {

      return [
        Number(p.x) || 0,
        Number(p.y) || 0,
        Number(p.z) || 0
      ];

    }

    return [
      Number(o?.x) || 0,
      Number(o?.y) || 0,
      Number(o?.z) || 0
    ];
  }

  function objectLabel(o, index) {

    return String(
      o?.name ??
      o?.type ??
      o?.kind ??
      o?.label ??
      `Objet ${index + 1}`
    );
  }


  /* ============================================================
     STYLE
     ============================================================ */

  function installCSS() {

    if (document.getElementById("aire-v5-style")) {
      return;
    }

    const s =
      document.createElement("style");

    s.id =
      "aire-v5-style";

    s.textContent = `

      /* anciens rendus masqués */
      #aire-ground,
      #aire-alpha,
      #aire-alpha-label,
      #aire-v4-scene,
      #aire-v4-alpha,
      #aire-v4-alpha-label,
      #aire-scene-v3,
      #aire-alpha-v3 {
        display:none!important;
      }

      #world.aire-v5-world {
        height:300px!important;
        position:relative!important;
        overflow:hidden!important;
        border-radius:16px!important;
        background:#0a2029!important;
        isolation:isolate;
      }

      #aire-v5-camera {

        position:absolute;
        inset:-38%;

        overflow:hidden;

        z-index:1;

        transform:
          perspective(650px)
          rotateX(52deg)
          scale(1.02);

        transform-origin:50% 52%;

        will-change:transform;

        background:
          radial-gradient(
            circle at 50% 45%,
            #2b667033 0 7%,
            transparent 38%
          ),
          linear-gradient(
            145deg,
            #09202a,
            #123b43 55%,
            #0b252d
          );
      }

      #aire-v5-camera:before {

        content:"";

        position:absolute;
        inset:0;

        background:
          linear-gradient(
            #ffffff05 1px,
            transparent 1px
          ),
          linear-gradient(
            90deg,
            #ffffff05 1px,
            transparent 1px
          );

        background-size:
          56px 56px;

        opacity:.45;
      }


      /* zones de terrain */

      .aire-v5-ground {

        position:absolute;

        border-radius:50%;

        background:#1d555633;

        border:
          1px solid #67c9bd18;

        box-shadow:
          0 8px 12px #0005;
      }


      /* rochers */

      .aire-v5-rock {

        position:absolute;

        width:28px;
        height:18px;

        border-radius:
          45% 55% 35% 60%;

        background:
          linear-gradient(
            145deg,
            #66777b,
            #293a3f
          );

        box-shadow:
          0 5px 7px #0008;

        transform:
          translate(-50%,-50%);
      }


      /* végétation */

      .aire-v5-plant {

        position:absolute;

        width:20px;
        height:26px;

        transform:
          translate(-50%,-50%);
      }

      .aire-v5-plant:before,
      .aire-v5-plant:after {

        content:"";

        position:absolute;

        bottom:2px;

        width:8px;
        height:20px;

        border-radius:
          100% 0 100% 0;

        background:#387d69;
      }

      .aire-v5-plant:before {

        left:2px;

        transform:
          rotate(-25deg);
      }

      .aire-v5-plant:after {

        right:2px;

        transform:
          rotate(25deg)
          scaleX(-1);
      }


      /* objets */

      .aire-v5-object {

        position:absolute;

        width:20px;
        height:20px;

        border-radius:6px;

        background:
          linear-gradient(
            145deg,
            #f0cb7a,
            #a86e35
          );

        border:
          1px solid #ffe4a477;

        box-shadow:
          0 5px 8px #0009,
          0 0 10px #e8b96533;

        transform:
          translate(-50%,-50%)
          rotate(45deg);

        z-index:8;

        will-change:
          left,
          top;
      }

      .aire-v5-object:after {

        content:"";

        position:absolute;

        width:6px;
        height:6px;

        left:4px;
        top:4px;

        border-radius:2px;

        background:#fff7;
      }


      /* ========================================================
         ALPHA
         ======================================================== */

      #aire-v5-alpha {

        position:absolute;

        left:50%;
        top:58%;

        width:58px;
        height:84px;

        transform:
          translate(-50%,-50%);

        z-index:20;

        pointer-events:none;

        filter:
          drop-shadow(
            0 8px 9px #000b
          );
      }

      #aire-v5-alpha .head {

        position:absolute;

        left:15px;
        top:0;

        width:28px;
        height:31px;

        border:
          2px solid #dce7e8;

        border-radius:
          11px 11px 9px 9px;

        background:
          linear-gradient(
            145deg,
            #152126,
            #040809
          );

        box-shadow:
          0 0 15px #62e0c255;
      }

      #aire-v5-alpha .screen {

        position:absolute;

        left:6px;
        top:12px;

        width:12px;
        height:4px;

        border-radius:6px;

        background:#62e0c2;

        box-shadow:
          0 0 10px currentColor;
      }

      #aire-v5-alpha .body {

        position:absolute;

        left:11px;
        top:29px;

        width:36px;
        height:40px;

        border-radius:
          12px 12px 14px 14px;

        background:
          linear-gradient(
            135deg,
            #f1f4f3,
            #87979b 56%,
            #26353a
          );

        border:
          1px solid #e5eeee77;
      }

      #aire-v5-alpha .arm,
      #aire-v5-alpha .leg {

        position:absolute;

        border-radius:8px;

        background:#26353a;

        transform-origin:
          50% 5px;
      }

      #aire-v5-alpha .arm {

        width:9px;
        height:25px;
        top:33px;
      }

      #aire-v5-alpha .left-arm {

        left:2px;

        transform:
          rotate(12deg);
      }

      #aire-v5-alpha .right-arm {

        right:2px;

        transform:
          rotate(-12deg);
      }

      #aire-v5-alpha .leg {

        width:9px;
        height:23px;
        top:66px;
      }

      #aire-v5-alpha .left-leg {
        left:15px;
      }

      #aire-v5-alpha .right-leg {
        right:15px;
      }


      /* marche */

      #aire-v5-alpha.walk .left-leg {
        animation:
          aireV5WalkL
          .34s
          infinite
          alternate
          ease-in-out;
      }

      #aire-v5-alpha.walk .right-leg {
        animation:
          aireV5WalkR
          .34s
          infinite
          alternate
          ease-in-out;
      }

      #aire-v5-alpha.walk .left-arm {
        animation:
          aireV5ArmL
          .34s
          infinite
          alternate
          ease-in-out;
      }

      #aire-v5-alpha.walk .right-arm {
        animation:
          aireV5ArmR
          .34s
          infinite
          alternate
          ease-in-out;
      }

      #aire-v5-alpha.walk {
        animation:
          aireV5Body
          .34s
          infinite
          alternate
          ease-in-out;
      }


      /* saisir */

      #aire-v5-alpha.grasp .right-arm {

        animation:
          aireV5Grasp
          .65s
          ease-in-out;
      }


      /* relâcher */

      #aire-v5-alpha.release .right-arm {

        animation:
          aireV5Release
          .55s
          ease-in-out;
      }


      /* absorber */

      #aire-v5-alpha.intake .right-arm {

        animation:
          aireV5Intake
          .65s
          ease-in-out;
      }


      /* pousser */

      #aire-v5-alpha.push .left-arm,
      #aire-v5-alpha.push .right-arm {

        animation:
          aireV5Push
          .45s
          ease-in-out
          infinite
          alternate;
      }

      #aire-v5-alpha.push {

        animation:
          aireV5PushBody
          .45s
          ease-in-out
          infinite
          alternate;
      }


      /* états du casque */

      #aire-v5-alpha.alert .screen {
        background:#ff5d72;
      }

      #aire-v5-alpha.tired .screen {
        background:#ffc86b;
      }

      #aire-v5-alpha.action .screen {
        background:#8bb7ff;
      }

      #aire-v5-alpha.success .screen {
        background:#67e3a2;
      }


      /* animations */

      @keyframes aireV5WalkL {
        to {
          transform:
            rotate(24deg);
        }
      }

      @keyframes aireV5WalkR {
        to {
          transform:
            rotate(-24deg);
        }
      }

      @keyframes aireV5ArmL {
        to {
          transform:
            rotate(-18deg);
        }
      }

      @keyframes aireV5ArmR {
        to {
          transform:
            rotate(18deg);
        }
      }

      @keyframes aireV5Body {
        to {
          transform:
            translateY(-2px);
        }
      }

      @keyframes aireV5Grasp {

        50% {
          transform:
            rotate(55deg)
            translateY(5px);
        }

        100% {
          transform:
            rotate(5deg);
        }
      }

      @keyframes aireV5Release {

        50% {
          transform:
            rotate(-55deg);
        }

        100% {
          transform:
            rotate(-5deg);
        }
      }

      @keyframes aireV5Intake {

        50% {
          transform:
            rotate(65deg)
            translateY(-3px);
        }

        100% {
          transform:
            rotate(5deg);
        }
      }

      @keyframes aireV5Push {

        to {
          transform:
            rotate(32deg)
            translateY(3px);
        }
      }

      @keyframes aireV5PushBody {

        to {
          transform:
            translateX(2px);
        }
      }


      /* objet tenu */

      #aire-v5-carry {

        position:absolute;

        left:50%;
        top:42%;

        width:10px;
        height:10px;

        border-radius:3px;

        background:#f0cb7a;

        box-shadow:
          0 0 8px #f0cb7a;

        transform:
          translate(-50%,-50%);

        z-index:22;

        opacity:0;
      }

      #aire-v5-carry.show {

        opacity:1;

        animation:
          aireV5Carry
          .4s
          ease-in-out
          infinite
          alternate;
      }

      @keyframes aireV5Carry {

        to {
          transform:
            translate(-50%,-50%)
            scale(.82);
        }
      }


      /* panneau */

      .aire-v5-actions {

        display:flex;

        flex-wrap:wrap;

        gap:6px;

        margin-top:8px;
      }

      .aire-v5-actions button {

        min-height:34px!important;

        font-size:11px!important;

        padding:
          5px 10px!important;
      }

      .aire-v5-active {

        border-color:
          #62e0c2!important;

        color:
          #62e0c2!important;
      }


      /* inventaire */

      #aire-v5-inventory {

        display:grid;

        grid-template-columns:
          repeat(2,1fr);

        gap:7px;
      }

      .aire-v5-item {

        padding:9px;

        border:
          1px solid #203844;

        border-radius:10px;

        background:#091525;

        font-size:11px;
      }

      .aire-v5-item b {

        float:right;

        color:#62e0c2;
      }

      .aire-v5-info {

        margin-top:8px;

        color:#8196aa;

        font-size:10px;
      }

      @media(max-width:560px){

        #world.aire-v5-world {
          height:300px!important;
        }

      }
    `;

    document.head.appendChild(s);
  }


  /* ============================================================
     TRADUCTION
     ============================================================ */

  function translateInterface() {

    const map = {

      "Intake":
        "Absorber",

      "Push":
        "Pousser",

      "Grasp":
        "Saisir",

      "Release":
        "Relâcher",

      "→ X+":
        "→ Droite",

      "← X−":
        "← Gauche",

      "↑ Y+":
        "↑ Avant",

      "↓ Y−":
        "↓ Arrière",

      "↥ Z+":
        "↥ Haut"
    };

    document
      .querySelectorAll("button")
      .forEach(b => {

        const t =
          (b.textContent || "").trim();

        if (map[t]) {
          b.textContent = map[t];
        }

      });


    const action =
      document.getElementById("action");

    if (
      action &&
      !action.dataset.aireV5
    ) {

      action.dataset.aireV5 = "1";

      action.dataset.aireV5Raw =
        action.textContent || "";

      const observer =
        new MutationObserver(() => {

          if (
            !action.dataset.aireV5Raw ||
            /^(Déplacement|Ramassage|Relâchement|Absorption|Poussée|Repos|Observation)$/
              .test(action.dataset.aireV5Raw)
          ) {

            action.dataset.aireV5Raw =
              action.textContent || "";
          }

          const translated =
            trAction(
              action.dataset.aireV5Raw
            );

          if (
            action.textContent !==
            translated
          ) {

            action.textContent =
              translated;
          }

        });

      observer.observe(
        action,
        {
          childList:true,
          characterData:true,
          subtree:true
        }
      );
    }
  }


  /* ============================================================
     CRÉATION DU MONDE
     ============================================================ */

  function ensureUI() {

    const world =
      document.getElementById("world");

    if (!world) return;

    installCSS();

    translateInterface();

    world.classList.add(
      "aire-v5-world"
    );


    let camera =
      document.getElementById(
        "aire-v5-camera"
      );


    if (
      !camera ||
      camera.parentElement !== world
    ) {

      world
        .querySelectorAll(
          "#aire-v5-camera,#aire-v5-alpha,#aire-v5-carry"
        )
        .forEach(e => e.remove());


      camera =
        document.createElement("div");

      camera.id =
        "aire-v5-camera";

      world.appendChild(camera);


      /* éléments de décor légers */

      const decor = [

        [18,70,78,40,"ground"],
        [72,26,64,34,"ground"],
        [46,18,54,30,"ground"],
        [81,66,46,24,"ground"],
        [28,25,42,22,"ground"],
        [55,82,70,34,"ground"],

        [34,58,24,18,"rock"],
        [70,48,24,18,"rock"],

        [57,30,20,25,"plant"],
        [24,43,20,25,"plant"]
      ];


      decor.forEach(
        ([x,y,w,h,type]) => {

          const e =
            document.createElement("div");

          e.className =
            type === "rock"
              ? "aire-v5-rock"
              : type === "plant"
                ? "aire-v5-plant"
                : "aire-v5-ground";

          e.style.left =
            x + "%";

          e.style.top =
            y + "%";


          if (
            type === "ground"
          ) {

            e.style.width =
              w + "px";

            e.style.height =
              h + "px";
          }

          camera.appendChild(e);
        }
      );


      /* Alpha */

      const alpha =
        document.createElement("div");

      alpha.id =
        "aire-v5-alpha";

      alpha.innerHTML = `

        <div class="head">
          <div class="screen"></div>
        </div>

        <div class="body"></div>

        <i class="arm left-arm"></i>
        <i class="arm right-arm"></i>

        <i class="leg left-leg"></i>
        <i class="leg right-leg"></i>
      `;

      world.appendChild(alpha);


      /* objet tenu */

      const carry =
        document.createElement("div");

      carry.id =
        "aire-v5-carry";

      world.appendChild(carry);
    }


    /* panneau suivi */

    let panel =
      document.getElementById(
        "aire-v5-panel"
      );


    if (!panel) {

      panel =
        document.createElement("div");

      panel.id =
        "aire-v5-panel";

      panel.className =
        "aire-v5-actions";

      panel.innerHTML = `

        <button
          id="aire-v5-follow"
          class="aire-v5-active">
          ● Suivi Alpha
        </button>

        <button
          id="aire-v5-center">
          ◎ Recentrer
        </button>

        <span class="muted">
          Environnement léger
        </span>
      `;


      const card =
        world.closest(".card");

      if (card) {
        card.appendChild(panel);
      }


      document
        .getElementById(
          "aire-v5-follow"
        )
        .onclick = () => {

          const b =
            document.getElementById(
              "aire-v5-follow"
            );

          b.classList.toggle(
            "aire-v5-active"
          );
        };


      document
        .getElementById(
          "aire-v5-center"
        )
        .onclick = () => {

          const c =
            document.getElementById(
              "aire-v5-camera"
            );

          if (c) {

            c.style.transform =
              "perspective(650px) " +
              "rotateX(52deg) " +
              "scale(1.02)";
          }
        };
    }


    /* inventaire */

    if (
      !document.getElementById(
        "aire-v5-inventory"
      )
    ) {

      const section =
        document.createElement("section");

      section.className =
        "card";

      section.id =
        "aire-v5-inventory-card";

      section.innerHTML = `

        <div class="sectionhead">

          <h2>Inventaire</h2>

          <span class="muted">
            objets conservés
          </span>

        </div>

        <div id="aire-v5-inventory">

          <div class="aire-v5-item">
            Aucun objet conservé
            <b>—</b>
          </div>

        </div>

        <div class="aire-v5-info">
          Représentation visuelle
          synchronisée avec les actions observées.
        </div>
      `;


      const card =
        world.closest(".card");

      if (
        card &&
        card.parentNode
      ) {

        card.parentNode.insertBefore(
          section,
          card.nextSibling
        );
      }
    }
  }


  /* ============================================================
     RENDU
     ============================================================ */

  function render(state) {

    ensureUI();


    const world =
      document.getElementById("world");

    const camera =
      document.getElementById(
        "aire-v5-camera"
      );

    const alpha =
      document.getElementById(
        "aire-v5-alpha"
      );


    if (
      !world ||
      !camera ||
      !alpha
    ) {
      return;
    }


    const pos =
      getPosition(state);

    const ax =
      pos[0];

    const ay =
      pos[1];


    /*
       Alpha reste TOUJOURS au centre.
       Le décor se déplace autour de lui.
    */

    alpha.style.left =
      "50%";

    alpha.style.top =
      "58%";


    const cameraX =
      Math.max(
        -14,
        Math.min(
          14,
          -ax * 0.18
        )
      );


    const cameraY =
      Math.max(
        -11,
        Math.min(
          11,
          ay * 0.14
        )
      );


    camera.style.transform =
      `perspective(650px)
       rotateX(52deg)
       scale(1.02)
       translate(${cameraX}%,${cameraY}%)`;


    /* objets réels */

    camera
      .querySelectorAll(
        ".aire-v5-object"
      )
      .forEach(
        e => e.remove()
      );


    const objects =
      getObjects(state);


    objects.forEach(
      (o,i) => {

        const [
          ox,
          oy
        ] =
          objectPosition(o);


        const dx =
          (ox - ax) * 0.38;

        const dy =
          (ay - oy) * 0.30;


        const x =
          50 + dx;

        const y =
          50 + dy;


        if (
          x < -10 ||
          x > 110 ||
          y < -10 ||
          y > 110
        ) {
          return;
        }


        const e =
          document.createElement("div");

        e.className =
          "aire-v5-object";

        e.title =
          objectLabel(o,i);

        e.style.left =
          x + "%";

        e.style.top =
          y + "%";


        camera.appendChild(e);
      }
    );


    /* action */

    const actionRaw =
      String(
        state?.action ??
        getAction()
      ).toLowerCase();


    const action =
      trAction(actionRaw);


    if (
      actionRaw !==
      lastAction
    ) {

      lastAction =
        actionRaw;


      if (
        actionRaw.includes("grasp")
      ) {

        visualInventory =
          Math.min(
            99,
            visualInventory + 1
          );

      } else if (
        actionRaw.includes("release") ||
        actionRaw.includes("intake")
      ) {

        visualInventory =
          Math.max(
            0,
            visualInventory - 1
          );
      }
    }


    alpha.classList.remove(
      "walk",
      "grasp",
      "release",
      "intake",
      "push",
      "alert",
      "tired",
      "action",
      "success"
    );


    if (
      actionRaw.includes("grasp")
    ) {

      alpha.classList.add(
        "grasp",
        "action"
      );

    } else if (
      actionRaw.includes("release")
    ) {

      alpha.classList.add(
        "release",
        "action"
      );

    } else if (
      actionRaw.includes("intake")
    ) {

      alpha.classList.add(
        "intake",
        "action"
      );

    } else if (
      actionRaw.includes("push")
    ) {

      alpha.classList.add(
        "push",
        "action"
      );

    } else if (
      actionRaw.includes("move")
    ) {

      alpha.classList.add(
        "walk",
        "action"
      );
    }


    if (
      getNumber("pain") > 20
    ) {

      alpha.classList.add(
        "alert"
      );

    } else if (
      getNumber("fat") > 50
    ) {

      alpha.classList.add(
        "tired"
      );
    }


    const carry =
      document.getElementById(
        "aire-v5-carry"
      );


    if (carry) {

      carry.classList.toggle(
        "show",
        actionRaw.includes("grasp") &&
        visualInventory > 0
      );
    }


    /* inventaire */

    const inv =
      document.getElementById(
        "aire-v5-inventory"
      );


    if (inv) {

      const modelInventory =
        state?.inventory ??
        state?.inventaire ??
        state?.stored_objects ??
        null;


      if (
        Array.isArray(
          modelInventory
        )
      ) {

        inv.innerHTML =
          modelInventory.length

          ? modelInventory
              .map(
                (x,i) =>
                  `<div class="aire-v5-item">
                    ${String(
                      x?.name ??
                      x?.type ??
                      `Objet ${i+1}`
                    )}
                    <b>1</b>
                  </div>`
              )
              .join("")

          : `
              <div class="aire-v5-item">
                Aucun objet conservé
                <b>—</b>
              </div>
            `;

      } else {

        inv.innerHTML =
          visualInventory

          ? `
              <div class="aire-v5-item">
                Objet conservé
                <b>${visualInventory}</b>
              </div>
            `

          : `
              <div class="aire-v5-item">
                Aucun objet conservé
                <b>—</b>
              </div>
            `;
      }
    }


    /* coordonnées */

    const posEl =
      document.getElementById(
        "position"
      );


    if (posEl) {

      posEl.textContent =
        `x ${ax.toFixed(3)}
         · y ${ay.toFixed(3)}
         · z ${pos[2].toFixed(3)}`;
    }


    const actionEl =
      document.getElementById(
        "action"
      );


    if (actionEl) {

      actionEl.dataset.aireV5Raw =
        String(
          state?.action ??
          actionEl.dataset.aireV5Raw ??
          action
        );

      actionEl.textContent =
        action;
    }


    lastState =
      state;
  }


  /* ============================================================
     CONNEXION AU MOTEUR
     ============================================================ */

  function wrapDrawWorld() {

    if (
      typeof window.drawWorld !==
      "function"
    ) {
      return;
    }


    if (
      window.drawWorld.__AIRE_V5__
    ) {
      return;
    }


    const original =
      window.drawWorld;


    function wrapped(state) {

      /*
         1. Le moteur original travaille.
         2. Les couches précédentes travaillent.
         3. V5 dessine seulement l'interface.
      */

      original(state);

      render(state);
    }


    wrapped.__AIRE_V5__ =
      true;

    wrapped.__AIRE_V5_ORIGINAL__ =
      original;


    window.drawWorld =
      wrapped;
  }


  /* ============================================================
     DÉMARRAGE
     ============================================================ */

  function boot() {

    installCSS();

    ensureUI();

    wrapDrawWorld();

    render(
      lastState || {}
    );

    translateInterface();
  }


  const observer =
    new MutationObserver(
      () => {

        ensureUI();

        translateInterface();

        wrapDrawWorld();
      }
    );


  observer.observe(
    document.documentElement,
    {
      childList:true,
      subtree:true,
      characterData:true
    }
  );


  setInterval(
    () => {

      ensureUI();

      translateInterface();

      wrapDrawWorld();

      if (lastState) {
        render(lastState);
      }

    },
    700
  );


  boot();


  console.log(
    "AIRE Moniteur V5 actif"
  );

})();
