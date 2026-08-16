/* ============================================================
   AIRE GENESIS — MONITEUR V7
   Interface définitive : monde vivant + Alpha + caméra + actions
   Couche d'interface uniquement : le moteur AIRE reste autoritaire.
   ============================================================ */
(() => {
  "use strict";

  if (window.AIRE_MONITEUR_V7) return;
  window.AIRE_MONITEUR_V7 = true;

  const $ = id => document.getElementById(id);

  let scene;
  let alpha;
  let inventory;
  let activity;

  let previousPosition = [0, 0, 0];
  let previousAction = "";
  let visualInventory = {};

  const LABELS = {
    grasp: "Ramassage",
    release: "Relâchement",
    intake: "Absorption",
    push: "Poussée",
    observe: "Observation",
    rest: "Repos",
    move: "Déplacement",
    move_x: "Déplacement",
    move_y: "Déplacement",
    move_z: "Déplacement vertical"
  };

  function actionLabel(value) {
    const s = String(value || "")
      .toLowerCase()
      .replace(/[-_]/g, " ");

    for (const [key, label] of Object.entries(LABELS)) {
      if (s.includes(key.replace("_", " "))) {
        return label;
      }
    }

    return value || "Observation";
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

  function alphaPosition(state) {
    const candidates = [
      state?.position,
      state?.pos,
      state?.alpha?.position,
      state?.alpha?.pos,
      state?.self?.position
    ];

    for (const p of candidates) {
      if (p) {
        return posOf({ position: p });
      }
    }

    const text =
      $("position")?.textContent || "";

    const n =
      text.match(/[-+]?\d+(?:[.,]\d+)?/g) || [];

    return n.length >= 2
      ? n
          .slice(0, 3)
          .map(x => +x.replace(",", "."))
      : [0, 0, 0];
  }

  function stateObjects(state) {
    const list =
      state?.objects ||
      state?.world?.objects ||
      state?.environment?.objects ||
      [];

    return Array.isArray(list)
      ? list
      : [];
  }

  function objectName(o, i) {
    return String(
      o?.name ??
      o?.type ??
      o?.kind ??
      o?.label ??
      `Objet ${i + 1}`
    );
  }

  function objectKind(o) {
    const s =
      objectName(o, 0).toLowerCase();

    if (/eau|water|lac|riv/.test(s)) {
      return "water";
    }

    if (/arbre|tree/.test(s)) {
      return "tree";
    }

    if (/plante|plant|herbe|grass/.test(s)) {
      return "plant";
    }

    if (/roche|rock|pierre|stone/.test(s)) {
      return "rock";
    }

    if (/fruit|pomme|apple|food|nour/.test(s)) {
      return "fruit";
    }

    return "object";
  }

  function installCSS() {
    if ($("aire-v7-style")) return;

    const style =
      document.createElement("style");

    style.id =
      "aire-v7-style";

    style.textContent = `

      body.aire-v7 header,
      body.aire-v7 main {
        max-width:1180px;
      }

      body.aire-v7 {
        background:
          radial-gradient(
            circle at 50% -5%,
            #183d50 0,
            #071018 48%
          );
      }

      #world.aire-v7-world {
        height:430px!important;
        padding:0!important;
        overflow:hidden!important;
        position:relative!important;
        background:#071b22!important;
        border:1px solid #31515b!important;
      }

      #aire-v7-scene {
        position:absolute;
        inset:0;
        overflow:hidden;
        background:
          linear-gradient(
            145deg,
            #1b3f2e,
            #31583a 48%,
            #0b5663
          );
        isolation:isolate;
      }

      #aire-v7-ground {
        position:absolute;
        inset:-25%;
        transform:
          rotateX(52deg)
          scale(1.18);
        transform-origin:50% 50%;

        background:
          repeating-linear-gradient(
            115deg,
            #2d6139 0 28px,
            #356a3f 29px 58px
          );
      }

      #aire-v7-ground:after {
        content:"";
        position:absolute;
        inset:0;

        background:
          radial-gradient(
            circle at 72% 20%,
            #2bd3e522,
            transparent 32%
          ),
          linear-gradient(
            90deg,
            #0002,
            transparent 35%,
            #0003
          );
      }

      .aire-v7-water {
        position:absolute;
        border-radius:48%;

        background:
          linear-gradient(
            145deg,
            #2a9db2,
            #0b5268
          );

        box-shadow:
          inset 0 0 25px #7cecff33,
          0 10px 20px #0004;
      }

      .aire-v7-water:after {
        content:"";
        position:absolute;
        inset:12% 8%;
        border-radius:50%;

        background:
          repeating-linear-gradient(
            0deg,
            transparent 0 11px,
            #a8f4ff33 12px 13px
          );

        animation:
          v7water
          2.4s
          linear
          infinite;
      }

      .aire-v7-rock {
        position:absolute;

        width:34px;
        height:23px;

        border-radius:
          55% 45% 35% 50%;

        background:
          linear-gradient(
            145deg,
            #a5a8a0,
            #51595a 55%,
            #252e30
          );

        box-shadow:
          0 8px 8px #0007;

        transform:
          translate(-50%,-50%);
      }

      .aire-v7-tree {
        position:absolute;

        width:42px;
        height:64px;

        transform:
          translate(-50%,-50%);
      }

      .aire-v7-tree:before {
        content:"";

        position:absolute;
        left:18px;
        top:32px;

        width:7px;
        height:29px;

        background:#58432e;
        border-radius:4px;
      }

      .aire-v7-tree:after {
        content:"";

        position:absolute;
        left:4px;
        top:0;

        width:35px;
        height:42px;

        border-radius:50%;

        background:
          radial-gradient(
            circle at 35% 30%,
            #a9c968,
            #4f813f 55%,
            #245338
          );

        box-shadow:
          0 7px 12px #0006;
      }

      .aire-v7-plant {
        position:absolute;

        width:25px;
        height:31px;

        transform:
          translate(-50%,-50%);
      }

      .aire-v7-plant:before,
      .aire-v7-plant:after {
        content:"";

        position:absolute;
        bottom:1px;

        width:9px;
        height:28px;

        background:#4b9a63;

        border-radius:
          100% 0 100% 0;
      }

      .aire-v7-plant:before {
        left:3px;

        transform:
          rotate(-25deg);
      }

      .aire-v7-plant:after {
        right:3px;

        transform:
          rotate(25deg)
          scaleX(-1);
      }

      .aire-v7-flower {
        position:absolute;

        width:9px;
        height:9px;

        border-radius:50%;

        background:#dba4d9;

        box-shadow:
          0 0 7px #fff6;

        transform:
          translate(-50%,-50%);
      }

      .aire-v7-object {
        position:absolute;

        width:23px;
        height:23px;

        border-radius:7px;

        background:
          linear-gradient(
            145deg,
            #f3ca71,
            #a35d32
          );

        border:
          1px solid #ffe7a577;

        box-shadow:
          0 6px 10px #0008;

        transform:
          translate(-50%,-50%);

        z-index:8;
      }

      .aire-v7-object.fruit {
        border-radius:50%;

        background:
          radial-gradient(
            circle at 35% 25%,
            #ffcc8c,
            #d94b43 65%,
            #8f252c
          );
      }

      .aire-v7-object.rock {
        background:
          linear-gradient(
            145deg,
            #a6aaa2,
            #4e5655
          );
      }

      /* =========================
         ALPHA
         ========================= */

      #aire-v7-alpha {
        position:absolute;

        left:50%;
        top:59%;

        width:70px;
        height:100px;

        transform:
          translate(-50%,-50%);

        z-index:30;
        pointer-events:none;

        filter:
          drop-shadow(
            0 12px 10px #000b
          );
      }

      #aire-v7-alpha .head {
        position:absolute;

        left:18px;
        top:0;

        width:34px;
        height:37px;

        border:
          2px solid #e8f2f1;

        border-radius:
          13px 13px 10px 10px;

        background:
          linear-gradient(
            145deg,
            #25343a,
            #05090b 70%
          );

        box-shadow:
          0 0 20px #62e0c244;
      }

      #aire-v7-alpha .screen {
        position:absolute;

        left:7px;
        top:14px;

        width:16px;
        height:5px;

        border-radius:7px;

        background:#62e0c2;

        box-shadow:
          0 0 12px currentColor;
      }

      #aire-v7-alpha .body {
        position:absolute;

        left:13px;
        top:34px;

        width:44px;
        height:47px;

        border-radius:
          15px;

        background:
          linear-gradient(
            135deg,
            #f2f5f3,
            #89989a 56%,
            #26353a
          );

        border:
          1px solid #f3ffff66;
      }

      #aire-v7-alpha .arm,
      #aire-v7-alpha .leg {
        position:absolute;

        border-radius:10px;

        background:#29383d;

        transform-origin:
          50% 5px;
      }

      #aire-v7-alpha .arm {
        width:10px;
        height:29px;
        top:39px;
      }

      .v7-la {
        left:2px;
        transform:
          rotate(13deg);
      }

      .v7-ra {
        right:2px;
        transform:
          rotate(-13deg);
      }

      #aire-v7-alpha .leg {
        width:10px;
        height:27px;
        top:78px;
      }

      .v7-ll {
        left:19px;
      }

      .v7-rl {
        right:19px;
      }

      #aire-v7-alpha.walk {
        animation:
          v7body
          .34s
          ease-in-out
          infinite
          alternate;
      }

      .walk .v7-ll {
        animation:
          v7legl
          .34s
          ease-in-out
          infinite
          alternate;
      }

      .walk .v7-rl {
        animation:
          v7legr
          .34s
          ease-in-out
          infinite
          alternate;
      }

      .walk .v7-la {
        animation:
          v7arml
          .34s
          ease-in-out
          infinite
          alternate;
      }

      .walk .v7-ra {
        animation:
          v7armr
          .34s
          ease-in-out
          infinite
          alternate;
      }

      #aire-v7-alpha.grasp .v7-ra {
        animation:
          v7grasp
          .65s
          ease-in-out;
      }

      #aire-v7-alpha.release .v7-ra {
        animation:
          v7release
          .55s
          ease-in-out;
      }

      #aire-v7-alpha.intake .v7-ra {
        animation:
          v7intake
          .7s
          ease-in-out;
      }

      #aire-v7-alpha.push .v7-la,
      #aire-v7-alpha.push .v7-ra {
        animation:
          v7push
          .4s
          ease-in-out
          infinite
          alternate;
      }

      #aire-v7-alpha.success .screen {
        background:#67e3a2;
      }

      #aire-v7-alpha.alert .screen {
        background:#ff6478;
      }

      #aire-v7-alpha.action .screen {
        background:#8bb7ff;
      }

      #aire-v7-label {
        position:absolute;

        left:50%;
        top:45%;

        transform:
          translate(-50%,-50%);

        z-index:35;

        padding:5px 10px;

        border:
          1px solid #62e0c277;

        border-radius:99px;

        background:#06151ddd;

        color:#62e0c2;

        font-weight:800;
        font-size:12px;
        letter-spacing:.06em;
      }

      /* =========================
         HUD
         ========================= */

      #aire-v7-hud {
        position:absolute;
        inset:12px;

        z-index:40;

        pointer-events:none;
      }

      .aire-v7-cam,
      .aire-v7-coords {
        position:absolute;

        padding:8px 11px;

        border-radius:10px;

        background:#06131dcc;

        border:
          1px solid #3a5a65;

        font-size:11px;
      }

      .aire-v7-cam {
        left:0;
        top:0;

        color:#62e0c2;

        font-weight:700;

        border-color:
          #62e0c277;
      }

      .aire-v7-coords {
        right:0;
        top:0;

        color:#d9eff6;

        font:
          12px
          ui-monospace,
          monospace;
      }

      /* =========================
         PANNEAUX
         ========================= */

      #aire-v7-panels {
        display:grid;

        grid-template-columns:
          1.05fr 1.4fr 1fr;

        gap:10px;

        margin-top:10px;
      }

      .aire-v7-panel {
        background:#081722;

        border:
          1px solid #29424d;

        border-radius:14px;

        padding:12px;
      }

      .aire-v7-panel h3 {
        font-size:12px;

        letter-spacing:.1em;

        margin:
          0 0 9px;

        color:#d9edf3;
      }

      .aire-v7-list {
        display:grid;

        grid-template-columns:
          1fr 1fr;

        gap:7px;
      }

      .aire-v7-pill {
        padding:8px;

        border-radius:9px;

        background:#0b1e2b;

        color:#a9bfca;

        font-size:11px;
      }

      .aire-v7-pill b {
        display:block;

        color:#f0f7fa;

        font-size:13px;

        margin-top:3px;
      }

      .aire-v7-actions {
        display:grid;

        grid-template-columns:
          1fr 1fr;

        gap:7px;
      }

      .aire-v7-actions button {
        min-height:42px;

        border-radius:10px;

        background:#122b3e;

        border:
          1px solid #2d526a;

        color:#eef8fb;

        font-weight:750;
      }

      .aire-v7-actions button:active {
        transform:
          scale(.97);
      }

      .aire-v7-actions .take {
        border-color:#5cbd8b;
      }

      .aire-v7-actions .eat {
        border-color:#9d70c9;
      }

      .aire-v7-actions .push {
        border-color:#d49350;
      }

      #aire-v7-bottom {
        display:grid;

        grid-template-columns:
          2fr 1fr;

        gap:10px;

        margin-top:10px;
      }

      .aire-v7-animstrip {
        display:flex;

        gap:7px;

        overflow:auto;
      }

      .aire-v7-frame {
        min-width:70px;
        height:68px;

        border-radius:10px;

        background:#0b1c27;

        border:
          1px solid #29424d;

        display:flex;

        flex-direction:column;

        align-items:center;
        justify-content:center;

        color:#90a8b3;

        font-size:9px;
      }

      .aire-v7-frame.active {
        border-color:#62e0c2;

        color:#62e0c2;

        box-shadow:
          0 0 12px #62e0c222;
      }

      .aire-v7-mini {
        width:24px;
        height:34px;

        position:relative;
      }

      .aire-v7-mini:before {
        content:"";

        position:absolute;

        left:7px;
        top:0;

        width:10px;
        height:11px;

        border-radius:5px;

        background:#24353a;

        border:
          1px solid #d8e7e7;
      }

      .aire-v7-mini:after {
        content:"";

        position:absolute;

        left:4px;
        top:11px;

        width:16px;
        height:20px;

        border-radius:6px;

        background:#a1adae;
      }

      .aire-v7-inv {
        display:grid;

        grid-template-columns:
          1fr 1fr;

        gap:6px;
      }

      .aire-v7-slot {
        padding:7px;

        border-radius:8px;

        background:#0b1d29;

        font-size:11px;

        color:#a9bfca;
      }

      .aire-v7-slot b {
        float:right;

        color:#fff;
      }

      .aire-v7-activity {
        max-height:118px;

        overflow:auto;

        font:
          10px
          ui-monospace,
          monospace;

        color:#8fa9b5;

        line-height:1.7;
      }

      /* =========================
         ANIMATIONS
         ========================= */

      @keyframes v7water {
        to {
          transform:
            translateX(25px);
        }
      }

      @keyframes v7body {
        to {
          transform:
            translate(-50%,-50%)
            translateY(-3px);
        }
      }

      @keyframes v7legl {
        to {
          transform:
            rotate(25deg);
        }
      }

      @keyframes v7legr {
        to {
          transform:
            rotate(-25deg);
        }
      }

      @keyframes v7arml {
        to {
          transform:
            rotate(-20deg);
        }
      }

      @keyframes v7armr {
        to {
          transform:
            rotate(20deg);
        }
      }

      @keyframes v7grasp {
        50% {
          transform:
            rotate(58deg)
            translateY(7px);
        }

        100% {
          transform:
            rotate(5deg);
        }
      }

      @keyframes v7release {
        50% {
          transform:
            rotate(-55deg);
        }

        100% {
          transform:
            rotate(-5deg);
        }
      }

      @keyframes v7intake {
        50% {
          transform:
            rotate(65deg)
            translateY(-5px);
        }

        100% {
          transform:
            rotate(5deg);
        }
      }

      @keyframes v7push {
        to {
          transform:
            rotate(35deg);
        }
      }

      @media(max-width:760px) {

        #world.aire-v7-world {
          height:360px!important;
        }

        #aire-v7-panels,
        #aire-v7-bottom {
          grid-template-columns:1fr;
        }

        .aire-v7-panel {
          min-height:0;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createWorld() {
    const world = $("world");

    if (!world) {
      return false;
    }

    world.classList.add("aire-v7-world");
    world.innerHTML = "";

    scene =
      document.createElement("div");

    scene.id =
      "aire-v7-scene";

    const ground =
      document.createElement("div");

    ground.id =
      "aire-v7-ground";

    scene.appendChild(ground);
    world.appendChild(scene);

    const hud =
      document.createElement("div");

    hud.id =
      "aire-v7-hud";

    hud.innerHTML =
      '<div class="aire-v7-cam">' +
      '● SUIVI ALPHA — CAMÉRA CENTRÉE' +
      '</div>' +

      '<div id="aire-v7-coords" ' +
      'class="aire-v7-coords">' +
      'X 0.00 · Y 0.00 · Z 0.00' +
      '</div>';

    world.appendChild(hud);

    alpha =
      document.createElement("div");

    alpha.id =
      "aire-v7-alpha";

    alpha.innerHTML =
      '<div class="head">' +
      '<div class="screen"></div>' +
      '</div>' +

      '<div class="body"></div>' +

      '<div class="arm v7-la"></div>' +
      '<div class="arm v7-ra"></div>' +

      '<div class="leg v7-ll"></div>' +
      '<div class="leg v7-rl"></div>';

    scene.appendChild(alpha);

    const label =
      document.createElement("div");

    label.id =
      "aire-v7-label";

    label.textContent =
      "ALPHA";

    scene.appendChild(label);

    return true;
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

  function renderWorld(state) {
    const p =
      alphaPosition(state);

    const old =
      scene.querySelectorAll(
        ".aire-v7-object," +
        ".aire-v7-rock," +
        ".aire-v7-tree," +
        ".aire-v7-plant," +
        ".aire-v7-flower," +
        ".aire-v7-water"
      );

    old.forEach(e => e.remove());

    for (
      const [i, o]
      of stateObjects(state).entries()
    ) {

      const op =
        posOf(o);

      const q =
        project(
          op[0] - p[0],
          op[1] - p[1],
          op[2] - p[2]
        );

      if (
        q[0] < -12 ||
        q[0] > 112 ||
        q[1] < -12 ||
        q[1] > 112
      ) {
        continue;
      }

      const e =
        document.createElement("div");

      const kind =
        objectKind(o);

      e.className =
        kind === "water"
          ? "aire-v7-water"

          : kind === "tree"
          ? "aire-v7-tree"

          : kind === "rock"
          ? "aire-v7-rock"

          : kind === "plant"
          ? "aire-v7-plant"

          : kind === "fruit"
          ? "aire-v7-object fruit"

          : "aire-v7-object";

      e.style.left =
        q[0] + "%";

      e.style.top =
        q[1] + "%";

      e.title =
        objectName(o, i);

      scene.appendChild(e);
    }

    const decor = [
      [-8, -7, "tree"],
      [8, -6, "tree"],
      [-10, 6, "rock"],
      [9, 7, "rock"],
      [-4, 5, "plant"],
      [4, 4, "plant"],
      [-2, -8, "flower"],
      [6, -2, "flower"],
      [-7, 1, "plant"]
    ];

    decor.forEach(([x, y, k]) => {

      const q =
        project(x, y, 0);

      const e =
        document.createElement("div");

      e.className =
        "aire-v7-" + k;

      e.style.left =
        q[0] + "%";

      e.style.top =
        q[1] + "%";

      scene.appendChild(e);
    });

    const water =
      document.createElement("div");

    water.className =
      "aire-v7-water";

    water.style.width =
      "210px";

    water.style.height =
      "125px";

    const w =
      project(10, 10, 0);

    water.style.left =
      w[0] + "%";

    water.style.top =
      w[1] + "%";

    scene.appendChild(water);

    $("aire-v7-coords").textContent =
      `X ${p[0].toFixed(2)} · ` +
      `Y ${p[1].toFixed(2)} · ` +
      `Z ${p[2].toFixed(2)}`;

    $("aire-v7-pos-small").textContent =
      p
        .map(v => v.toFixed(1))
        .join(" / ");

    return p;
  }

  function addActivity(text) {
    if (!activity) {
      return;
    }

    const row =
      document.createElement("div");

    row.textContent =
      new Date().toLocaleTimeString(
        "fr-FR",
        {
          hour:"2-digit",
          minute:"2-digit",
          second:"2-digit"
        }
      ) +
      " — " +
      text;

    activity.prepend(row);

    while (
      activity.children.length > 12
    ) {
      activity.lastElementChild.remove();
    }
  }

  function animateAction(raw) {
    const a =
      String(raw || "").toLowerCase();

    if (
      !a ||
      a === previousAction
    ) {
      return;
    }

    previousAction = a;

    const cls =
      a.includes("grasp")
        ? "grasp"

        : a.includes("release")
        ? "release"

        : a.includes("intake")
        ? "intake"

        : a.includes("push")
        ? "push"

        : a.includes("move")
        ? "walk"

        : a.includes("observe")
        ? "action"

        : "";

    alpha.className =
      cls;

    $("aire-v7-current-action")
      .textContent =
      actionLabel(raw);

    if (cls !== "walk") {

      setTimeout(() => {

        if (alpha) {
          alpha.className = "";
        }

      }, 850);
    }

    addActivity(
      actionLabel(raw)
    );

    document
      .querySelectorAll(
        ".aire-v7-frame"
      )
      .forEach(e => {

        e.classList.toggle(
          "active",
          e.dataset.anim ===
          actionLabel(raw)
            .toUpperCase()
        );

      });
  }

  function renderInventory(state) {
    if (!inventory) {
      return;
    }

    const inv =
      state?.inventory ||
      state?.carried ||
      state?.items;

    if (
      inv &&
      typeof inv === "object" &&
      !Array.isArray(inv)
    ) {
      visualInventory = {
        ...inv
      };
    }

    inventory.innerHTML = "";

    for (
      const [name, count]
      of Object.entries(
        visualInventory
      )
    ) {

      if (+count <= 0) {
        continue;
      }

      const e =
        document.createElement("div");

      e.className =
        "aire-v7-slot";

      e.textContent =
        name;

      const b =
        document.createElement("b");

      b.textContent =
        "×" + count;

      e.appendChild(b);

      inventory.appendChild(e);
    }

    if (
      !inventory.children.length
    ) {

      inventory.innerHTML =
        '<div class="aire-v7-slot">' +
        'Aucun objet' +
        '<b>—</b>' +
        '</div>';
    }
  }

  function buildPanels(world) {
    const panels =
      document.createElement("div");

    panels.id =
      "aire-v7-panels";

    panels.innerHTML = `

      <section class="aire-v7-panel">

        <h3>
          ÉTAT D'ALPHA
        </h3>

        <div class="aire-v7-list">

          <div class="aire-v7-pill">
            Action
            <b id="aire-v7-current-action">
              Observation
            </b>
          </div>

          <div class="aire-v7-pill">
            Mode
            <b>
              Autonome
            </b>
          </div>

          <div class="aire-v7-pill">
            État
            <b>
              Actif
            </b>
          </div>

          <div class="aire-v7-pill">
            Position
            <b id="aire-v7-pos-small">
              0 / 0 / 0
            </b>
          </div>

        </div>

      </section>

      <section class="aire-v7-panel">

        <h3>
          ACTIONS
        </h3>

        <div class="aire-v7-actions">

          <button
            onclick="manual('observe')">
            👁 Observer
          </button>

          <button
            class="take"
            onclick="manual('grasp')">
            ✋ Ramasser
          </button>

          <button
            onclick="manual('release')">
            🫳 Lâcher
          </button>

          <button
            class="eat"
            onclick="manual('intake')">
            ◉ Absorber
          </button>

          <button
            class="push"
            onclick="manual('push')">
            💪 Pousser
          </button>

          <button
            onclick="pyStep(1)">
            +1 pas
          </button>

        </div>

      </section>

      <section class="aire-v7-panel">

        <h3>
          ACTIVITÉ RÉCENTE
        </h3>

        <div
          id="aire-v7-activity"
          class="aire-v7-activity">
        </div>

      </section>
    `;

    world.parentNode.insertBefore(
      panels,
      world.nextSibling
    );

    activity =
      $("aire-v7-activity");

    const bottom =
      document.createElement("div");

    bottom.id =
      "aire-v7-bottom";

    bottom.innerHTML = `

      <section class="aire-v7-panel">

        <h3>
          ANIMATIONS D'ALPHA
        </h3>

        <div
          class="aire-v7-animstrip">

          ${
            [
              "IDLE",
              "MARCHE",
              "TOURNE",
              "OBSERVE",
              "RAMASSE",
              "PORTE",
              "ABSORBE",
              "POUSSE",
              "LÂCHE"
            ]
            .map(
              x => `
                <div
                  class="aire-v7-frame"
                  data-anim="${x}">
                  <div
                    class="aire-v7-mini">
                  </div>
                  ${x}
                </div>
              `
            )
            .join("")
          }

        </div>

      </section>

      <section class="aire-v7-panel">

        <h3>
          INVENTAIRE
        </h3>

        <div
          id="aire-v7-inventory"
          class="aire-v7-inv">
        </div>

      </section>
    `;

    panels.parentNode.insertBefore(
      bottom,
      panels.nextSibling
    );

    inventory =
      $("aire-v7-inventory");
  }

  function update() {
    const state =
      window.last ||
      window.aireState ||
      {};

    if (
      !scene ||
      !alpha
    ) {
      return;
    }

    const p =
      renderWorld(state);

    const moved =
      Math.hypot(
        p[0] -
          previousPosition[0],
        p[1] -
          previousPosition[1]
      ) > 0.001;

    alpha.classList.toggle(
      "walk",
      moved
    );

    const raw =
      $("action")
        ?.dataset
        ?.aireV5Raw ||

      $("action")
        ?.textContent ||

      state.action ||

      state.last_action ||

      "";

    if (
      moved &&
      !String(raw)
        .toLowerCase()
        .includes("move")
    ) {
      $("aire-v7-current-action")
        .textContent =
        "Déplacement";
    }

    animateAction(raw);

    renderInventory(state);

    previousPosition = p;
  }

  function start() {
    if (
      !$("world") ||
      $("aire-v7-style")
    ) {
      return;
    }

    installCSS();

    document.body.classList.add(
      "aire-v7"
    );

    if (
      !createWorld()
    ) {
      return;
    }

    buildPanels(
      $("world")
    );

    addActivity(
      "Interface AIRE V7 initialisée"
    );

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
          300
        )
    );

  } else {

    setTimeout(
      start,
      300
    );
  }

})();
