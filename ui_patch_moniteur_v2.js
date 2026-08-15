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

  const a=document.createElement("div");
  a.id="aire-alpha";
  a.innerHTML=
    '<div class="head"></div>'+
    '<div class="body"></div>'+
    '<i class="l1"></i><i class="r1"></i>'+
    '<i class="l2"></i><i class="r2"></i>';
  world.appendChild(a);

  const label=document.createElement("div");
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

  const observer=new MutationObserver(()=>{
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
