(() => {
"use strict";
if(window.AIRE_MONITEUR_V2)return;
window.AIRE_MONITEUR_V2=1;

function init(){
  const world=document.getElementById("world");
  if(!world)return false;

  const css=`
  #world{
    height:280px!important;
    position:relative;
    overflow:hidden;
    border-radius:14px;
    background:
      linear-gradient(#ffffff08 1px,transparent 1px),
      linear-gradient(90deg,#ffffff08 1px,transparent 1px),
      linear-gradient(150deg,#081923,#123544);
    background-size:28px 28px,28px 28px,100% 100%;
  }

  #aire-ground{
    position:absolute;
    inset:25% -10% -30%;
    border:1px solid #62e0c233;
    border-radius:30px;
    background:#0d2a36aa;
    transform:rotateX(55deg);
  }

  #aire-alpha{
    position:absolute;
    left:50%;
    top:52%;
    width:44px;
    height:66px;
    transform:translate(-50%,-50%);
    z-index:10;
    transition:left .25s linear,top .25s linear;
    pointer-events:none;
  }

  #aire-alpha .head{
    position:absolute;
    left:11px;
    top:0;
    width:22px;
    height:25px;
    border:2px solid #d8e3e5;
    border-radius:9px 9px 8px 8px;
    background:#080d11;
    box-shadow:0 0 12px #62e0c255;
  }

  #aire-alpha .head:after{
    content:"";
    position:absolute;
    left:5px;
    top:9px;
    width:10px;
    height:4px;
    border-radius:5px;
    background:#62e0c2;
    box-shadow:0 0 9px currentColor;
  }

  #aire-alpha .body{
    position:absolute;
    left:9px;
    top:23px;
    width:26px;
    height:31px;
    border-radius:9px;
    background:linear-gradient(135deg,#e8eeee,#87969b,#26343a);
    border:1px solid #dbe6e677;
  }

  #aire-alpha i{
    position:absolute;
    width:7px;
    height:18px;
    border-radius:5px;
    background:#26343a;
  }

  #aire-alpha .l1{left:3px;top:26px;transform:rotate(12deg)}
  #aire-alpha .r1{right:3px;top:26px;transform:rotate(-12deg)}
  #aire-alpha .l2{left:11px;top:51px}
  #aire-alpha .r2{right:11px;top:51px}

  #aire-alpha.alert .head:after{background:#ff5d72}
  #aire-alpha.tired .head:after{background:#ffc86b}
  #aire-alpha.action .head:after{background:#8bb7ff}

  #aire-alpha-label{
    position:absolute;
    left:50%;
    top:43%;
    transform:translate(-50%,-100%);
    z-index:11;
    padding:3px 7px;
    border:1px solid #62e0c255;
    border-radius:99px;
    background:#071018dd;
    color:#62e0c2;
    font:700 9px monospace;
  }

  .aire-v2-panel{
    display:flex;
    gap:7px;
    margin-top:8px;
    flex-wrap:wrap;
  }

  .aire-v2-panel button{
    min-height:34px;
    font-size:11px;
    padding:5px 10px;
  }

  .aire-v2-active{
    border-color:#62e0c2!important;
    color:#62e0c2!important;
  }

  .aire-inventory{
    display:grid;
    grid-template-columns:repeat(2,1fr);
    gap:7px;
  }

  .aire-item{
    padding:9px;
    border:1px solid #203844;
    border-radius:10px;
    background:#091525;
    font-size:11px;
  }

  .aire-item b{
    float:right;
    color:#62e0c2;
  }

  .aire-expression{
    color:#8196aa;
    font-size:11px;
  }

  .aire-expression b{
    color:#edf6ff;
  }`;

  const s=document.createElement("style");
  s.textContent=css;
  document.head.appendChild(s);

  world.innerHTML="";
  world.appendChild(Object.assign(document.createElement("div"),{id:"aire-ground"}));

  let a=document.createElement("div");
  a.id="aire-alpha";
  a.innerHTML=
    '<div class="head"></div>'+
    '<div class="body"></div>'+
    '<i class="l1"></i><i class="r1"></i>'+
    '<i class="l2"></i><i class="r2"></i>';
  world.appendChild(a);

  let label=document.createElement("div");
  label.id="aire-alpha-label";
  label.textContent="ALPHA";
  world.appendChild(label);

  const card=world.closest(".card");

  if(card){
    const p=document.createElement("div");
    p.className="aire-v2-panel";
    p.innerHTML=
      '<button id="aire-follow" class="aire-v2-active">◉ Suivi Alpha</button>'+
      '<button id="aire-center">◎ Recentrer</button>'+
      '<span class="muted">Moniteur léger</span>';
    card.appendChild(p);

    let follow=true;

    document.getElementById("aire-follow").onclick=()=>{
      follow=!follow;
      document.getElementById("aire-follow").classList.toggle("aire-v2-active",follow);
    };

    document.getElementById("aire-center").onclick=()=>{
      a.style.left="50%";
      a.style.top="52%";
    };
  }

  const inv=document.createElement("section");
  inv.className="card";
  inv.innerHTML=
    '<div class="sectionhead">'+
    '<h2>Inventaire</h2>'+
    '<span class="muted">objets conservés</span>'+
    '</div>'+
    '<div id="aire-inventory" class="aire-inventory">'+
    '<div class="aire-item">Aucun objet conservé <b>—</b></div>'+
    '</div>';

  if(card)card.parentNode.insertBefore(inv,card.nextSibling);

  const expr=document.createElement("section");
  expr.className="card";
  expr.innerHTML=
    '<h2>État d’Alpha</h2>'+
    '<div id="aire-expression" class="aire-expression">'+
    '<b>Calme</b> · observation en cours</div>';

  if(card)inv.parentNode.insertBefore(expr,inv.nextSibling);

  let oldX=0,oldY=0;

  function number(id){
    const e=document.getElementById(id);
    if(!e)return 0;
    return parseFloat((e.textContent||"").replace(",",".").replace(/[^0-9.-]/g,""))||0;
  }

  function update(){
    const pos=document.getElementById("position");
    if(pos){
      const n=(pos.textContent||"").match(/[-+]?\d+(?:\.\d+)?/g);

      if(n&&n.length>=2){
        const x=parseFloat(n[0]);
        const y=parseFloat(n[1]);

        if(Number.isFinite(x)&&Number.isFinite(y)){
          const dx=Math.max(-40,Math.min(40,(x-oldX)*.025));
          const dy=Math.max(-30,Math.min(30,(y-oldY)*.025));

          a.style.left=(50+dx)+"%";
          a.style.top=(52+dy)+"%";

          oldX=x;
          oldY=y;
        }
      }
    }

    const fat=number("fat");
    const pain=number("pain");
    const action=(document.getElementById("action")?.textContent||"").toLowerCase();

    a.classList.remove("alert","tired","action");

    let state="Calme";

    if(pain>20){
      state="Douleur / alerte";
      a.classList.add("alert");
    }else if(fat>50){
      state="Fatigue";
      a.classList.add("tired");
    }else if(action.includes("push")||
             action.includes("grasp")||
             action.includes("release")||
             action.includes("move")){
      state="Action";
      a.classList.add("action");
    }else if(action.includes("rest")){
      state="Repos";
      a.classList.add("tired");
    }else{
      state="Observation";
    }

    const e=document.getElementById("aire-expression");
    if(e)e.innerHTML="<b>"+state+"</b> · état dérivé des valeurs de simulation";
  }

  function ensureWorldVisual(){

  const w=document.getElementById("world");
  if(!w)return;

  if(!document.getElementById("aire-alpha")){

    a=document.createElement("div");
    a.id="aire-alpha";

    a.innerHTML=
      '<div class="head"></div>'+
      '<div class="body"></div>'+
      '<i class="l1"></i><i class="r1"></i>'+
      '<i class="l2"></i><i class="r2"></i>';

    w.appendChild(a);
  }

  if(!document.getElementById("aire-alpha-label")){

    label=document.createElement("div");
    label.id="aire-alpha-label";
    label.textContent="ALPHA";

    w.appendChild(label);
  }
}

const observer=new MutationObserver(()=>{

  ensureWorldVisual();

  if(!window.__aireV2Timer){

    window.__aireV2Timer=setTimeout(()=>{

      window.__aireV2Timer=0;
      update();

    },150);
  }
});

  observer.observe(document.body,{
    subtree:true,
    childList:true,
    characterData:true
  });

  setInterval(update,500);
  update();

  console.log("AIRE Moniteur V2 actif");
  return true;
}

if(!init()){
  const wait=new MutationObserver(()=>{
    if(init())wait.disconnect();
  });

  wait.observe(document.documentElement,{
    childList:true,
    subtree:true
  });

  setTimeout(()=>wait.disconnect(),15000);
}
})();
/* ============================================================
   AIRE GENESIS — HOTFIX MONDE V3
   Environnement + caméra centrée sur Alpha + français
   ============================================================ */

