/* AIRE Genesis — Moniteur UI Patch v1
 * Lightweight visual layer: no WebGL, no external library, no simulation-loop changes.
 * Add <script src="ui_patch_moniteur_v1.js"></script> before </body> in index.html.
 */
(() => {
  'use strict';
  if (window.__AIRE_UI_PATCH__) return;
  window.__AIRE_UI_PATCH__ = true;

  const $ = (s, r = document) => r.querySelector(s);
  const world = $('#world');
  if (!world) return;

  const css = `
  #world.aire-monitor{height:300px;background:linear-gradient(155deg,#07131d 0%,#0b2230 55%,#0d2b38 100%);perspective:700px;}
  #world.aire-monitor:before{background-image:linear-gradient(#7de8c208 1px,transparent 1px),linear-gradient(90deg,#7de8c208 1px,transparent 1px);background-size:28px 28px;transform:skewY(-3deg) scale(1.08);}
  .aire-ground{position:absolute;inset:18% -8% -25%;border:1px solid #62e0c233;border-radius:30px;background:linear-gradient(145deg,#123744aa,#07131dcc);transform:rotateX(54deg) rotateZ(-1deg);box-shadow:inset 0 0 50px #0008;}
  .aire-path{position:absolute;left:50%;top:52%;width:3px;height:100px;background:linear-gradient(#62e0c2aa,#62e0c200);transform-origin:top;opacity:.7;}
  .aire-alpha{position:absolute;left:50%;top:52%;width:42px;height:62px;transform:translate(-50%,-55%);z-index:8;transition:left .25s linear,top .25s linear;}
  .aire-alpha .body{position:absolute;left:9px;top:17px;width:24px;height:35px;border-radius:10px;background:linear-gradient(135deg,#f0f5f4,#9ba9ad 52%,#26343b);border:1px solid #d7e1df99;box-shadow:0 4px 12px #0009;}
  .aire-alpha .head{position:absolute;left:11px;top:0;width:20px;height:22px;border-radius:9px;background:#090e12;border:2px solid #dce6e599;box-shadow:0 0 10px #62e0c255;}
  .aire-alpha .head:after{content:"";position:absolute;left:5px;top:8px;width:10px;height:4px;border-radius:50%;background:#62e0c2;box-shadow:0 0 8px currentColor;}
  .aire-alpha .leg{position:absolute;top:47px;width:7px;height:15px;border-radius:4px;background:#27343a}.aire-alpha .leg.l{left:12px}.aire-alpha .leg.r{right:12px}
  .aire-alpha .arm{position:absolute;top:22px;width:7px;height:20px;border-radius:4px;background:#27343a}.aire-alpha .arm.l{left:3px;transform:rotate(12deg)}.aire-alpha .arm.r{right:3px;transform:rotate(-12deg)}
  .aire-alpha.state-blue .head:after{background:#75aaff}.aire-alpha.state-yellow .head:after{background:#ffd166}.aire-alpha.state-orange .head:after{background:#ff9f43}.aire-alpha.state-red .head:after{background:#ff5b6e}.aire-alpha.state-purple .head:after{background:#b58cff}.aire-alpha.state-white .head:after{background:#fff}
  .aire-badge{position:absolute;left:50%;top:42%;transform:translate(-50%,-100%);z-index:9;padding:3px 7px;border:1px solid #62e0c277;border-radius:99px;background:#071018dd;color:#62e0c2;font:700 9px -apple-system,BlinkMacSystemFont,sans-serif;letter-spacing:.08em;pointer-events:none;}
  .aire-monitor-tools{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:8px 0 0}.aire-monitor-tools button{min-height:34px;padding:5px 9px;font-size:11px}.aire-monitor-tools .active{border-color:#62e0c2;color:#62e0c2;}
  .aire-inventory{margin-top:10px}.aire-inventory-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.aire-item{background:#091525;border:1px solid #203844;border-radius:10px;padding:8px;font-size:11px;display:flex;justify-content:space-between}.aire-item b{color:#62e0c2}
  .aire-perf{font-size:9px;color:#8196aa;margin-left:auto}.aire-perf strong{color:#67e3a2}
  .aire-expression{font-size:10px;color:#8196aa;margin-top:7px}.aire-expression b{color:#edf6ff}
  @media(max-width:560px){#world.aire-monitor{height:280px}}
  `;
  const style = document.createElement('style');
  style.id = 'aire-ui-patch-style';
  style.textContent = css;
  document.head.appendChild(style);

  world.classList.add('aire-monitor');

  const ground = document.createElement('div');
  ground.className='aire-ground';
  world.appendChild(ground);

  const path = document.createElement('div');
  path.className='aire-path';
  world.appendChild(path);

  const alpha = document.createElement('div');
  alpha.className='aire-alpha';
  alpha.innerHTML='<div class="head"></div><div class="body"></div><div class="arm l"></div><div class="arm r"></div><div class="leg l"></div><div class="leg r"></div>';
  world.appendChild(alpha);

  const badge = document.createElement('div');
  badge.className='aire-badge';
  badge.textContent='ALPHA';
  world.appendChild(badge);

  const card = world.closest('.card');
  const tools = document.createElement('div');
  tools.className='aire-monitor-tools';
  tools.innerHTML='<button id="aireFollow" class="active">◉ Suivi Alpha</button><button id="aireCenter">◎ Recentrer</button><span class="aire-perf">Rendu <strong>léger</strong></span>';
  card.appendChild(tools);

  const invCard = document.createElement('section');
  invCard.className='card aire-inventory';
  invCard.innerHTML='<div class="sectionhead"><h2>Inventaire</h2><span class="muted">objets conservés</span></div><div id="aireInventoryGrid" class="aire-inventory-grid"><div class="aire-item"><span>Aucun objet enregistré</span><b>—</b></div></div>';
  const commandsCard = document.querySelector('.commands')?.closest('.card');
  if (commandsCard) commandsCard.parentNode.insertBefore(invCard, commandsCard);

  const exprCard = document.createElement('section');
  exprCard.className='card';
  exprCard.innerHTML='<div class="sectionhead"><h2>État expressif</h2><span class="muted">sortie visuelle</span></div><div id="aireExpression" class="aire-expression"><b>Calme</b> · état stable</div>';
  if (commandsCard) commandsCard.parentNode.insertBefore(exprCard, commandsCard);

  const followBtn=$('#aireFollow'), centerBtn=$('#aireCenter');
  let follow=true, lastX=0, lastY=0;

  followBtn.onclick=()=>{
    follow=!follow;
    followBtn.classList.toggle('active',follow);
    followBtn.textContent=follow?'◉ Suivi Alpha':'○ Suivi désactivé';
  };
  centerBtn.onclick=()=>{
    alpha.style.left='50%';
    alpha.style.top='52%';
    path.style.transform='rotate(0deg)';
  };

  const val = id => {
    const e=document.getElementById(id);
    if(!e) return NaN;
    const n=parseFloat((e.textContent||'').replace(',','.').replace(/[^0-9+-.]/g,''));
    return n;
  };
  const action = () => (document.getElementById('action')?.textContent||'').trim().toLowerCase();

  function expression(){
    const fatigue=val('fat'), pain=val('pain'), reward=val('reward');
    const a=action();
    let state='Calme', cls='';
    if (pain>20 || /danger|alerte/.test(a)) {state='Danger / douleur';cls='state-red';}
    else if (fatigue>50 || /rest|repos/.test(a)) {state='Stress / fatigue';cls='state-orange';}
    else if (reward<0) {state='Attention';cls='state-yellow';}
    else if (/grasp|sais|intake|absor/.test(a)) {state='Interaction';cls='state-blue';}
    else if (/move|avance|gauche|droite|avant|arrière/.test(a)) {state='Exploration';cls='state-blue';}
    else if (reward>0.05) {state='Réussite';cls='state-purple';}
    alpha.className='aire-alpha '+cls;
    const e=$('#aireExpression');
    if(e) e.innerHTML='<b>'+state+'</b> · dérivé des valeurs observées';
  }

  function track(){
    const p=document.getElementById('position')?.textContent||'';
    const nums=p.match(/[-+]?\d+(?:[.,]\d+)?/g);
    if(nums && nums.length>=2){
      const x=parseFloat(nums[0].replace(',','.'));
      const y=parseFloat(nums[1].replace(',','.'));
      if(Number.isFinite(x)&&Number.isFinite(y)&&follow){
        const dx=Math.max(-42,Math.min(42,(x-lastX)*0.035));
        const dy=Math.max(-34,Math.min(34,(y-lastY)*0.035));
        alpha.style.left=(50+dx)+'%';
        alpha.style.top=(52+dy)+'%';
        path.style.transform=`rotate(${Math.max(-35,Math.min(35,(x-y)*0.01))}deg)`;
        lastX=x; lastY=y;
      }
    }
    expression();
  }

  // UI is intentionally throttled: the simulation can run fast while the visual layer repaints ~6 Hz.
  let scheduled=false;
  const schedule=()=>{
    if(scheduled)return;
    scheduled=true;
    setTimeout(()=>{scheduled=false;track();},160);
  };
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  setInterval(schedule,500);
  schedule();

  // French labels only; simulation action names remain untouched internally.
  const labels={'push':'Pousser','grasp':'Saisir','release':'Lâcher','rest':'Repos','intake':'Absorber','move_x+':'Droite','move_x-':'Gauche','move_y+':'Avant','move_y-':'Arrière','move_z+':'Monter'};
  const translate=()=>{
    document.querySelectorAll('button,#action').forEach(el=>{
      const t=(el.textContent||'').trim().toLowerCase();
      if(labels[t]) el.textContent=labels[t];
    });
  };
  setInterval(translate,1000);
  translate();
})();
