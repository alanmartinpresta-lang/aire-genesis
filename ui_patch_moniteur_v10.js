/* ============================================================
   AIRE GENESIS — UI PATCH MONITEUR V10
   - Onglet repliable pour l'experience d'assemblage
   - Monde visuel continu centre sur Alpha
   - Decor varie et persistant en coordonnees monde
   - Synchronisation avec les coordonnees affichees
   - Couche visuelle independante du moteur Python
   ============================================================ */

(() => {
  "use strict";

  if (window.__AIRE_V10_LOADED__) return;
  window.__AIRE_V10_LOADED__ = true;

  const $ = id => document.getElementById(id);

  const world = $("world");

  if (!world) {
    console.warn("AIRE V10 : #world introuvable.");
    return;
  }

  /* ============================================================
     STYLE
     ============================================================ */

  const style = document.createElement("style");

  style.id = "aire-v10-style";

  style.textContent = `
    #aire-v10-world {
      position:absolute;
      inset:0;
      overflow:hidden;
      border-radius:inherit;
      background:
        linear-gradient(
          180deg,
          #102d39 0%,
          #0a2730 48%,
          #071b24 100%
        );
    }

    #aire-v10-world canvas {
      position:absolute;
      inset:0;
      width:100%;
      height:100%;
      display:block;
      background:transparent;
      border-radius:inherit;
    }

    #aire-v10-exp-toggle {
      width:100%;
      margin:14px 0 0;
      min-height:48px;
      border-radius:14px;
      border:1px solid #2a5b6b;
      background:#0e2233;
      color:#eaf8f6;
      font-weight:750;
      font-size:15px;
    }

    #aire-v10-exp-toggle.open {
      border-color:#62e0c2;
      box-shadow:
        0 0 0 1px #62e0c233 inset;
    }

    #aire-v10-exp-wrap {
      display:none;
      margin-top:8px;
    }

    #aire-v10-exp-wrap.open {
      display:block;
    }

    #aire-v10-speed {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:8px;
      margin-top:10px;
    }

    #aire-v10-speed button {
      min-height:44px;
      border-radius:12px;
      border:1px solid #294b61;
      background:#12283d;
      color:#edf7ff;
      font-weight:750;
    }

    #aire-v10-speed button.active {
      border-color:#62e0c2;
      color:#62e0c2;
      box-shadow:
        0 0 0 1px #62e0c233 inset;
    }

    #aire-v10-world-label {
      position:absolute;
      left:10px;
      top:10px;
      z-index:20;
      padding:6px 9px;
      border-radius:999px;
      background:#06141ccc;
      border:1px solid #ffffff16;
      color:#9fc1c9;
      font:11px ui-monospace,monospace;
      pointer-events:none;
    }
  `;

  document.head.appendChild(style);

  /* ============================================================
     CREATION DU MONDE
     ============================================================ */

  world.innerHTML = "";

  world.style.position = "relative";

  const scene = document.createElement("div");

  scene.id = "aire-v10-world";

  const canvas = document.createElement("canvas");

  const label = document.createElement("div");

  label.id = "aire-v10-world-label";

  label.textContent =
    "MONDE CONTINU · CAMERA ALPHA";

  scene.appendChild(canvas);

  scene.appendChild(label);

  world.appendChild(scene);

  const ctx = canvas.getContext("2d");

  let W = 0;
  let H = 0;

  function resize() {

    const r =
      scene.getBoundingClientRect();

    W = Math.max(1, r.width);
    H = Math.max(1, r.height);

    const d =
      Math.min(
        window.devicePixelRatio || 1,
        2
      );

    canvas.width =
      Math.round(W * d);

    canvas.height =
      Math.round(H * d);

    ctx.setTransform(
      d,
      0,
      0,
      d,
      0,
      0
    );
  }

  window.addEventListener(
    "resize",
    resize
  );

  resize();

  /* ============================================================
     GENERATEUR DETERMINISTE DU DECOR
     ============================================================ */

  let seed = 91357;

  function rnd() {

    seed =
      (
        seed * 1664525 +
        1013904223
      ) >>> 0;

    return seed / 4294967296;
  }

  const kinds = [
    "rocher",
    "plante",
    "cristal",
    "fibre",
    "eau",
    "bois",
    "galet",
    "champignon",
    "minerai",
    "fleur",
    "ruine"
  ];

  const palette = {

    rocher:"#6c7f85",

    plante:"#4d9b7c",

    cristal:"#7bc6d5",

    fibre:"#b89c67",

    eau:"#2b7680",

    bois:"#795f45",

    galet:"#77858b",

    champignon:"#b66e6e",

    minerai:"#9b9ca5",

    fleur:"#a9c86b",

    ruine:"#5d7074"
  };

  const objects = [];

  for (
    let i = 0;
    i < 54;
    i++
  ) {

    const kind =
      kinds[
        Math.floor(
          rnd() * kinds.length
        )
      ];

    objects.push({

      id:i,

      kind,

      x:
        (rnd() - 0.5) *
        2400,

      y:
        (rnd() - 0.5) *
        1800,

      z:
        Math.max(
          0.1,
          rnd() * 1.4
        ),

      size:
        0.55 +
        rnd() * 1.25,

      phase:
        rnd() *
        Math.PI *
        2
    });
  }

  /* ============================================================
     CAMERA
     ============================================================ */

  let cam = {

    x:0,

    y:0,

    z:0
  };

  let target = {

    x:0,

    y:0,

    z:0
  };

  let lastPositionText = "";

  let lastT =
    performance.now();

  function parsePosition() {

    const el =
      $("position");

    if (!el) return;

    const text =
      el.textContent || "";

    if (
      text ===
      lastPositionText
    ) {
      return;
    }

    lastPositionText =
      text;

    const m =
      text.match(
        /x\s*([-+]?\d+(?:\.\d+)?)\s*[·•,;]\s*y\s*([-+]?\d+(?:\.\d+)?)\s*[·•,;]\s*z\s*([-+]?\d+(?:\.\d+)?)/i
      );

    if (!m) return;

    target.x =
      Number(m[1]);

    target.y =
      Number(m[2]);

    target.z =
      Number(m[3]);
  }

  /* ============================================================
     GRILLE DU MONDE
     ============================================================ */

  function drawGrid() {

    ctx.save();

    ctx.globalAlpha =
      0.17;

    ctx.strokeStyle =
      "#86c6c622";

    ctx.lineWidth = 1;

    const spacing = 38;

    const ox =
      (
        (
          W / 2 -
          cam.x * 0.35
        ) %
        spacing +
        spacing
      ) %
      spacing;

    const oy =
      (
        (
          H / 2 +
          cam.y * 0.35
        ) %
        spacing +
        spacing
      ) %
      spacing;

    for (
      let x = ox;
      x < W;
      x += spacing
    ) {

      ctx.beginPath();

      ctx.moveTo(
        x,
        0
      );

      ctx.lineTo(
        x,
        H
      );

      ctx.stroke();
    }

    for (
      let y = oy;
      y < H;
      y += spacing
    ) {

      ctx.beginPath();

      ctx.moveTo(
        0,
        y
      );

      ctx.lineTo(
        W,
        y
      );

      ctx.stroke();
    }

    ctx.restore();
  }

  /* ============================================================
     OMBRE
     ============================================================ */

  function drawShadow(
    x,
    y,
    s,
    a = 0.18
  ) {

    ctx.save();

    ctx.globalAlpha = a;

    ctx.fillStyle =
      "#000";

    ctx.beginPath();

    ctx.ellipse(
      x,
      y + s * 0.35,
      s * 1.45,
      s * 0.34,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
  }

  /* ============================================================
     OBJETS
     ============================================================ */

  function drawObject(
    o,
    x,
    y,
    s,
    t
  ) {

    const c =
      palette[o.kind] ||
      "#789";

    drawShadow(
      x,
      y,
      s,
      0.16
    );

    ctx.save();

    /* PLANTES */

    if (
      o.kind === "plante" ||
      o.kind === "fleur"
    ) {

      ctx.strokeStyle = c;

      ctx.lineWidth =
        Math.max(
          1.5,
          s * 0.12
        );

      ctx.beginPath();

      ctx.moveTo(
        x,
        y + s * 0.35
      );

      ctx.lineTo(
        x,
        y - s * 0.45
      );

      ctx.stroke();

      for (
        const side of [-1, 1]
      ) {

        ctx.fillStyle = c;

        ctx.beginPath();

        ctx.ellipse(
          x + side * s * 0.28,
          y - s * 0.2,
          s * 0.25,
          s * 0.12,
          side * 0.45,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }

    /* EAU */

    } else if (
      o.kind === "eau"
    ) {

      ctx.fillStyle = c;

      ctx.globalAlpha =
        0.48;

      ctx.beginPath();

      ctx.ellipse(
        x,
        y,
        s * 1.5,
        s * 0.48,
        0,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.globalAlpha =
        0.8;

      ctx.strokeStyle =
        "#8bd5d7aa";

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        s * 0.55,
        0,
        Math.PI
      );

      ctx.stroke();

    /* CRISTAUX */

    } else if (
      o.kind === "cristal" ||
      o.kind === "minerai"
    ) {

      ctx.fillStyle = c;

      ctx.beginPath();

      ctx.moveTo(
        x,
        y - s
      );

      ctx.lineTo(
        x + s * 0.65,
        y - s * 0.25
      );

      ctx.lineTo(
        x + s * 0.35,
        y + s * 0.65
      );

      ctx.lineTo(
        x - s * 0.45,
        y + s * 0.55
      );

      ctx.closePath();

      ctx.fill();

      ctx.fillStyle =
        "#ffffff44";

      ctx.beginPath();

      ctx.moveTo(
        x,
        y - s * 0.75
      );

      ctx.lineTo(
        x + s * 0.22,
        y - s * 0.15
      );

      ctx.lineTo(
        x - s * 0.05,
        y + s * 0.2
      );

      ctx.closePath();

      ctx.fill();

    /* BOIS / RUINES */

    } else if (
      o.kind === "bois" ||
      o.kind === "ruine"
    ) {

      ctx.fillStyle = c;

      ctx.translate(
        x,
        y
      );

      ctx.rotate(
        Math.sin(
          o.phase +
          t * 0.0002
        ) * 0.12
      );

      ctx.fillRect(
        -s * 0.85,
        -s * 0.2,
        s * 1.7,
        s * 0.42
      );

      if (
        o.kind === "ruine"
      ) {

        ctx.fillRect(
          -s * 0.5,
          -s * 0.8,
          s * 0.28,
          s * 0.65
        );

        ctx.fillRect(
          s * 0.2,
          -s * 0.55,
          s * 0.28,
          s * 0.4
        );
      }

    /* CHAMPIGNON */

    } else if (
      o.kind === "champignon"
    ) {

      ctx.fillStyle =
        "#d7b08c";

      ctx.fillRect(
        x - s * 0.08,
        y - s * 0.05,
        s * 0.16,
        s * 0.65
      );

      ctx.fillStyle = c;

      ctx.beginPath();

      ctx.arc(
        x,
        y - s * 0.05,
        s * 0.55,
        Math.PI,
        Math.PI * 2
      );

      ctx.fill();

    /* OBJETS GENERIQUES */

    } else {

      ctx.fillStyle = c;

      ctx.beginPath();

      ctx.ellipse(
        x,
        y,
        s,
        s * 0.68,
        Math.sin(o.phase) * 0.2,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.fillStyle =
        "#ffffff18";

      ctx.beginPath();

      ctx.ellipse(
        x - s * 0.25,
        y - s * 0.2,
        s * 0.35,
        s * 0.14,
        -0.2,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }

    ctx.restore();
  }

  /* ============================================================
     ALPHA
     ============================================================ */

  function drawAlpha() {

    const x =
      W / 2;

    const y =
      H / 2 + 10;

    ctx.save();

    /* Ombre */

    ctx.globalAlpha =
      0.18;

    ctx.fillStyle =
      "#62e0c2";

    ctx.beginPath();

    ctx.ellipse(
      x,
      y + 20,
      34,
      10,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    /* Halo */

    ctx.globalAlpha = 1;

    ctx.shadowBlur =
      22;

    ctx.shadowColor =
      "#62e0c2";

    /* Corps */

    ctx.fillStyle =
      "#d9e5e8";

    ctx.beginPath();

    ctx.roundRect(
      x - 20,
      y - 32,
      40,
      52,
      14
    );

    ctx.fill();

    /* Tête */

    ctx.fillStyle =
      "#0b1822";

    ctx.beginPath();

    ctx.roundRect(
      x - 16,
      y - 50,
      32,
      29,
      11
    );

    ctx.fill();

    ctx.strokeStyle =
      "#edf8f8";

    ctx.lineWidth = 3;

    ctx.stroke();

    /* Visage */

    ctx.fillStyle =
      "#79aefc";

    ctx.beginPath();

    ctx.roundRect(
      x - 8,
      y - 37,
      16,
      4,
      3
    );

    ctx.fill();

    ctx.restore();
  }

  /* ============================================================
     RENDU CONTINU
     ============================================================ */

  function render(t) {

 if (window.__AIRE_SIM_PAUSED__) {
  requestAnimationFrame(render);
  return;
}  
    parsePosition();

    const now =
      performance.now();

    const dt =
      Math.min(
        80,
        now - lastT
      );

    lastT = now;

    const k =
      1 -
      Math.pow(
        0.0008,
        dt / 16.7
      );

    cam.x +=
      (target.x - cam.x) * k;

    cam.y +=
      (target.y - cam.y) * k;

    cam.z +=
      (target.z - cam.z) * k;

    ctx.clearRect(
      0,
      0,
      W,
      H
    );

    drawGrid();

    const scale =
      0.78;

    const visible = [];

    for (
      const o of objects
    ) {

      const dx =
        o.x - cam.x;

      const dy =
        o.y - cam.y;

      const depth =
        Math.max(
          0.35,
          Math.min(
            1.25,
            1 -
            (dy + 900) /
            1800
          )
        );

      const px =
        W / 2 +
        dx *
        scale *
        depth;

      const py =
        H / 2 +
        dy *
        scale *
        0.55;

      if (
        px < -100 ||
        px > W + 100 ||
        py < -100 ||
        py > H + 100
      ) {
        continue;
      }

      visible.push({

        o,

        x:px,

        y:py,

        s:
          10 *
          o.size *
          depth
      });
    }

    visible.sort(
      (a,b) =>
        a.y - b.y
    );

    for (
      const v of visible
    ) {

      drawObject(
        v.o,
        v.x,
        v.y,
        v.s,
        t
      );
    }

    drawAlpha();

    requestAnimationFrame(
      render
    );
  }

  requestAnimationFrame(
    render
  );

  /* ============================================================
     CONTROLE DE VITESSE
     ============================================================ */

  const worldCard =
    world.closest(".card") ||
    world.parentElement;

  if (
    worldCard &&
    !$("aire-v10-speed")
  ) {

    const box =
      document.createElement(
        "div"
      );

    box.id =
      "aire-v10-speed";

    box.innerHTML =

      '<button id="aire-v10-fast">' +
      '⚡ Rapide' +
      '</button>' +

      '<button id="aire-v10-real">' +
      '◷ 1× réel' +
      '</button>';

    worldCard.insertBefore(
      box,
      world
    );

    const setSpeed =
      mode => {

        window.__AIRE_SIM_SPEED__ =
          mode;

        $("aire-v10-fast")
          .classList.toggle(
            "active",
            mode === "fast"
          );

        $("aire-v10-real")
          .classList.toggle(
            "active",
            mode === "real"
          );

        if (
          typeof window.toast ===
          "function"
        ) {

          window.toast(
            mode === "real"
              ? "Vitesse : 1× réel"
              : "Vitesse : rapide"
          );
        }
      };

    $("aire-v10-fast")
      .onclick =
      () =>
        setSpeed("fast");

    $("aire-v10-real")
      .onclick =
      () =>
        setSpeed("real");

    setSpeed("fast");
  }

  /* ============================================================
     ONGLET EXPERIENCE 01
     ============================================================ */

  const oldPanel =
    $("aire-v9-panel");

  if (
    oldPanel &&
    !$("aire-v10-exp-toggle")
  ) {

    const wrap =
      document.createElement(
        "div"
      );

    wrap.id =
      "aire-v10-exp-wrap";

    const toggle =
      document.createElement(
        "button"
      );

    toggle.id =
      "aire-v10-exp-toggle";

    toggle.textContent =
      "🧪 Expériences · Émergence de l’assemblage ▾";

    oldPanel.parentNode.insertBefore(
      toggle,
      oldPanel
    );

    oldPanel.parentNode.insertBefore(
      wrap,
      oldPanel
    );

    wrap.appendChild(
      oldPanel
    );

    toggle.onclick =
      () => {

        const open =
          wrap.classList.toggle(
            "open"
          );

        toggle.classList.toggle(
          "open",
          open
        );

        toggle.textContent =
          open
            ? "🧪 Expériences · fermer ▴"
            : "🧪 Expériences · Émergence de l’assemblage ▾";
      };
  }

  /* ============================================================
     PONT DE PAUSE
     ============================================================ */

  window.__AIRE_SIM_PAUSED__ =
    false;

  const oldPause =
    window.pause;

  if (
    typeof oldPause ===
      "function" &&
    !window.__AIRE_V10_PAUSE_WRAPPED__
  ) {

    window.__AIRE_V10_PAUSE_WRAPPED__ =
      true;

    window.pause =
      function() {

        window.__AIRE_SIM_PAUSED__ =
          true;

        document.dispatchEvent(
          new CustomEvent(
            "aire:simulation-pause"
          )
        );

        return oldPause.apply(
          this,
          arguments
        );
      };
  }

  const oldRun =
    window.runLoop;

  if (
    typeof oldRun ===
      "function" &&
    !window.__AIRE_V10_RUN_WRAPPED__
  ) {

    window.__AIRE_V10_RUN_WRAPPED__ =
      true;

    window.runLoop =
      function() {

        window.__AIRE_SIM_PAUSED__ =
          false;

        document.dispatchEvent(
          new CustomEvent(
            "aire:simulation-run"
          )
        );

        return oldRun.apply(
          this,
          arguments
        );
      };
  }

  console.info(
    "AIRE V10 active : monde continu + onglet expériences + pont pause."
  );

})();