(() => {
  "use strict";

  if (window.AIRE_MONDE_V3) return;
  window.AIRE_MONDE_V3 = true;

  const world = document.getElementById("world");
  if (!world) return;

  const style = document.createElement("style");

  style.textContent = `
    #aire-scene-v3{
      position:absolute;
      inset:-35%;
      z-index:1;
      overflow:hidden;

      background:
        linear-gradient(#ffffff09 1px,transparent 1px),
        linear-gradient(90deg,#ffffff09 1px,transparent 1px),
        radial-gradient(circle at 50% 50%,#17465655,transparent 60%),
        linear-gradient(150deg,#081923,#123544);

      background-size:
        28px 28px,
        28px 28px,
        100% 100%,
        100% 100%;

      transform:
        perspective(520px)
        rotateX(48deg)
        scale(1.05);

      transform-origin:center;
      transition:transform .12s linear;
    }

    #aire-scene-v3:after{
      content:"";
      position:absolute;
      inset:18% 8% 8%;
      border:1px solid #62e0c220;
      border-radius:28px;
      background:#62e0c205;
      pointer-events:none;
    }

    .aire-decoration-v3{
      position:absolute;
      width:38px;
      height:16px;
      border-radius:50%;
      background:#1b4a52aa;
      border:1px solid #62e0c218;
      box-shadow:0 3px 5px #0005;
    }

    .aire-object-v3{
      position:absolute;
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
        0 0 8px #e6c17a33;

      transform:
        translate(-50%,-50%)
        rotate(45deg);

      z-index:4;
    }

    .aire-object-v3:after{
      content:"";
      position:absolute;
      width:6px;
      height:6px;
      left:3px;
      top:3px;
      border-radius:2px;
      background:#ffffff55;
    }

    #aire-alpha-v3{
      position:absolute;
      left:50%;
      top:58%;

      width:52px;
      height:76px;

      transform:
        translate(-50%,-50%);

      z-index:20;
      pointer-events:none;

      filter:
        drop-shadow(0 7px 8px #0009);
    }

    #aire-alpha-v3 .head{
      position:absolute;

      left:13px;
      top:0;

      width:26px;
      height:29px;

      border:
        2px solid #d8e3e5;

      border-radius:
        10px 10px 9px 9px;

      background:
        linear-gradient(
          145deg,
          #121c21,
          #05090b
        );

      box-shadow:
        0 0 14px #62e0c255;
    }

    #aire-alpha-v3 .head:after{
      content:"";

      position:absolute;

      left:6px;
      top:11px;

      width:12px;
      height:4px;

      border-radius:5px;

      background:#62e0c2;

      box-shadow:
        0 0 10px currentColor;
    }

    #aire-alpha-v3 .body{
      position:absolute;

      left:10px;
      top:27px;

      width:32px;
      height:36px;

      border-radius:
        11px 11px 13px 13px;

      background:
        linear-gradient(
          135deg,
          #eef2f2,
          #89999e 55%,
          #27343a
        );

      border:
        1px solid #dbe6e677;
    }

    #aire-alpha-v3 i{
      position:absolute;

      width:8px;
      height:20px;

      border-radius:6px;

      background:#26343a;
    }

    #aire-alpha-v3 .l1{
      left:3px;
      top:31px;
      transform:rotate(12deg);
    }

    #aire-alpha-v3 .r1{
      right:3px;
      top:31px;
      transform:rotate(-12deg);
    }

    #aire-alpha-v3 .l2{
      left:13px;
      top:60px;
    }

    #aire-alpha-v3 .r2{
      right:13px;
      top:60px;
    }

    #aire-alpha-v3.alert .head:after{
      background:#ff5d72;
    }

    #aire-alpha-v3.tired .head:after{
      background:#ffc86b;
    }

    #aire-alpha-v3.action .head:after{
      background:#8bb7ff;
    }

    #aire-alpha-label-v3{
      position:absolute;

      left:50%;
      top:44%;

      transform:
        translate(-50%,-100%);

      z-index:21;

      padding:
        4px 8px;

      border:
        1px solid #62e0c255;

      border-radius:99px;

      background:#071018dd;

      color:#62e0c2;

      font:
        700 9px monospace;

      pointer-events:none;
    }
  `;

  document.head.appendChild(style);


  /* ------------------------------------------------------------
     Création du nouveau monde
     ------------------------------------------------------------ */

  function createWorld(){

    world.innerHTML = "";

    const scene =
      document.createElement("div");

    scene.id =
      "aire-scene-v3";

    world.appendChild(scene);


    /* Décor léger */

    for(let i=0;i<7;i++){

      const d =
        document.createElement("div");

      d.className =
        "aire-decoration-v3";

      d.style.left =
        (8 + i * 14) + "%";

      d.style.top =
        (25 + (i % 3) * 24) + "%";

      scene.appendChild(d);
    }


    /* Alpha */

    const alpha =
      document.createElement("div");

    alpha.id =
      "aire-alpha-v3";

    alpha.innerHTML =
      '<div class="head"></div>' +
      '<div class="body"></div>' +
      '<i class="l1"></i>' +
      '<i class="r1"></i>' +
      '<i class="l2"></i>' +
      '<i class="r2"></i>';

    world.appendChild(alpha);


    const label =
      document.createElement("div");

    label.id =
      "aire-alpha-label-v3";

    label.textContent =
      "ALPHA";

    world.appendChild(label);
  }


  createWorld();


  /* ------------------------------------------------------------
     Traduction
     ------------------------------------------------------------ */

  function traduireAction(action){

    const a =
      String(action || "")
      .toLowerCase();

    if(a.includes("grasp"))
      return "Saisie";

    if(a.includes("release"))
      return "Relâchement";

    if(a.includes("intake"))
      return "Absorption";

    if(a.includes("push"))
      return "Poussée";

    if(a.includes("move"))
      return "Déplacement";

    if(a.includes("rest"))
      return "Repos";

    if(a.includes("observe"))
      return "Observation";

    return action || "Observation";
  }


  function traduireCommandes(){

    const buttons =
      document.querySelectorAll(
        ".commands button"
      );

    const labels = [

      "→ Droite",
      "← Gauche",

      "↑ Avant",
      "↓ Arrière",

      "↥ Haut",

      "Absorber",
      "Pousser",
      "Saisir",
      "Relâcher"
    ];

    buttons.forEach((button,i)=>{

      if(labels[i])
        button.textContent =
          labels[i];
    });


    const action =
      document.getElementById("action");

    if(action){

      action.dataset.original =
        action.textContent;

      action.textContent =
        traduireAction(
          action.dataset.original
        );
    }
  }


  /* ------------------------------------------------------------
     Rendu du monde
     ------------------------------------------------------------ */

  window.drawWorld =
    function(s){

      const scene =
        document.getElementById(
          "aire-scene-v3"
        );

      const alpha =
        document.getElementById(
          "aire-alpha-v3"
        );

      if(!scene || !alpha || !s)
        return;


      /*
       * IMPORTANT :
       *
       * Alpha reste au centre.
       * Les objets sont dessinés relativement
       * à sa position.
       */

      alpha.style.left =
        "50%";

      alpha.style.top =
        "58%";


      scene
        .querySelectorAll(
          ".aire-object-v3"
        )
        .forEach(e=>e.remove());


      const ax =
        Number(
          s.position?.[0] || 0
        );

      const ay =
        Number(
          s.position?.[1] || 0
        );

      const az =
        Number(
          s.position?.[2] || 0
        );


      /*
       * Échelle volontairement faible.
       * Cela permet de garder plusieurs objets
       * visibles sans créer un monde lourd.
       */

      const scale =
        0.42;


      (s.objects || [])
      .forEach(o=>{

        const ox =
          Number(o.x || 0);

        const oy =
          Number(o.y || 0);

        const oz =
          Number(o.z || 0);


        /*
         * Position de l'objet RELATIVE à Alpha.
         *
         * Si Alpha avance :
         * le monde recule visuellement.
         */

        const dx =
          (ox - ax) * scale;

        const dy =
          (ay - oy) * scale;


        const x =
          50 + dx;

        const y =
          50 + dy * 0.62;


        if(
          x < -15 ||
          x > 115 ||
          y < -10 ||
          y > 110
        )
          return;


        const object =
          document.createElement("div");

        object.className =
          "aire-object-v3";


        object.style.left =
          x + "%";

        object.style.top =
          y + "%";


        /*
         * Petite variation de profondeur
         * basée sur Z.
         */

        const depth =
          Math.max(
            0.72,
            Math.min(
              1.18,
              1 +
              (oz - az) *
              0.00025
            )
          );


        object.style.transform =
          "translate(-50%,-50%) " +
          "rotate(45deg) " +
          "scale(" +
          depth +
          ")";


        scene.appendChild(
          object
        );
      });


      /*
       * Mouvement subtil du décor.
       * Alpha reste fixe.
       */

      const cameraX =
        Math.max(
          -8,
          Math.min(
            8,
            -ax * 0.004
          )
        );

      const cameraY =
        Math.max(
          -6,
          Math.min(
            6,
            ay * 0.003
          )
        );


      scene.style.transform =
        "perspective(520px) " +
        "rotateX(48deg) " +
        "scale(1.05) " +
        "translate(" +
        cameraX +
        "%," +
        cameraY +
        "%)";


      /* État lumineux du casque */

      const action =
        String(
          s.action || ""
        ).toLowerCase();

      const fatigue =
        Number(
          s.physiology?.fatigue || 0
        ) * 100;

      const douleur =
        Number(
          s.physiology?.pain || 0
        ) * 100;


      alpha.classList.remove(
        "alert",
        "tired",
        "action"
      );


      if(douleur > 20){

        alpha.classList.add(
          "alert"
        );

      }else if(fatigue > 50){

        alpha.classList.add(
          "tired"
        );

      }else if(
        /move|grasp|push|release|intake/
        .test(action)
      ){

        alpha.classList.add(
          "action"
        );
      }


      /* Action affichée en français */

      const actionBox =
        document.getElementById(
          "action"
        );

      if(actionBox){

        actionBox.textContent =
          traduireAction(
            s.action
          );
      }


      traduireCommandes();


      /*
       * Position réelle toujours visible
       * dans les données du monde.
       */

      const pos =
        document.getElementById(
          "position"
        );

      if(pos){

        pos.title =
          "Position réelle d'Alpha : " +
          ax.toFixed(3) +
          " / " +
          ay.toFixed(3) +
          " / " +
          az.toFixed(3);
      }
    };


  /* ------------------------------------------------------------
     On garde le moteur de simulation intact.
     On ne modifie que son affichage.
     ------------------------------------------------------------ */

  console.log(
    "AIRE : environnement V3 + caméra Alpha active"
  );

})();
