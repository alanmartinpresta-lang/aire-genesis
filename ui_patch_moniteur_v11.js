/* ============================================================
   AIRE GENESIS — UI PATCH MONITEUR V11

   Objectifs :
   - conserver le moteur actuel d'Alpha
   - ne pas remplacer le monde existant
   - ajouter une couche visuelle indépendante
   - suivre la position d'Alpha
   - afficher mouvement / stabilité
   - afficher une trajectoire optionnelle
   - ajouter une interface d'observation repliable
   - préparer proprement les futures expériences

   IMPORTANT :
   Les indicateurs "vitesse" et "stabilité" sont des
   métriques d'interface calculées à partir des données
   accessibles au navigateur. Ils ne constituent pas
   des mesures scientifiques supplémentaires.
   ============================================================ */

(() => {

  "use strict";


  /* ============================================================
     PROTECTION CONTRE UN DOUBLE CHARGEMENT
     ============================================================ */

  if (window.__AIRE_V11_LOADED__) {
    return;
  }

  window.__AIRE_V11_LOADED__ = true;


  /* ============================================================
     OUTILS
     ============================================================ */

  const $ = id =>
    document.getElementById(id);


  const world =
    $("world");


  if (!world) {

    console.warn(
      "AIRE V11 : #world introuvable."
    );

    return;
  }


  /* ============================================================
     STYLE
     ============================================================ */

  const style =
    document.createElement("style");


  style.id =
    "aire-v11-style";


  style.textContent = `

    #aire-v11-layer {

      position:absolute;

      inset:0;

      pointer-events:none;

      overflow:hidden;

      border-radius:inherit;

      z-index:30;
    }


    #aire-v11-layer canvas {

      position:absolute;

      inset:0;

      width:100%;

      height:100%;

      display:block;

      pointer-events:none;
    }


    #aire-v11-hud {

      position:absolute;

      left:12px;

      top:12px;

      width:min(
        330px,
        calc(100% - 24px)
      );

      font:

        12px
        ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;

      color:#dffaf4;

      pointer-events:auto;
    }


    #aire-v11-card {

      background:
        #06141ce8;

      border:
        1px solid #2a5963;

      border-radius:
        14px;

      box-shadow:
        0 12px 35px #0007;

      backdrop-filter:
        blur(8px);

      overflow:hidden;
    }


    #aire-v11-head {

      display:flex;

      align-items:center;

      justify-content:space-between;

      padding:
        10px 12px;

      cursor:pointer;

      user-select:none;
    }


    #aire-v11-head strong {

      font:

        700
        12px
        ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;

      letter-spacing:
        .05em;
    }


    #aire-v11-body {

      padding:
        0 12px 12px;

      display:none;
    }


    #aire-v11-card.open
    #aire-v11-body {

      display:block;
    }


    .aire-v11-row {

      display:flex;

      justify-content:
        space-between;

      gap:12px;

      padding:
        6px 0;

      border-top:
        1px solid #ffffff0d;
    }


    .aire-v11-k {

      color:#83aeb6;
    }


    .aire-v11-v {

      color:#dffaf4;

      text-align:right;
    }


    #aire-v11-event {

      margin-top:
        8px;

      padding:
        8px;

      border-radius:
        9px;

      background:
        #0b2530;

      color:
        #9fc8c7;

      min-height:
        31px;

      line-height:
        1.35;
    }


    #aire-v11-exp {

      margin-top:
        9px;

      padding-top:
        9px;

      border-top:
        1px solid #ffffff12;
    }


    #aire-v11-exp button {

      width:100%;

      min-height:
        38px;

      margin-top:
        7px;

      border-radius:
        10px;

      border:
        1px solid #285563;

      background:
        #0c2230;

      color:
        #dffaf4;

      font-weight:
        700;
    }


    #aire-v11-exp button.active {

      border-color:
        #62e0c2;

      color:
        #62e0c2;
    }


    #aire-v11-legend {

      position:absolute;

      right:12px;

      top:12px;

      padding:
        7px 9px;

      border:
        1px solid #ffffff18;

      border-radius:
        999px;

      background:
        #06141cd9;

      color:
        #8fb5bd;

      font:

        10px
        ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;

      pointer-events:none;
    }


    #aire-v11-dot {

      display:inline-block;

      width:7px;

      height:7px;

      border-radius:50%;

      background:
        #62e0c2;

      margin-right:
        7px;

      box-shadow:
        0 0 10px #62e0c2;
    }


    @media(max-width:600px) {

      #aire-v11-hud {

        width:
          calc(100% - 24px);
      }

      #aire-v11-legend {

        display:none;
      }

    }

  `;


  document.head.appendChild(
    style
  );


  /* ============================================================
     CALQUE V11
     ============================================================ */

  const layer =
    document.createElement("div");


  layer.id =
    "aire-v11-layer";


  const canvas =
    document.createElement("canvas");


  layer.appendChild(
    canvas
  );


  /* ============================================================
     HUD
     ============================================================ */

  const hud =
    document.createElement("div");


  hud.id =
    "aire-v11-hud";


  hud.innerHTML = `

    <div id="aire-v11-card">

      <div id="aire-v11-head">

        <strong>

          <span id="aire-v11-dot"></span>

          AIRE · OBSERVATION V11

        </strong>

        <span>⌄</span>

      </div>


      <div id="aire-v11-body">

        <div class="aire-v11-row">

          <span class="aire-v11-k">

            Position Alpha

          </span>

          <span
            class="aire-v11-v"
            id="aire-v11-pos"
          >

            —

          </span>

        </div>


        <div class="aire-v11-row">

          <span class="aire-v11-k">

            Déplacement UI

          </span>

          <span
            class="aire-v11-v"
            id="aire-v11-vel"
          >

            —

          </span>

        </div>


        <div class="aire-v11-row">

          <span class="aire-v11-k">

            Stabilité UI

          </span>

          <span
            class="aire-v11-v"
            id="aire-v11-stab"
          >

            —

          </span>

        </div>


        <div class="aire-v11-row">

          <span class="aire-v11-k">

            Temps UI

          </span>

          <span
            class="aire-v11-v"
            id="aire-v11-time"
          >

            0.0 s

          </span>

        </div>


        <div
          id="aire-v11-event"
        >

          Initialisation
          de la couche
          d'observation…

        </div>


        <div id="aire-v11-exp">

          <div
            class="aire-v11-k"
          >

            Visualisation

          </div>


          <button
            data-mode="calm"
            class="active"
          >

            Mode continu

          </button>


          <button
            data-mode="trace"
          >

            Tracer la trajectoire

          </button>


          <button
            data-mode="pulse"
          >

            Amplifier les variations

          </button>

        </div>

      </div>

    </div>
  `;


  layer.appendChild(
    hud
  );


  /* ============================================================
     LEGENDE
     ============================================================ */

  const legend =
    document.createElement("div");


  legend.id =
    "aire-v11-legend";


  legend.textContent =
    "COUCHE UI · OBSERVATION";


  layer.appendChild(
    legend
  );


  /* ============================================================
     INSERTION
     ============================================================ */

  world.style.position =
    "relative";


  world.appendChild(
    layer
  );


  /* ============================================================
     CANVAS
     ============================================================ */

  const ctx =
    canvas.getContext("2d");


  let W = 1;

  let H = 1;

  let dpr = 1;


  function resize() {

    const r =
      world.getBoundingClientRect();


    W =
      Math.max(
        1,
        r.width
      );


    H =
      Math.max(
        1,
        r.height
      );


    dpr =
      Math.min(
        window.devicePixelRatio || 1,
        2
      );


    canvas.width =
      Math.round(
        W * dpr
      );


    canvas.height =
      Math.round(
        H * dpr
      );


    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );
  }


  window.addEventListener(
    "resize",
    resize,
    {
      passive:true
    }
  );


  resize();


  /* ============================================================
     ETAT
     ============================================================ */

  let mode =
    "calm";


  let last =
    performance.now();


  let elapsed =
    0;


  let lastPos =
    null;


  let velocity =
    0;


  const trail =
    [];


  /* ============================================================
     LECTURE DE LA POSITION D'ALPHA
     ============================================================ */

  function readPosition() {

    const el =
      $("position");


    if (!el) {

      return null;
    }


    const text =
      el.textContent || "";


    /*
      Formats acceptés :

      x 12 · y 4 · z 0

      x 12, y 4, z 0

      x12 y4 z0
    */

    const m =
      text.match(

        /x\s*([-+]?\d+(?:\.\d+)?)\s*(?:[·•,;]\s*|\s+)y\s*([-+]?\d+(?:\.\d+)?)\s*(?:[·•,;]\s*|\s+)z\s*([-+]?\d+(?:\.\d+)?)/i

      );


    if (!m) {

      return null;
    }


    return {

      x:
        Number(m[1]),

      y:
        Number(m[2]),

      z:
        Number(m[3])
    };
  }


  /* ============================================================
     FORMAT
     ============================================================ */

  function fmt(n) {

    return Number.isFinite(n)

      ? n.toFixed(3)

      : "—";
  }


  /* ============================================================
     EVENEMENT
     ============================================================ */

  function setEvent(text) {

    const e =
      $("aire-v11-event");


    if (!e) {

      return;
    }


    if (
      e.textContent !==
      text
    ) {

      e.textContent =
        text;
    }
  }


  /* ============================================================
     CONTROLE DE VISUALISATION
     ============================================================ */

  document
    .querySelectorAll(
      "#aire-v11-exp button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                "#aire-v11-exp button"
              )
              .forEach(
                b =>
                  b.classList.remove(
                    "active"
                  )
              );


            button.classList.add(
              "active"
            );


            mode =
              button.dataset.mode ||
              "calm";


            if (
              mode ===
              "trace"
            ) {

              setEvent(
                "Trajectoire visuelle activée."
              );

            } else if (
              mode ===
              "pulse"
            ) {

              setEvent(
                "Variations visuelles amplifiées. Le moteur n'est pas modifié."
              );

            } else {

              setEvent(
                "Mode continu rétabli."
              );
            }
          }
        );

      }
    );


  /* ============================================================
     FOND PULSANT
     ============================================================ */

  function drawBackgroundPulse(
    t
  ) {

    if (
      mode !==
      "pulse"
    ) {

      return;
    }


    const a =
      0.025 +
      0.02 *
      (
        0.5 +
        0.5 *
        Math.sin(
          t * 0.002
        )
      );


    ctx.save();


    ctx.fillStyle =
      `rgba(98,224,194,${a})`;


    ctx.fillRect(
      0,
      0,
      W,
      H
    );


    ctx.restore();
  }


  /* ============================================================
     CIBLE CENTRALE
     ============================================================ */

  function drawTarget(
    t
  ) {

    const cx =
      W / 2;


    const cy =
      H / 2;


    const r =
      18 +
      2 *
      Math.sin(
        t * 0.003
      );


    ctx.save();


    ctx.strokeStyle =
      "#62e0c2aa";


    ctx.lineWidth =
      1;


    ctx.beginPath();


    ctx.arc(
      cx,
      cy,
      r,
      0,
      Math.PI * 2
    );


    ctx.stroke();


    ctx.beginPath();


    ctx.moveTo(
      cx - r - 8,
      cy
    );


    ctx.lineTo(
      cx + r + 8,
      cy
    );


    ctx.moveTo(
      cx,
      cy - r - 8
    );


    ctx.lineTo(
      cx,
      cy + r + 8
    );


    ctx.stroke();


    ctx.fillStyle =
      "#62e0c2";


    ctx.beginPath();


    ctx.arc(
      cx,
      cy,
      2.5,
      0,
      Math.PI * 2
    );


    ctx.fill();


    ctx.restore();
  }


  /* ============================================================
     TRAJECTOIRE
     ============================================================ */

  function drawTrail() {

    if (
      mode !==
      "trace"
    ) {

      return;
    }


    if (
      trail.length <
      2
    ) {

      return;
    }


    ctx.save();


    ctx.strokeStyle =
      "#62e0c277";


    ctx.lineWidth =
      1.5;


    ctx.beginPath();


    trail.forEach(
      (q, i) => {

        if (
          i === 0
        ) {

          ctx.moveTo(
            q.x,
            q.y
          );

        } else {

          ctx.lineTo(
            q.x,
            q.y
          );
        }
      }
    );


    ctx.stroke();


    ctx.restore();
  }


  /* ============================================================
     BOUCLE VISUELLE
     ============================================================ */

  function tick(t) {

if (window.__AIRE_SIM_PAUSED__) {
  requestAnimationFrame(tick);
  return;
}     
    const dt =
      Math.min(
        0.1,
        (t - last) / 1000
      );


    last =
      t;


    elapsed +=
      dt;


    const p =
      readPosition();


    if (p) {

      if (
        lastPos
      ) {

        const dx =
          p.x -
          lastPos.x;


        const dy =
          p.y -
          lastPos.y;


        const dz =
          p.z -
          lastPos.z;


        velocity =
          Math.sqrt(
            dx * dx +
            dy * dy +
            dz * dz
          ) /
          Math.max(
            dt,
            0.001
          );
      }


      lastPos =
        p;


      const positionEl =
        $("aire-v11-pos");


      if (
        positionEl
      ) {

        positionEl.textContent =

          `x ${fmt(p.x)}` +
          ` · y ${fmt(p.y)}` +
          ` · z ${fmt(p.z)}`;
      }


      const velocityEl =
        $("aire-v11-vel");


      if (
        velocityEl
      ) {

        velocityEl.textContent =
          fmt(velocity);
      }


      /*
        Indicateur purement visuel :
        plus le déplacement entre deux
        mesures est faible, plus la
        stabilité affichée est élevée.
      */

      const stability =
        Math.max(
          0,
          Math.min(
            100,
            100 /
            (
              1 +
              velocity
            )
          )
        );


      const stabilityEl =
        $("aire-v11-stab");


      if (
        stabilityEl
      ) {

        stabilityEl.textContent =
          `${stability.toFixed(1)} %`;
      }


      if (
        mode ===
        "trace"
      ) {

        trail.push({

          x:
            W / 2 +
            (
              p.x %
              240
            ) *
            0.5,

          y:
            H / 2 +
            (
              p.y %
              180
            ) *
            0.5
        });


        if (
          trail.length >
          160
        ) {

          trail.shift();
        }
      }
    }


    const timeEl =
      $("aire-v11-time");


    if (
      timeEl
    ) {

      timeEl.textContent =
        `${elapsed.toFixed(1)} s`;
    }


    ctx.clearRect(
      0,
      0,
      W,
      H
    );


    drawBackgroundPulse(
      t
    );


    drawTrail();


    drawTarget(
      t
    );


    requestAnimationFrame(
      tick
    );
  }


  requestAnimationFrame(
    tick
  );


  /* ============================================================
     INITIALISATION
     ============================================================ */

  setEvent(
    "Couche V11 active. Les indicateurs sont des métriques d'interface."
  );


  console.info(
    "AIRE V11 active."
  );

})();
