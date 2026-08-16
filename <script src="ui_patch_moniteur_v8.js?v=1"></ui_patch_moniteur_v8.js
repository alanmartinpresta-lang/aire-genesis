/* ============================================================
   AIRE GENESIS — MONITEUR V8
   Fluidité + vitesse réelle + environnement enrichi.
   Le moteur AIRE reste autoritaire : cette couche ne fabrique
   aucune décision cognitive ni aucun état biologique.
   ============================================================ */
(() => {
  "use strict";

  if (window.AIRE_MONITEUR_V8) return;
  window.AIRE_MONITEUR_V8 = true;

  const $ = id => document.getElementById(id);
  let timer = null;
  let running = false;
  let speedMs = 80;
  let decorLayer = null;
  let smoothMap = new Map();

  function state() {
    return window.last || window.aireState || {};
  }

  function posOf(o) {
    const p = o?.position || o?.pos;

    if (Array.isArray(p)) {
      return [
        +(p[0] || 0),
        +(p[1] || 0),
        +(p[2] || 0)
      ];
    }

    if (p && typeof p === "object") {
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

  function alphaPos() {
    const s = state();

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

    const text =
      $("position")?.textContent || "";

    const n =
      text.match(
        /[-+]?\d+(?:[.,]\d+)?/g
      ) || [];

    return n.length >= 2
      ? n
          .slice(0, 3)
          .map(
            x => +x.replace(",", ".")
          )
      : [0, 0, 0];
  }

  function project(dx, dy, dz) {
    const scale = 7.5;

    return [
      50 +
        dx * scale -
        dy * scale * .42,

      58 -
        dy * scale * .72 -
        dx * scale * .22 -
        dz * 3.2
    ];
  }

  function installCSS() {
    if ($("aire-v8-style")) return;

    const style =
      document.createElement("style");

    style.id =
      "aire-v8-style";

    style.textContent = `

      /* =====================================================
         ALPHA — CENTRE CAMÉRA
         ===================================================== */

      #aire-v7-alpha {
        left:50% !important;
        top:59% !important;

        transform:
          translate3d(
            -50%,
            -50%,
            0
          ) !important;

        will-change:
          transform;
      }


      /* =====================================================
         RENDU FLUIDE
         ===================================================== */

      #aire-v7-scene,
      #aire-v7-alpha,
      .aire-v7-object,
      .aire-v7-rock,
      .aire-v7-tree,
      .aire-v7-plant,
      .aire-v7-flower,
      .aire-v7-water,
      .aire-v8-decor {

        -webkit-transform:
          translateZ(0);

        backface-visibility:
          hidden;
      }


      .aire-v7-object,
      .aire-v7-rock,
      .aire-v7-tree,
      .aire-v7-plant,
      .aire-v7-flower,
      .aire-v7-water {

        transition:
          left .18s linear,
          top .18s linear,
          opacity .18s linear;
      }


      /* =====================================================
         CONTRÔLE DE VITESSE
         ===================================================== */

      #aire-v8-controls {

        display:flex;

        align-items:center;
        justify-content:space-between;

        gap:8px;

        flex-wrap:wrap;

        margin:
          10px 0;

        padding:
          10px 12px;

        border:
          1px solid #29424d;

        border-radius:
          14px;

        background:
          #081722;
      }


      #aire-v8-controls .v8-title {

        color:
          #d9edf3;

        font-size:
          12px;

        font-weight:
          800;

        letter-spacing:
          .08em;
      }


      #aire-v8-controls .v8-sub {

        color:
          #8196aa;

        font-size:
          10px;

        display:
          block;

        margin-top:
          2px;
      }


      #aire-v8-controls .v8-buttons {

        display:flex;

        gap:
          6px;
      }


      #aire-v8-controls button {

        min-height:
          38px;

        padding:
          7px 11px;

        border-radius:
          10px;

        border:
          1px solid #2d526a;

        background:
          #122b3e;

        color:
          #eef8fb;

        font-weight:
          800;
      }


      #aire-v8-controls button.active {

        border-color:
          #62e0c2;

        color:
          #62e0c2;

        box-shadow:
          0 0 12px #62e0c222;
      }


      /* =====================================================
         DÉCOR V8
         ===================================================== */

      #aire-v8-decor-layer {

        position:
          absolute;

        inset:
          0;

        pointer-events:
          none;

        z-index:
          5;
      }


      .aire-v8-decor {

        position:
          absolute;

        transform:
          translate(
            -50%,
            -50%
          );

        transition:
          left .28s linear,
          top .28s linear;
      }


      /* Buissons */

      .v8-bush {

        width:
          34px;

        height:
          22px;

        border-radius:
          50%;

        background:
          radial-gradient(
            circle at 30% 35%,
            #8ab86a,
            #3c7347 60%,
            #234d37
          );

        box-shadow:
          0 7px 10px #0006;
      }


      /* Fleurs */

      .v8-flower {

        width:
          10px;

        height:
          10px;

        border-radius:
          50%;

        background:
          #e4a5d9;

        box-shadow:
          0 0 8px #fff7;
      }


      /* Bois */

      .v8-log {

        width:
          39px;

        height:
          12px;

        border-radius:
          8px;

        background:
          linear-gradient(
            90deg,
            #6b482f,
            #a8794d,
            #513522
          );

        transform:
          translate(
            -50%,
            -50%
          )
          rotate(-12deg);

        box-shadow:
          0 6px 8px #0006;
      }


      /* Champignons */

      .v8-mushroom {

        width:
          18px;

        height:
          14px;
      }


      .v8-mushroom:before {

        content:
          "";

        position:
          absolute;

        left:
          3px;

        top:
          0;

        width:
          12px;

        height:
          8px;

        border-radius:
          10px 10px 4px 4px;

        background:
          #c86c62;
      }


      .v8-mushroom:after {

        content:
          "";

        position:
          absolute;

        left:
          7px;

        top:
          7px;

        width:
          5px;

        height:
          8px;

        border-radius:
          3px;

        background:
          #e7d4b7;
      }


      /* Roseaux */

      .v8-reed {

        width:
          18px;

        height:
          28px;
      }


      .v8-reed:before,
      .v8-reed:after {

        content:
          "";

        position:
          absolute;

        bottom:
          0;

        width:
          5px;

        height:
          26px;

        border-radius:
          8px;

        background:
          #4d9367;
      }


      .v8-reed:before {

        left:
          3px;

        transform:
          rotate(-12deg);
      }


      .v8-reed:after {

        right:
          3px;

        transform:
          rotate(12deg);
      }


      /* Galets */

      .v8-pebble {

        width:
          16px;

        height:
          10px;

        border-radius:
          50%;

        background:
          linear-gradient(
            145deg,
            #c2c1b6,
            #5e6868
          );

        box-shadow:
          0 5px 7px #0006;
      }


      /* Eau */

      .v8-water {

        width:
          120px;

        height:
          58px;

        border-radius:
          50%;

        background:
          linear-gradient(
            145deg,
            #2b91a1aa,
            #0b526899
          );

        box-shadow:
          inset
          0 0 18px
          #8eefff33;
      }


      /* =====================================================
         MOBILE
         ===================================================== */

      @media(max-width:760px) {

        #aire-v8-controls {

          align-items:
            flex-start;
        }

        #aire-v8-controls .v8-buttons {

          width:
            100%;
        }

        #aire-v8-controls button {

          flex:
            1;
        }
      }

    `;

    document.head.appendChild(style);
  }


  /* ==========================================================
     BOUTONS DE VITESSE
     ========================================================== */

  function addControls() {

    if ($("aire-v8-controls")) {
      return;
    }

    const world =
      $("world");

    if (!world) {
      return;
    }

    const box =
      document.createElement("div");

    box.id =
      "aire-v8-controls";

    box.innerHTML = `

      <div>

        <span class="v8-title">
          VITESSE DE SIMULATION
        </span>

        <span
          id="aire-v8-speed-label"
          class="v8-sub">

          Rapide · cadence actuelle

        </span>

      </div>

      <div class="v8-buttons">

        <button
          id="aire-v8-fast"
          class="active"
          type="button">

          ⚡ Rapide

        </button>

        <button
          id="aire-v8-real"
          type="button">

          ◷ 1× réel

        </button>

      </div>
    `;

    world.parentNode.insertBefore(
      box,
      world
    );

    $("aire-v8-fast").onclick =
      () => setSpeed(80);

    $("aire-v8-real").onclick =
      () => setSpeed(1000);
  }


  function setSpeed(ms) {

    speedMs =
      ms;

    $("aire-v8-fast")
      ?.classList
      .toggle(
        "active",
        ms === 80
      );

    $("aire-v8-real")
      ?.classList
      .toggle(
        "active",
        ms === 1000
      );

    const label =
      $("aire-v8-speed-label");

    if (label) {

      label.textContent =
        ms === 1000

          ? "1 seconde simulée = 1 seconde réelle"

          : "Rapide · cadence actuelle";
    }

    if (running) {
      restartLoop();
    }
  }


  /* ==========================================================
     BOUCLE DE SIMULATION
     ========================================================== */

  function stopLoop() {

    running =
      false;

    if (timer) {
      clearTimeout(timer);
    }

    timer =
      null;
  }


  async function loop() {

    if (!running) {
      return;
    }

    const s =
      state();

    if (
      !s ||
      s.alive === false
    ) {

      stopLoop();

      return;
    }

    try {

      await pyStep(1);

    } catch (e) {

      console.error(
        "AIRE V8 speed loop",
        e
      );

      stopLoop();

      return;
    }

    if (running) {

      timer =
        setTimeout(
          loop,
          speedMs
        );
    }
  }


  function restartLoop() {

    stopLoop();

    running =
      true;

    loop();
  }


  /*
    V8 remplace uniquement la cadence de lancement.

    Le moteur AIRE reste le seul responsable
    de l'état simulé.
  */

  window.runLoop =
    restartLoop;

  window.pause =
    stopLoop;


  /* ==========================================================
     ENVIRONNEMENT ENRICHI
     ========================================================== */

  const decorSpec = [

    [-12,-9,"bush"],
    [12,-8,"bush"],
    [-15,-2,"bush"],
    [14,2,"bush"],

    [-10,9,"bush"],
    [11,8,"bush"],

    [-5,-11,"tree"],
    [7,-10,"tree"],

    [-13,5,"log"],
    [5,6,"log"],

    [-2,10,"mushroom"],
    [3,-5,"mushroom"],

    [-7,-3,"flower"],
    [9,-4,"flower"],
    [-4,2,"flower"],
    [6,9,"flower"],

    [-11,1,"reed"],
    [11,-1,"reed"],

    [-8,7,"pebble"],
    [8,5,"pebble"],
    [-3,-9,"pebble"],
    [3,8,"pebble"],

    [0,-13,"water"],
    [13,10,"water"]
  ];


  function ensureDecorLayer() {

    const scene =
      $("aire-v7-scene");

    if (!scene) {
      return null;
    }

    if (!decorLayer) {

      decorLayer =
        document.createElement(
          "div"
        );

      decorLayer.id =
        "aire-v8-decor-layer";

      scene.appendChild(
        decorLayer
      );

      decorSpec.forEach(
        ([, , kind], i) => {

          const e =
            document.createElement(
              "div"
            );

          e.className =
            `aire-v8-decor v8-${kind}`;

          e.dataset.i =
            String(i);

          decorLayer.appendChild(
            e
          );
        }
      );
    }

    return decorLayer;
  }


  function updateDecor() {

    const layer =
      ensureDecorLayer();

    if (!layer) {
      return;
    }

    const p =
      alphaPos();

    [...layer.children]
      .forEach(
        (e, i) => {

          const [
            x,
            y,
            k
          ] =
            decorSpec[i];

          const q =
            project(
              x,
              y,
              k === "water"
                ? -0.2
                : 0
            );

          e.style.left =
            q[0] + "%";

          e.style.top =
            q[1] + "%";

          e.style.zIndex =
            String(
              k === "water"
                ? 1
                : 6
            );
        }
      );
  }


  /* ==========================================================
     LISSAGE DES OBJETS DU MOTEUR V7
     ========================================================== */

  /*
    V7 recrée certains éléments du décor à chaque
    rafraîchissement.

    On mémorise leur dernière position afin de les
    faire glisser vers leur nouvelle position au lieu
    de les faire apparaître brutalement.
  */

  function smoothObserver() {

    const scene =
      $("aire-v7-scene");

    if (
      !scene ||
      scene.__aireV8Observer
    ) {
      return;
    }

    const key =
      e =>
        `${e.className}|${e.title || ""}`;

    const observer =
      new MutationObserver(
        records => {

          for (
            const r of records
          ) {

            r.removedNodes
              .forEach(
                n => {

                  if (
                    n.nodeType === 1 &&
                    n.classList &&
                    !n.classList.contains(
                      "aire-v8-decor"
                    )
                  ) {

                    smoothMap.set(
                      key(n),
                      [
                        n.style.left,
                        n.style.top
                      ]
                    );
                  }
                }
              );


            r.addedNodes
              .forEach(
                n => {

                  if (
                    n.nodeType !== 1 ||
                    n.classList?.contains(
                      "aire-v8-decor"
                    )
                  ) {
                    return;
                  }

                  const old =
                    smoothMap.get(
                      key(n)
                    );

                  if (
                    !old ||
                    !old[0] ||
                    !old[1]
                  ) {
                    return;
                  }

                  const now = [
                    n.style.left,
                    n.style.top
                  ];

                  n.style.transition =
                    "none";

                  n.style.left =
                    old[0];

                  n.style.top =
                    old[1];

                  requestAnimationFrame(
                    () => {

                      n.style.transition =
                        "left .18s linear, top .18s linear, opacity .18s linear";

                      n.style.left =
                        now[0];

                      n.style.top =
                        now[1];
                    }
                  );
                }
              );
          }
        }
      );

    observer.observe(
      scene,
      {
        childList:true
      }
    );

    scene.__aireV8Observer =
      observer;
  }


  /* ==========================================================
     MISE À JOUR
     ========================================================== */

  function update() {

    const a =
      $("aire-v7-alpha");

    if (a) {

      a.style.left =
        "50%";

      a.style.top =
        "59%";

      a.style.transform =
        "translate3d(-50%,-50%,0)";
    }

    updateDecor();
  }


  /* ==========================================================
     INITIALISATION
     ========================================================== */

  function start() {

    installCSS();

    addControls();

    smoothObserver();

    update();

    setInterval(
      update,
      120
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
          500
        ),
      {
        once:true
      }
    );

  } else {

    setTimeout(
      start,
      500
    );
  }

})();
