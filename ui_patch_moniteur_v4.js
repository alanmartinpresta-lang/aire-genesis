/* ============================================================
   AIRE GENESIS — MONITEUR V4
   Rendu post-moteur : Alpha fixe, monde mobile
   Ne modifie PAS la physique ni les décisions d'Alpha.
   ============================================================ */

(() => {
  "use strict";

  if (window.AIRE_MONITEUR_V4) return;
  window.AIRE_MONITEUR_V4 = true;

  let dernierMoteur = null;

  function installer() {
    if (typeof window.drawWorld !== "function") return;

    if (window.drawWorld.__AIRE_V4__) return;

    const moteurOriginal = window.drawWorld;

    function drawWorldV4(state) {

      /* 1 — laisser le moteur faire exactement son travail */
      moteurOriginal(state);

      /* 2 — puis seulement après, reprendre l'affichage */
      rendreMonde(state);
    }

    drawWorldV4.__AIRE_V4__ = true;
    drawWorldV4.__AIRE_ORIGINAL__ = moteurOriginal;

    window.drawWorld = drawWorldV4;
    dernierMoteur = moteurOriginal;

    console.log("AIRE V4 : rendu post-moteur actif");
  }


  function creerScene() {

    const world = document.getElementById("world");

    if (!world) return null;

    let scene = document.getElementById("aire-v4-scene");

    if (scene) return scene;

    world.innerHTML = "";

    scene = document.createElement("div");
    scene.id = "aire-v4-scene";

    scene.style.cssText = `
      position:absolute;
      inset:-35%;
      overflow:hidden;
      transform:
        perspective(600px)
        rotateX(48deg)
        scale(1.05);
      transform-origin:center;
      background:
        linear-gradient(#ffffff08 1px,transparent 1px),
        linear-gradient(90deg,#ffffff08 1px,transparent 1px),
        radial-gradient(circle at 50% 50%,#17465666,transparent 62%),
        linear-gradient(150deg,#071820,#123846);
      background-size:
        28px 28px,
        28px 28px,
        100% 100%,
        100% 100%;
      transition:transform .12s linear;
      z-index:1;
    `;

    world.appendChild(scene);

    return scene;
  }


  function creerAlpha() {

    const world = document.getElementById("world");

    if (!world) return null;

    let alpha = document.getElementById("aire-v4-alpha");

    if (alpha) return alpha;

    alpha = document.createElement("div");
    alpha.id = "aire-v4-alpha";

    alpha.style.cssText = `
      position:absolute;
      left:50%;
      top:58%;
      width:52px;
      height:76px;
      transform:translate(-50%,-50%);
      z-index:20;
      pointer-events:none;
      filter:drop-shadow(0 7px 8px #0009);
    `;

    alpha.innerHTML = `
      <div style="
        position:absolute;
        left:13px;
        top:0;
        width:26px;
        height:29px;
        border:2px solid #d8e3e5;
        border-radius:10px 10px 9px 9px;
        background:linear-gradient(145deg,#121c21,#05090b);
        box-shadow:0 0 14px #62e0c255;
      ">
        <div id="aire-v4-eye" style="
          position:absolute;
          left:6px;
          top:11px;
          width:12px;
          height:4px;
          border-radius:5px;
          background:#62e0c2;
          box-shadow:0 0 10px #62e0c2;
        "></div>
      </div>

      <div style="
        position:absolute;
        left:10px;
        top:27px;
        width:32px;
        height:36px;
        border-radius:11px 11px 13px 13px;
        background:linear-gradient(135deg,#eef2f2,#89999e 55%,#27343a);
        border:1px solid #dbe6e677;
      "></div>

      <i style="
        position:absolute;
        left:3px;
        top:31px;
        width:8px;
        height:20px;
        border-radius:6px;
        background:#26343a;
        transform:rotate(12deg);
      "></i>

      <i style="
        position:absolute;
        right:3px;
        top:31px;
        width:8px;
        height:20px;
        border-radius:6px;
        background:#26343a;
        transform:rotate(-12deg);
      "></i>

      <i style="
        position:absolute;
        left:13px;
        top:60px;
        width:8px;
        height:20px;
        border-radius:6px;
        background:#26343a;
      "></i>

      <i style="
        position:absolute;
        right:13px;
        top:60px;
        width:8px;
        height:20px;
        border-radius:6px;
        background:#26343a;
      "></i>
    `;

    world.appendChild(alpha);

    return alpha;
  }


  function rendreMonde(s) {

    if (!s) return;

    const scene = creerScene();
    const alpha = creerAlpha();

    if (!scene || !alpha) return;

    /* Alpha est TOUJOURS au centre de la caméra */

    alpha.style.left = "50%";
    alpha.style.top = "58%";


    /* Nettoyage des anciens objets */

    scene
      .querySelectorAll(".aire-v4-object")
      .forEach(e => e.remove());


    const position = s.position || [0, 0, 0];

    const ax = Number(position[0] || 0);
    const ay = Number(position[1] || 0);
    const az = Number(position[2] || 0);


    /*
       Les objets sont maintenant calculés
       relativement à Alpha.

       Alpha avance →
       le monde semble reculer.

       Alpha tourne →
       le monde se décale.

       Alpha reste donc visuellement stable.
    */

    const objets = s.objects || [];

    objets.forEach(o => {

      const ox = Number(o.x || 0);
      const oy = Number(o.y || 0);
      const oz = Number(o.z || 0);

      const dx = (ox - ax) * 0.42;
      const dy = (ay - oy) * 0.42;

      const x = 50 + dx;
      const y = 50 + dy * 0.62;

      if (
        x < -20 ||
        x > 120 ||
        y < -20 ||
        y > 120
      ) {
        return;
      }

      const objet = document.createElement("div");

      objet.className = "aire-v4-object";

      objet.style.cssText = `
        position:absolute;
        left:${x}%;
        top:${y}%;

        width:18px;
        height:18px;

        border-radius:5px;

        background:
          linear-gradient(
            145deg,
            #e6c17a,
            #a8793f
          );

        box-shadow:
          0 5px 8px #0009,
          0 0 8px #e6c17a55;

        transform:
          translate(-50%,-50%)
          rotate(45deg);

        z-index:5;
      `;

      scene.appendChild(objet);
    });


    /*
       Mouvement subtil de la caméra.
       Il donne la sensation que le décor
       accompagne réellement les déplacements.
    */

    const cameraX = Math.max(
      -8,
      Math.min(
        8,
        -ax * 0.004
      )
    );

    const cameraY = Math.max(
      -6,
      Math.min(
        6,
        ay * 0.003
      )
    );

    scene.style.transform =
      "perspective(600px) " +
      "rotateX(48deg) " +
      "scale(1.05) " +
      "translate(" +
      cameraX +
      "%," +
      cameraY +
      "%)";


    /*
       Couleur du casque selon l'état réel
       de la simulation.
    */

    const eye =
      document.getElementById("aire-v4-eye");

    if (eye) {

      const fatigue =
        Number(
          s.physiology?.fatigue || 0
        );

      const douleur =
        Number(
          s.physiology?.pain || 0
        );

      const action =
        String(
          s.action || ""
        ).toLowerCase();

      let couleur = "#62e0c2";

      if (douleur > 0.20) {

        couleur = "#ff5d72";

      } else if (fatigue > 0.50) {

        couleur = "#ffc86b";

      } else if (
        /move|grasp|push|release|intake/
          .test(action)
      ) {

        couleur = "#8bb7ff";
      }

      eye.style.background = couleur;
      eye.style.boxShadow =
        "0 0 10px " + couleur;
    }
  }


  /*
     Le moteur peut créer/remplacer drawWorld
     après le chargement de cette extension.

     On vérifie donc régulièrement et on réinstalle
     le wrapper si nécessaire.
  */

  setInterval(installer, 250);

  installer();

})();
