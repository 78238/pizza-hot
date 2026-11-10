const catalog = {
    pepperoni:{name:'Pepperoni',emoji:'🍕'}, mushroom:{name:'Champiñón',emoji:'🍄'},
    olive:{name:'Aceituna',emoji:'🫒'}, pepper:{name:'Pimiento',emoji:'🫑'},
    onion:{name:'Cebolla',emoji:'🧅'}, pineapple:{name:'Piña',emoji:'🍍'},
    jalapeno:{name:'Jalapeño',emoji:'🌶️'}, cheese:{name:'Queso',emoji:'🧀'},
    tomato:{name:'Tomate',emoji:'🍅'}, basil:{name:'Albahaca',emoji:'🌿'}
  };
  const customers = [
    {name:'Capitán Tomate',avatar:'🧑‍🚀'}, {name:'Doña Mozzarella',avatar:'👩‍🍳'},
    {name:'El Profe Pimiento',avatar:'🧑‍🏫'}, {name:'Robot Pepperoni',avatar:'🤖'},
    {name:'La Reina Piña',avatar:'👑'}, {name:'Ninja Champiñón',avatar:'🥷'}
  ];
  const $ = id => document.getElementById(id);
  const pizza=$('pizza'), tray=$('ingredientTray'), toppingsLayer=$('toppings');
  let placed=[], required=[], score=0, streak=0, level=1, orderNo=1, timeLeft=12;
  let dragging=null, pointerId=null, timerId=null, toastId=null, roundFinished=true;
  let playerName='', sessionPlayers=[], currentTurnScore=0;
  
  function randomOrder(){
    const ids=Object.keys(catalog), amount=Math.min(7,5+Math.floor((level-1)/2));
    const shuffled=[...ids].sort(()=>Math.random()-.5);
    required=shuffled.slice(0,amount);
    const customer=customers[Math.floor(Math.random()*customers.length)];
    $('customerName').textContent=customer.name;
    $('customerAvatar').textContent=customer.avatar;
    $('orderNumber').textContent='#'+String(orderNo).padStart(3,'0');
    $('requirements').innerHTML='';
    required.forEach(id=>{
      const el=document.createElement('div');el.className='requirement';el.dataset.id=id;
      el.innerHTML=`<span>${catalog[id].emoji}</span><b>${catalog[id].name}</b>`;
      $('requirements').appendChild(el);
    });
    $('progressText').textContent=`0 / ${required.length}`;
    $('progressFill').style.width='0%';
    $('missionText').textContent=`Prepara el pedido de ${customer.name}.`;
    $('activePlayer').textContent=playerName || 'Chef invitado';
  }
  function clearPizza(){
    toppingsLayer.innerHTML='';placed=[];updateProgress();$('liveMessage').textContent='Pizza lista para comenzar';$('toppingCount').textContent='0';$('pizzaHint').classList.remove('hide');
  }
  function updateProgress(){
    const counts={};placed.forEach(p=>counts[p.id]=(counts[p.id]||0)+1);
    const done=required.filter(id=>(counts[id]||0)>0).length;
    $('progressText').textContent=`${done} / ${required.length}`;
    $('progressFill').style.width=`${done/required.length*100}%`;
    document.querySelectorAll('.requirement').forEach(el=>el.classList.toggle('done',(counts[el.dataset.id]||0)>0));
  }
  function showToast(text){
    const toast=$('toast');toast.textContent=text;toast.classList.add('show');
    clearTimeout(toastId);toastId=setTimeout(()=>toast.classList.remove('show'),1600);
  }
  function addTopping(id,x,y){
    const rect=pizza.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    let dx=x-cx,dy=y-cy,dist=Math.hypot(dx,dy),radius=rect.width*.385;
    if(dist>radius){dx*=radius/dist;dy*=radius/dist}
    const px=Math.max(7,Math.min(93,((cx+dx-rect.left)/rect.width)*100));
    const py=Math.max(7,Math.min(93,((cy+dy-rect.top)/rect.height)*100));
    const item=document.createElement('button');item.type='button';item.className='topping';
    item.textContent=catalog[id].emoji;item.title=`${catalog[id].name}: toca para quitar`;
    item.setAttribute('aria-label',`Quitar ${catalog[id].name}`);
    item.style.left=px+'%';item.style.top=py+'%';
    item.addEventListener('click',()=>{
      item.remove();placed=placed.filter(p=>p.element!==item);updateProgress();
      $('toppingCount').textContent=placed.length;$('liveMessage').textContent=`Quitaste ${catalog[id].name}`;
      if(!placed.length)$('pizzaHint').classList.remove('hide');
    });
    toppingsLayer.appendChild(item);placed.push({id,element:item});
    $('pizzaHint').classList.add('hide');$('toppingCount').textContent=placed.length;
    $('liveMessage').textContent=`¡${catalog[id].name} agregado!`;
    updateProgress();
    const req=document.querySelector(`.requirement[data-id="${id}"]`);
    if(req && req.classList.contains('done'))showToast(`¡Bien! ${catalog[id].name} está en el pedido ⭐`);
  }
  function moveGhost(x,y){$('dragGhost').style.left=x+'px';$('dragGhost').style.top=y+'px'}
  tray.addEventListener('pointerdown',e=>{
    const btn=e.target.closest('.ingredient');if(!btn||roundFinished)return;
    e.preventDefault();dragging=btn.dataset.id;pointerId=e.pointerId;
    $('dragGhost').textContent=catalog[dragging].emoji;$('dragGhost').style.display='grid';
    moveGhost(e.clientX,e.clientY);
  });
  document.addEventListener('pointermove',e=>{
    if(!dragging||e.pointerId!==pointerId)return;
    moveGhost(e.clientX,e.clientY);
    const r=pizza.getBoundingClientRect(),inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
    pizza.classList.toggle('is-over',inside);
  });
  document.addEventListener('pointerup',e=>{
    if(!dragging||e.pointerId!==pointerId)return;
    const r=pizza.getBoundingClientRect(),inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
    if(inside)addTopping(dragging,e.clientX,e.clientY);
    else $('liveMessage').textContent='Suelta el ingrediente sobre la pizza';
    dragging=null;pointerId=null;$('dragGhost').style.display='none';pizza.classList.remove('is-over');
  });
  document.addEventListener('pointercancel',()=>{
    dragging=null;pointerId=null;$('dragGhost').style.display='none';pizza.classList.remove('is-over');
  });
  function updateStats(){
    $('score').textContent=String(score).padStart(4,'0');$('streak').textContent=streak;
    $('level').textContent=String(level).padStart(2,'0');
  }
  function serveOrder(){
    if(roundFinished)return;
    const counts={};placed.forEach(p=>counts[p.id]=(counts[p.id]||0)+1);
    const missing=required.filter(id=>!counts[id]);
    const extras=placed.filter(p=>!required.includes(p.id));
    if(missing.length){
      showToast('¡Todavía faltan ingredientes del pedido!');
      $('liveMessage').textContent='Revisa la lista del cliente. ¡Tú puedes!';
      return;
    }
    roundFinished=true;clearInterval(timerId);
    const bonus=Math.max(0,Math.floor(timeLeft*2));
    const accuracyBonus=extras.length===0?50:0;
    const earned=100+bonus+accuracyBonus+(streak*10);
    currentTurnScore+=earned;score+=earned;streak++;level=1+Math.floor((orderNo)/3);updateStats();
    $('modalIcon').textContent=extras.length===0?'🏆':'🎉';
    $('modalTitle').textContent=extras.length===0?'¡Pedido PERFECTO!':'¡Buen trabajo, chef!';
    $('modalText').textContent=extras.length===0?'Preparaste exactamente lo que pidió el cliente. ¡Eres una estrella!':`Completaste el pedido. Agregaste ${extras.length} ingrediente(s) extra.`;
    $('earnedPoints').textContent='+'+earned;
    $('resultModal').hidden=false;
    $('missionText').textContent='¡Pedido entregado! Prepárate para el siguiente.';
  }
  function startTimer(){
    clearInterval(timerId);timeLeft=12;$('timer').textContent=timeLeft;
    $('timer').classList.remove('urgent');
    timerId=setInterval(()=>{
      if(roundFinished)return;
      timeLeft--;$('timer').textContent=timeLeft;
      if(timeLeft<=10)$('timer').style.color='#ff6d78';
      if(timeLeft>10)$('timer').style.color='';
      if(timeLeft<=0){
        clearInterval(timerId);roundFinished=true;streak=0;updateStats();
        finishPlayerTurn();
      }
    },1000);
  }
  function nextOrder(){
    $('resultModal').hidden=true;$('gameOverModal').hidden=true;
    clearPizza();roundFinished=false;orderNo++;randomOrder();startTimer();
  }
  $('serveBtn').addEventListener('click',serveOrder);
  $('resetPizza').addEventListener('click',()=>{if(!roundFinished){clearPizza();showToast('¡Pizza reiniciada!')}});
  $('nextBtn').addEventListener('click',nextOrder);
  function renderPlayersBoard(){
    const list=$('playersList');list.innerHTML='';
    const sorted=[...sessionPlayers].sort((a,b)=>b.score-a.score);
    sorted.forEach((p,index)=>{
      const li=document.createElement('li');
      li.textContent=`${index+1}. ${p.name}`;
      const points=document.createElement('b');points.textContent=`${p.score} pts`;
      li.appendChild(points);list.appendChild(li);
    });
    $('playerTotal').textContent=`${sessionPlayers.length} ${sessionPlayers.length===1?'jugador':'jugadores'}`;
  }
  function finishPlayerTurn(){
    sessionPlayers.push({name:playerName,score:currentTurnScore});
    $('finalScore').textContent=currentTurnScore;
    $('gameOverTitle').textContent=`¡Turno terminado, ${playerName}!`;
    $('gameOverText').textContent='Mira cómo va el marcador de todos los participantes.';
    renderPlayersBoard();
    $('gameOverModal').hidden=false;
  }
  function beginPlayer(name){
    playerName=name.trim().slice(0,18);
    if(!playerName)return;
    score=0;streak=0;level=1;orderNo=1;currentTurnScore=0;
    updateStats();$('activePlayer').textContent=playerName;
    $('startModal').hidden=true;$('gameOverModal').hidden=true;
    roundFinished=false;clearPizza();randomOrder();startTimer();
  }
  $('startForm').addEventListener('submit',e=>{
    e.preventDefault();
    const name=$('playerName').value.trim();
    if(!name){$('playerName').focus();return}
    beginPlayer(name);
  });
  $('playAgainBtn').addEventListener('click',()=>{
    $('gameOverModal').hidden=true;$('playerName').value='';
    $('startModal').hidden=false;$('playerName').focus();
  });
  $('newSessionBtn').addEventListener('click',()=>{
    sessionPlayers=[];renderPlayersBoard();
    score=0;streak=0;level=1;orderNo=1;currentTurnScore=0;
    $('gameOverModal').hidden=true;$('playerName').value='';
    $('startModal').hidden=false;$('playerName').focus();
  });
  randomOrder();updateStats();$('timer').textContent='12';$('playerName').focus();
  