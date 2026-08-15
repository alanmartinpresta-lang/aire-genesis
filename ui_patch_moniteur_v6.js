/* ============================================================
   AIRE GENESIS — MONITEUR V6
   Couche visuelle unique : environnement + caméra + Alpha + actions
   Ne modifie pas la physique ni les décisions d'Alpha.
   ============================================================ */
(() => {
  "use strict";

  if (window.AIRE_MONITEUR_V6) return;
  window.AIRE_MONITEUR_V6 = true;

  const $ = (s, r = document) => r.querySelector(s);
  const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  let lastState = null;
  let lastPosition = [0, 0, 0];
  let camera = [0, 0];
  let lastAction = "";
  let scene = null;
  let alpha = null;
  let objectEls = new Map();
  let decorationEls = [];
  let hooked = false;

  const ACTION_FR = {
    grasp: "Ramassage",
    release: "Relâchement",
    intake: "Absorption",
    push: "Poussée",
    rest: "Repos",
    observe: "Observation",
    move: "Déplacement",
    move_x: "Déplacement",
    move_y: "Déplacement",
    move_z: "Déplacement vertical"
  };

  const TEXT_FR = {
    "External Commands": "Commandes externes",
    "External commands": "Commandes externes",
    "injects a command": "injecte une commande",
    "Autonomy": "Autonomie",
    "Autonomy ON": "Autonomie active",
    "Memory": "Mémoire",
    "Autobiography": "Autobiographie",
    "Reward": "Récompense",
    "Environment": "Environnement",
    "World": "Monde",
    "Inventory": "Inventaire",
    "State of Alpha": "État d’Alpha",
    "Action": "Action",
    "Observation": "Observation",
    "Sensors": "Capteurs",
    "Temperature": "Température",
    "Water": "Eau",
    "Nutrients": "Nutriments",
    "Pressure": "Pression",
    "Light": "Lumière",
    "Follow Alpha": "Suivi Alpha",
    "Recenter": "Recentrer",
    "objects": "objets",
    "stored objects": "objets conservés"
  };

  function translateUI() {
    const all = document.querySelectorAll(
      "button,h1,h2,h3,h4,label,small,span,div,p"
    );

    all.forEach(el => {
      if (el.children.length) return;

      const t = String(el.textContent || "").trim();
      if (!t) return;

      if (TEXT_FR[t]) {
        el.textContent = TEXT_FR[t];
      } else if (/^X\+$/.test(t)) {
        el.textContent = "→ Droite";
      } else if (/^X-$/.test(t)) {
        el.textContent = "← Gauche";
      } else if (/^Y\+$/.test(t)) {
        el.textContent = "↑ Avant";
      } else if (/^Y-$/.test(t)) {
        el.textContent = "↓ Arrière";
      } else if (/^Z\+$/.test(t)) {
        el.textContent = "↥ Haut";
      } else if (t === "Intake") {
        el.textContent = "Absorber";
      } else if (t === "Push") {
        el.textContent = "Pousser";
      } else if (t === "Grasp") {
        el.textContent = "Saisir";
      } else if (t === "Release") {
        el.textContent = "Relâcher";
      } else if (t === "Autonomie ON") {
        el.textContent = "Autonomie active";
      }
    });
  }

  function installCSS() {
    if ($("#aire-v6-style")) return;

    const s = document.createElement("style");
    s.id = "aire-v6-style";

    s.textContent = `
      #world.aire-v6-world{
        height:300px!important;
        min-height:300px!important;
        position:relative!important;
        overflow:hidden!important;
        border-radius:18px!important;
        isolation:isolate!important;
        background:
          linear-gradient(
            #071a22,
            #0c2b32 58%,
            #06171d
          )!important;
      }

      #world.aire-v6-world .aire-v6-scene{
        position:absolute;
        inset:0;
        overflow:hidden;
        perspective:700px;
        transform-style:preserve-3d;

        background:
          radial-gradient(
            ellipse at 50% 46%,
            #3b857044 0 9%,
            transparent 45%
          ),
          linear-gradient(
            160deg,
            #0b2630,
            #123b3e 52%,
            #071b22
          );
      }

      .aire-v6-ground{
        position:absolute;
        width:120px;
        height:64px;
        border-radius:50%;
        transform:translate(-50%,-50%);

        background:
          radial-gradient(
            ellipse,
            #3d8a7045 0 38%,
            #183f3a22 62%,
            transparent 72%
          );

        border:1px solid #73c9b522;
      }

      .aire-v6-rock{
        position:absolute;
        width:30px;
        height:18px;
        border-radius:55% 45% 40% 60%;

        transform:
          translate(-50%,-50%)
          rotate(-8deg);

        background:
          linear-gradient(
            145deg,
            #879394,
            #29383c 65%
          );

        box-shadow:
          0 7px 8px #0008,
          inset 3px 2px 3px #fff3;
      }

      .aire-v6-tree{
        position:absolute;
        width:34px;
        height:48px;
        transform:
          translate(-50%,-100%);
      }

      .aire-v6-tree:before{
        content:"";
        position:absolute;
        left:14px;
        bottom:0;
        width:7px;
        height:25px;
        border-radius:5px;
        background:#604b36;
        box-shadow:0 5px 7px #0006;
      }

      .aire-v6-tree:after{
        content:"";
        position:absolute;
        left:3px;
        top:0;
        width:28px;
        height:30px;
        border-radius:55% 45% 60% 40%;

        background:
          radial-gradient(
            circle at 35% 30%,
            #7dbb76,
            #245d4d 70%
          );

        box-shadow:0 5px 9px #0007;
      }

      .aire-v6-water{
        position:absolute;
        width:130px;
        height:55px;
        border-radius:50%;
        transform:translate(-50%,-50%);

        background:
          radial-gradient(
            ellipse,
            #53b8c433,
            #1a657033 55%,
            transparent 72%
          );

        border:1px solid #67d2dc2c;
        box-shadow:
          inset 0 0 14px #65d9e51b;
      }

      .aire-v6-object{
        position:absolute;
        width:21px;
        height:21px;
        border-radius:6px;

        transform:
          translate(-50%,-50%)
          rotate(45deg);

        background:
          linear-gradient(
            145deg,
            #ffd982,
            #a96732
          );

        border:1px solid #ffe7a888;

        box-shadow:
          0 6px 9px #0009,
          0 0 12px #e8b96533;

        z-index:12;
        will-change:left,top,transform;
      }

      .aire-v6-object:after{
        content:"";
        position:absolute;
        left:4px;
        top:4px;
        width:6px;
        height:6px;
        border-radius:2px;
        background:#fff8;
      }

      .aire-v6-object.near{
        animation:
          aireV6ObjectPulse
          .8s
          ease-in-out
          infinite
          alternate;
      }

      #aire-v6-alpha{
        position:absolute;
        left:50%;
        top:57%;

        width:62px;
        height:88px;

        transform:
          translate(-50%,-50%);

        z-index:40;
        pointer-events:none;

        filter:
          drop-shadow(
            0 9px 9px #000b
          );

        will-change:filter;
      }

      #aire-v6-alpha .head{
        position:absolute;
        left:16px;
        top:0;

        width:29px;
        height:31px;

        border:2px solid #e5eeee;
        border-radius:11px 11px 9px 9px;

        background:
          linear-gradient(
            145deg,
            #172328,
            #030708
          );

        box-shadow:
          0 0 15px #62e0c255;
      }

      #aire-v6-alpha .screen{
        position:absolute;
        left:6px;
        top:12px;

        width:13px;
        height:4px;

        border-radius:6px;

        background:#62e0c2;

        box-shadow:
          0 0 10px currentColor;
      }

      #aire-v6-alpha .body{
        position:absolute;
        left:12px;
        top:29px;

        width:38px;
        height:42px;

        border-radius:
          12px 12px 14px 14px;

        background:
          linear-gradient(
            135deg,
            #f1f4f3,
            #87979b 56%,
            #26353a
          );

        border:1px solid #e5eeee77;
      }

      #aire-v6-alpha .arm,
      #aire-v6-alpha .leg{
        position:absolute;
        border-radius:8px;
        background:#26353a;
        transform-origin:50% 5px;
      }

      #aire-v6-alpha .arm{
        width:9px;
        height:25px;
        top:34px;
      }

      #aire-v6-alpha .left-arm{
        left:2px;
        transform:rotate(12deg);
      }

      #aire-v6-alpha .right-arm{
        right:2px;
        transform:rotate(-12deg);
      }

      #aire-v6-alpha .leg{
        width:9px;
        height:23px;
        top:68px;
      }

      #aire-v6-alpha .left-leg{
        left:16px;
      }

      #aire-v6-alpha .right-leg{
        right:16px;
      }

      #aire-v6-alpha.walk .left-leg{
        animation:
          aireV6LegL
          .32s
          infinite
          alternate
          ease-in-out;
      }

      #aire-v6-alpha.walk .right-leg{
        animation:
          aireV6LegR
          .32s
          infinite
          alternate
          ease-in-out;
      }

      #aire-v6-alpha.walk .left-arm{
        animation:
          aireV6ArmL
          .32s
          infinite
          alternate
          ease-in-out;
      }

      #aire-v6-alpha.walk .right-arm{
        animation:
          aireV6ArmR
          .32s
          infinite
          alternate
          ease-in-out;
      }

      #aire-v6-alpha.walk .body{
        animation:
          aireV6Body
          .32s
          infinite
          alternate
          ease-in-out;
      }

      #aire-v6-alpha.grasp .right-arm{
        animation:
          aireV6Grasp
          .62s
          ease-in-out;
      }

      #aire-v6-alpha.release .right-arm{
        animation:
          aireV6Release
          .55s
          ease-in-out;
      }

      #aire-v6-alpha.intake .right-arm{
        animation:
          aireV6Intake
          .62s
          ease-in-out;
      }

      #aire-v6-alpha.push .left-arm,
      #aire-v6-alpha.push .right-arm{
        animation:
          aireV6Push
          .4s
          infinite
          alternate
          ease-in-out;
      }

      #aire-v6-alpha.push .body{
        animation:
          aireV6PushBody
          .4s
          infinite
          alternate
          ease-in-out;
      }

      #aire-v6-label{
        position:absolute;
        left:50%;
        top:-24px;

        transform:
          translateX(-50%);

        padding:4px 9px;
        border-radius:12px;

        background:#071d25dd;
        border:1px solid #65e0c577;

        color:#6de3c7;

        font:bold 11px system-ui;
        letter-spacing:.7px;
        white-space:nowrap;
      }

      #aire-v6-action{
        position:absolute;
        left:50%;
        bottom:8px;

        transform:
          translateX(-50%);

        z-index:50;

        padding:5px 10px;
        border-radius:12px;

        background:#06161dcc;
        border:1px solid #ffffff16;

        color:#d9eeee;

        font:600 11px system-ui;

        pointer-events:none;
      }

      @keyframes aireV6LegL{
        to{
          transform:rotate(25deg);
        }
      }

      @keyframes aireV6LegR{
        to{
          transform:rotate(-25deg);
        }
      }

      @keyframes aireV6ArmL{
        to{
          transform:rotate(-18deg);
        }
      }

      @keyframes aireV6ArmR{
        to{
          transform:rotate(18deg);
        }
      }

      @keyframes aireV6Body{
        to{
          transform:translateY(-2px);
        }
      }

      @keyframes aireV6Grasp{
        50%{
          transform:
            rotate(58deg)
            translateY(5px);
        }

        100%{
          transform:rotate(5deg);
        }
      }

      @keyframes aireV6Release{
        50%{
          transform:rotate(-55deg);
        }

        100%{
          transform:rotate(-5deg);
        }
      }

      @keyframes aireV6Intake{
        50%{
          transform:
            rotate(65deg)
            translateY(-4px);
        }

        100%{
          transform:rotate(5deg);
        }
      }

      @keyframes aireV6Push{
        to{
          transform:
            rotate(48deg)
            translateY(2px);
        }
      }

      @keyframes aireV6PushBody{
        to{
          transform:translateX(4px);
        }
      }

      @keyframes aireV6ObjectPulse{
        to{
          box-shadow:
            0 7px 10px #0009,
            0 0 18px #ffd66a77;
        }
      }
    `;

    document.head.appendChild(s);
  }

  function posOf(p){
    if(Array.isArray(p)){
      return [
        num(p[0]),
        num(p[1]),
        num(p[2])
      ];
    }

    if(p && typeof p === "object"){
      return [
        num(p.x),
        num(p.y),
        num(p.z)
      ];
    }

    return [0,0,0];
  }

  function statePosition(s){
    return posOf(
      s?.position ??
      s?.pos ??
      s?.alpha?.position ??
      s?.self?.position
    );
  }

  function stateObjects(s){
    const a =
      s?.objects ??
      s?.world?.objects;

    return Array.isArray(a) ? a : [];
  }

  function objectPos(o){
    return posOf(
      o?.position ??
      o?.pos ??
      o
    );
  }

  function actionOf(s){
    const raw =
      s?.action ??
      $("#action")?.textContent ??
      "";

    const k =
      String(raw)
        .toLowerCase()
        .replace(/[-\s]/g,"_");

    for(const key of Object.keys(ACTION_FR)){
      if(k.includes(key)){
        return {
          raw,
          fr:ACTION_FR[key]
        };
      }
    }

    return {
      raw,
      fr:raw || "Observation"
    };
  }

  function makeDecorations(){
    if(!scene || decorationEls.length) return;

    const kinds=[
      "ground",
      "ground",
      "water",
      "rock",
      "tree",
      "ground",
      "rock",
      "tree",
      "water",
      "ground"
    ];

    for(let i=0;i<34;i++){
      const el=document.createElement("div");

      const kind=
        kinds[i%kinds.length];

      el.className=
        "aire-v6-"+kind;

      const angle=
        i*2.3999632297;

      const radius=
        150+((i*83)%420);

      el.dataset.wx=
        String(
          Math.cos(angle)*radius
        );

      el.dataset.wy=
        String(
          Math.sin(angle)*radius
        );

      if(kind==="ground"){
        el.style.width=
          (90+(i%4)*35)+"px";

        el.style.height=
          (40+(i%3)*18)+"px";
      }

      scene.appendChild(el);
      decorationEls.push(el);
    }
  }

  function ensureUI(){
    const world=$("#world");

    if(!world) return false;

    world.classList.add(
      "aire-v6-world"
    );

    if(!scene){

      scene=
        document.createElement("div");

      scene.className=
        "aire-v6-scene";

      world.replaceChildren(
        scene
      );

      makeDecorations();

      alpha=
        document.createElement("div");

      alpha.id=
        "aire-v6-alpha";

      alpha.innerHTML=`
        <div id="aire-v6-label">ALPHA</div>

        <div class="head">
          <div class="screen"></div>
        </div>

        <div class="body"></div>

        <div class="arm left-arm"></div>
        <div class="arm right-arm"></div>

        <div class="leg left-leg"></div>
        <div class="leg right-leg"></div>
      `;

      world.appendChild(alpha);

      const act=
        document.createElement("div");

      act.id=
        "aire-v6-action";

      act.textContent=
        "Observation";

      world.appendChild(act);
    }

    return true;
  }

  function mapToScreen(
    wx,
    wy,
    wz,
    ax,
    ay
  ){
    const dx=
      wx-ax;

    const dy=
      wy-ay;

    const depth=
      clamp(
        1+(dy*0.00035),
        .72,
        1.35
      );

    const x=
      50+
      dx*0.095*
      depth;

    const y=
      57+
      dy*0.065*
      depth-
      wz*0.018;

    return [
      x,
      y,
      depth
    ];
  }

  function renderWorld(s){

    if(!ensureUI()) return;

    const p=
      statePosition(s);

    const objects=
      stateObjects(s);

    const ax=
      p[0];

    const ay=
      p[1];

    /*
      Caméra fluide :
      Alpha reste fixe au centre.
      Le monde se déplace autour de lui.
    */
    const smooth=
      .18;

    camera[0]+=
      (ax-camera[0])*
      smooth;

    camera[1]+=
      (ay-camera[1])*
      smooth;

    decorationEls.forEach(el=>{

      const wx=
        num(el.dataset.wx);

      const wy=
        num(el.dataset.wy);

      const [
        x,
        y,
        scale
      ]=
        mapToScreen(
          wx,
          wy,
          0,
          camera[0],
          camera[1]
        );

      el.style.left=
        x+"%";

      el.style.top=
        y+"%";

      el.style.transform=
        `translate(-50%,-50%) scale(${scale})`;

      el.style.zIndex=
        String(
          Math.round(y*10)
        );
    });

    const seen=
      new Set();

    objects.forEach((o,i)=>{

      const id=
        String(
          o?.id ??
          o?.uid ??
          i
        );

      seen.add(id);

      let el=
        objectEls.get(id);

      if(!el){

        el=
          document.createElement("div");

        el.className=
          "aire-v6-object";

        scene.appendChild(el);

        objectEls.set(
          id,
          el
        );
      }

      const q=
        objectPos(o);

      const [
        x,
        y,
        scale
      ]=
        mapToScreen(
          q[0],
          q[1],
          q[2],
          camera[0],
          camera[1]
        );

      el.style.left=
        x+"%";

      el.style.top=
        y+"%";

      el.style.zIndex=
        String(
          Math.round(y*10)+20
        );

      el.style.transform=
        `translate(-50%,-50%) rotate(45deg) scale(${scale})`;

      el.title=
        String(
          o?.name ??
          o?.type ??
          "Objet"
        );
    });

    objectEls.forEach(
      (el,id)=>{
        if(!seen.has(id)){
          el.remove();
          objectEls.delete(id);
        }
      }
    );

    const a=
      actionOf(s);

    const moving=
      /déplacement|move|walk/i.test(
        a.fr+" "+a.raw
      );

    alpha.classList.toggle(
      "walk",
      moving
    );

    if(a.raw!==lastAction){

      lastAction=
        a.raw;

      alpha.classList.remove(
        "grasp",
        "release",
        "intake",
        "push"
      );

      const k=
        String(a.raw)
          .toLowerCase();

      if(k.includes("grasp")){
        alpha.classList.add(
          "grasp"
        );
      }
      else if(k.includes("release")){
        alpha.classList.add(
          "release"
       
