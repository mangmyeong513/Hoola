import { net } from './net-state.js';

// ====== Card / Deck utils ======
const SUITS = ['♠','♥','♦','♣'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const isRed = s => s==='♥' || s==='♦';

function buildDeck(){
  const deck=[]; let id=0;
  for(const s of SUITS){ for(const r of RANKS){ deck.push({ id: String(id++), suit: s, rank: r }); } }
  return shuffle(deck);
}
function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
function rankValue(r){ if(r==='A') return 1; if(r==='J') return 11; if(r==='Q') return 12; if(r==='K') return 13; return parseInt(r,10); }
function sortByRank(cards){ return [...cards].sort((a,b)=>rankValue(a.rank)-rankValue(b.rank)); }

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 6;
const BOT_NAMES = ['봇 라라','봇 쿠루','봇 피피','봇 모모','봇 네오','봇 지지','봇 토토','봇 루루'];

function clampSeatCount(n){
  const num = Number(n);
  if(Number.isNaN(num)) return MIN_PLAYERS;
  return Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.round(num)));
}

function botNameFor(index){
  const base = BOT_NAMES[index % BOT_NAMES.length];
  const suffix = index >= BOT_NAMES.length ? ` ${Math.floor(index / BOT_NAMES.length) + 1}` : '';
  return base + suffix;
}

function createPlayer(id, name, isBot){
  return { id, name, isBot, hand:[], status:'active' };
}

// ====== Meld validation ======
function isSet(cards){ if(cards.length<3) return false; const r = cards[0].rank; return cards.every(c=>c.rank===r); }
function isRun(cards){
  if(cards.length<3) return false; const suit=cards[0].suit; if(!cards.every(c=>c.suit===suit)) return false;
  const sorted = sortByRank(cards);
  let ok = true; for(let i=1;i<sorted.length;i++){ if(rankValue(sorted[i].rank)!==rankValue(sorted[i-1].rank)+1) { ok=false; break; } }
  if(ok) return true;
  const mapHigh = x=> x.rank==='A'?14:rankValue(x.rank);
  const s2 = [...cards].sort((a,b)=>mapHigh(a)-mapHigh(b));
  ok=true; for(let i=1;i<s2.length;i++){ if(mapHigh(s2[i])!==mapHigh(s2[i-1])+1){ ok=false; break; } }
  return ok;
}
function canAttach(card, meld){
  if(meld.kind==='seven') return false; // 7 단독 등록에는 붙일 수 없음
  if(meld.kind==='set'){
    const cs = [...meld.cards, card];
    return isSet(cs);
  }
  if(meld.kind==='run'){
    return canAttachRunEnds(card, meld.cards);
  }
  return false;
}
function canAttachRunEnds(card, runCards){
  // 붙이기는 "양 끝"에만 허용. 중간 삽입 금지.
  if(runCards.length<3) return false;
  const suit = runCards[0].suit;
  if(!runCards.every(c=>c.suit===suit)) return false;
  if(card.suit!==suit) return false;
  const mapLow = x=> rankValue(x.rank);
  const mapHigh = x=> x.rank==='A'?14:rankValue(x.rank);
  const numsLow = [...runCards].map(mapLow).sort((a,b)=>a-b);
  const numsHigh = [...runCards].map(mapHigh).sort((a,b)=>a-b);
  const isConsecutive = (arr)=> arr.every((v,i)=> i===0 || v===arr[i-1]+1);
  let allow=false;
  const vLow = mapLow(card);
  const vHigh = mapHigh(card);
  if(isConsecutive(numsLow)){
    const lowMin = numsLow[0], lowMax = numsLow[numsLow.length-1];
    if(vLow===lowMin-1 || vLow===lowMax+1) allow=true;
  }
  if(!allow && isConsecutive(numsHigh)){
    const hiMin = numsHigh[0], hiMax = numsHigh[numsHigh.length-1];
    if(vHigh===hiMin-1 || vHigh===hiMax+1) allow=true;
  }
  return allow && isRun([...runCards, card]);
}
function classifyMeld(cards){
  if(cards.length===1 && cards[0].rank==='7') return { kind:'seven', cards:[...cards] };
  if(isSet(cards)) return { kind:'set', cards: sortByRank(cards) };
  if(isRun(cards)) return { kind:'run', cards: sortByRank(cards) };
  return null;
}

// ====== State ======
const state = {
  deck: [],
  discard: [],
  melds: [],
  players: [],
  turnIndex: 0,
  phase: 'choose-source', // choose-source | action | gameover
  finishOrder: [],
  options: { continueAfterOut: true, totalSeats: 4 },
  round: 1,
  mustUseThankYouCardId: null,
  ty: { open:false, claimant:null, fromPlayerId:null, cardId:null }, // 땡큐 선착순 락
};

function newGame(){
  state.deck = buildDeck();
  state.discard = [];
  state.melds = [];
  state.options.totalSeats = clampSeatCount(state.options.totalSeats ?? MIN_PLAYERS);
  const seats = state.options.totalSeats;
  const roster = [];
  const youLabel = net.online ? (net.isHost ? 'You(Host)' : 'You') : 'You';
  roster.push(createPlayer('P1', youLabel, false));
  if(net.online){
    roster.push(createPlayer('P2', net.isHost ? 'Guest' : 'Host', false));
  }
  let botIndex = 0;
  while(roster.length < seats){
    const id = `P${roster.length+1}`;
    roster.push(createPlayer(id, botNameFor(botIndex++), true));
  }
  state.players = roster;
  state.turnIndex = 0;
  state.phase='choose-source';
  state.finishOrder=[];
  state.round=1;
  state.mustUseThankYouCardId=null;
  state.ty={open:false, claimant:null, fromPlayerId:null, cardId:null};
  for(let i=0;i<7;i++) state.players.forEach(p=>p.hand.push(state.deck.pop()));
  if(state.deck.length){ state.discard.push(state.deck.pop()); }
  clearSelection();
  drawUI();
  logMsg(`게임 시작! (${state.players.length}인 테이블)`);
  maybeBotTurn();
}

function current(){ return state.players[state.turnIndex]; }
function nextActiveIndex(from){ const n=state.players.length; for(let k=1;k<=n;k++){ const idx=(from+k)%n; if(state.players[idx].status==='active') return idx; } return from; }

// ====== Rules helpers ======
function legalThankYouFor(player){
  const top = state.discard[state.discard.length-1]; if(!top) return {allowed:false};
  if(!state.ty.open) return {allowed:false};
  // 본인이 방금 버린 카드는 땡큐 불가
  if(state.ty.fromPlayerId===player.id) return {allowed:false};
  // 드로우/땡큐 중복 금지: 현재 턴의 phase가 choose-source가 아니어도, 땡큐는 인터럽트로 허용하지만 즉시 사용 가능한 경우만
  // 등록/붙이기 가능 여부 검사
  // 테이블 붙이기 체크
  for(let i=0;i<state.melds.length;i++){ if(canAttach(top, state.melds[i])) return {allowed:true, card:top, mode:'attach'}; }
  // 등록 체크 (7 단독 포함)
  const trial = [...player.hand, top];
  const combos = kComb(trial, 1, 5);
  for(const c of combos){ const m=classifyMeld(c); if(m && c.some(x=>x.id===top.id)) return {allowed:true, card:top, mode:'register'}; }
  return {allowed:false};
}

function kComb(arr, minK=3, maxK=5){
  const res=[]; const n=arr.length; const max=Math.min(maxK,n);
  function rec(start, combo){
    if(combo.length>=minK) res.push([...combo]);
    if(combo.length===max) return;
    for(let i=start;i<n;i++){ combo.push(arr[i]); rec(i+1, combo); combo.pop(); }
  }
  rec(0,[]); return res;
}

function afterAnyAction(player){
  if(player.status==='active' && player.hand.length===0){
    player.status='out'; state.finishOrder.push(player.id);
    showToast(`${player.name} 아웃!`);
    state.mustUseThankYouCardId=null;
    state.ty={open:false, claimant:null, fromPlayerId:null, cardId:null};
    if(!state.options.continueAfterOut){ state.phase='gameover'; drawUI(); return true; }
    const left = state.players.filter(p=>p.status==='active').length;
    if(left<=1){
      const last = state.players.find(p=>p.status==='active');
      if(last){ last.status='out'; state.finishOrder.push(last.id); }
      state.phase='gameover'; drawUI(); return true;
    }
    const idxNow = state.turnIndex;
    if(state.players[idxNow].id===player.id){ state.turnIndex = nextActiveIndex(idxNow); state.phase='choose-source'; }
  }
  return false;
}

function endTurn(){
  state.turnIndex = nextActiveIndex(state.turnIndex);
  state.phase='choose-source';
  state.mustUseThankYouCardId=null;
  // 턴 넘어가면 땡큐 창 닫힘(선착순 창은 버린 직후에만)
  state.ty={open:false, claimant:null, fromPlayerId:null, cardId:null};
}

// ====== Actions ======
function drawFromDeck(){
  const p=current(); if(state.phase!=='choose-source') return;
  if(state.deck.length===0){ reshuffleFromDiscard(); }
  if(state.deck.length===0) { logMsg('덱 고갈!'); return; }
  const fromRect = document.getElementById('deckZone').getBoundingClientRect();
  const newCard = state.deck.pop();
  p.hand.push(newCard);
  state.phase='action';
  // 드로우한 순간에는 땡큐 창 닫음 (드로우를 선택했으므로)
  state.ty.open=false;
  drawUI();
  const targetEl = document.querySelector(`#hand .card[data-id="${newCard.id}"]`);
  if(targetEl){ const toRect = targetEl.getBoundingClientRect(); flyCard(fromRect, toRect, newCard); }
}

function claimThankYou(playerIndex){
  const player = state.players[playerIndex];
  const chk = legalThankYouFor(player); if(!chk.allowed) return false;
  if(!state.ty.open) return false;
  if(state.ty.claimant && state.ty.claimant!==player.id) return false; // 이미 다른 사람이 먹음
  // 선착순 집행
  state.ty.claimant = player.id;
  const topEl = document.querySelector('#discardCards .card');
  const fromRect = topEl? topEl.getBoundingClientRect() : document.getElementById('discardZone').getBoundingClientRect();
  const top=state.discard.pop(); player.hand.push(top);
  state.mustUseThankYouCardId = top.id; // 반드시 즉시 사용
  state.phase = (playerIndex===state.turnIndex) ? 'action' : state.phase; // 인터럽트지만 자신의 phase 강제하진 않음
  showToast(`땡큐! ${player.name} 선점 ✅`);
  drawUI();
  const targetEl = document.querySelector(`#hand .card[data-id="${top.id}"]`);
  if(targetEl){ const toRect = targetEl.getBoundingClientRect(); flyCard(fromRect, toRect, top); }
  // 땡큐 창 닫음(선착순)
  state.ty.open=false;
  return true;
}

function takeThankYou(){ // UI에서 내 입장(0번 플레이어)
  claimThankYou(0);
}

function registerSelected(kind){
  const p=current(); if(state.phase==='choose-source'){ showToast('먼저 드로우 또는 땡큐'); return; }
  const sel = selectedFromHand(); if(sel.length<1){ showToast('카드를 선택하세요'); return; }
  if(state.mustUseThankYouCardId && !sel.some(c=>c.id===state.mustUseThankYouCardId)){
    showToast('땡큐 카드부터 사용해야 해요'); return;
  }
  const m = classifyMeld(sel);
  if(!m){ showToast('유효하지 않은 조합'); return; }
  if(kind==='set' && m.kind!=='set') { showToast('세트 아님'); return; }
  if(kind==='run' && m.kind!=='run') { showToast('런 아님'); return; }
  if(m.kind==='seven' || kind===undefined || kind===m.kind){
    p.hand = p.hand.filter(c=>!sel.includes(c));
    state.melds.push(m);
    logMsg(`${p.name} 등록: ${m.kind.toUpperCase()} (${pretty(m.cards)})`);
    if(state.mustUseThankYouCardId && sel.some(c=>c.id===state.mustUseThankYouCardId)) state.mustUseThankYouCardId=null;
    clearSelection(); drawUI(); if(afterAnyAction(p)) return; return;
  }
  showToast('요청한 종류와 일치하지 않음');
}

function attachSelected(){
  const p=current(); if(state.phase==='choose-source'){ showToast('먼저 드로우 또는 땡큐'); return; }
  const sel = selectedFromHand(); if(sel.length!==1){ showToast('붙이기는 1장만 선택'); return; }
  const card=sel[0];
  if(state.mustUseThankYouCardId && card.id!==state.mustUseThankYouCardId){ showToast('땡큐 카드부터 사용해야 해요'); return; }
  for(let i=0;i<state.melds.length;i++){
    const m=state.melds[i]; if(canAttach(card,m)){
      p.hand = p.hand.filter(c=>c!==card); m.cards.push(card); m.cards = sortByRank(m.cards);
      logMsg(`${p.name} 붙이기: ${card.rank}${card.suit} → #${i+1}`);
      if(state.mustUseThankYouCardId===card.id) state.mustUseThankYouCardId=null;
      drawUI(); afterAnyAction(p); return;
    }
  }
  showToast('붙일 수 있는 곳이 없어요');
}

let pendingDiscard=null;
function setDiscard(){
  const p=current(); if(state.phase==='choose-source'){ showToast('먼저 드로우 또는 땡큐'); return; }
  if(state.mustUseThankYouCardId){ showToast('땡큐 카드 먼저 사용해야 버릴 수 있어요'); return; }
  const sel = selectedFromHand(); if(sel.length!==1){ showToast('버리기는 1장 선택'); return; }
  pendingDiscard = sel[0];
  document.getElementById('btnDiscard').disabled=false;
  drawUI();
}
function commitDiscard(){
  const p=current();
  if(state.mustUseThankYouCardId){ showToast('땡큐 카드 먼저 사용!'); return; }
  if(!pendingDiscard){ const sel=selectedFromHand(); if(sel.length===1) pendingDiscard=sel[0]; }
  if(!pendingDiscard){ showToast('버릴 카드를 1장 선택하세요'); return; }
  const fromEl = document.querySelector(`#hand .card[data-id="${pendingDiscard.id}"]`);
  const fromRect = fromEl? fromEl.getBoundingClientRect() : document.getElementById('hand').getBoundingClientRect();
  p.hand = p.hand.filter(c=>c!==pendingDiscard);
  state.discard.push(pendingDiscard); logMsg(`${p.name} 버림: ${cardText(pendingDiscard)}`);
  const justDiscarded = pendingDiscard;
  pendingDiscard=null; document.getElementById('btnDiscard').disabled=true; clearSelection();
  // 땡큐 선착순 창 오픈
  state.ty = { open:true, claimant:null, fromPlayerId:p.id, cardId:justDiscarded.id };
  drawUI();
  const topEl = document.querySelector('#discardCards .card');
  if(topEl){ const toRect = topEl.getBoundingClientRect(); flyCard(fromRect, toRect, justDiscarded); }
  // 봇이 먼저 외칠 수 있으면 즉시 선점
  const nextIdx = nextActiveIndex(state.turnIndex);
  const bot = state.players[nextIdx];
  if(bot?.isBot){
    const chk = legalThankYouFor(bot);
    if(chk.allowed){
      claimThankYou(nextIdx);
      // 땡큐로 가져온 즉시 사용 시도
      // 등록 우선 → 붙이기
      const combos = kComb(bot.hand,1,5).sort((a,b)=>b.length-a.length);
      for(const cs of combos){ const m=classifyMeld(cs); if(m && cs.some(c=>c.id===state.mustUseThankYouCardId)){ bot.hand = bot.hand.filter(c=>!cs.includes(c)); state.melds.push(m); logMsg(`Bot(땡큐) 등록: ${m.kind.toUpperCase()}`); state.mustUseThankYouCardId=null; break; } }
      if(state.mustUseThankYouCardId){ // 아직 사용 못했으면 붙이기 탐색
        for(let j=0;j<state.melds.length;j++){ const top = bot.hand.find(c=>c.id===state.mustUseThankYouCardId); if(top && canAttach(top,state.melds[j])){ bot.hand = bot.hand.filter(x=>x!==top); state.melds[j].cards.push(top); state.melds[j].cards=sortByRank(state.melds[j].cards); logMsg('Bot(땡큐) 붙이기'); state.mustUseThankYouCardId=null; break; } }
      }
    }
  }
  if(afterAnyAction(p)) return;
  endTurn(); drawUI(); maybeBotTurn();
}

function reshuffleFromDiscard(){
  if(state.discard.length<2) return; // keep top
  const top = state.discard.pop();
  state.deck = shuffle(state.discard); state.discard=[top];
  showToast('버린 패를 섞어 덱 보충');
}

// ====== Bot (human-like delay) ======
function maybeBotTurn(){
  const p=current(); if(!p.isBot || state.phase==='gameover') return;
  const delay = (ms)=>new Promise(res=>setTimeout(res, ms));
  (async()=>{ await delay(300 + Math.random()*500); await botActAsync(delay); })();
}
async function botActAsync(delay){
  const p=current(); if(!p.isBot || p.status!=='active') return;
  if(state.phase==='choose-source'){
    await delay(200+Math.random()*400);
    // 땡큐 선점 가능 시도(자기 턴 시작에도 열려있다면)
    if(state.ty.open && !state.ty.claimant){
      const chk = legalThankYouFor(p);
      if(chk.allowed){ claimThankYou(state.turnIndex); drawUI(); return botActAsync(delay); }
    }
    drawFromDeck(); drawUI(); return botActAsync(delay);
  }
  const tryRegister = async () => {
    const combos = kComb(p.hand,1,5).sort((a,b)=>b.length-a.length);
    for(const cs of combos){ const m=classifyMeld(cs); if(m){
      await delay(220+Math.random()*380);
      p.hand = p.hand.filter(c=>!cs.includes(c)); state.melds.push(m);
      logMsg(`Bot 등록: ${m.kind.toUpperCase()} (${pretty(m.cards)})`);
      drawUI(); if(afterAnyAction(p)) return true; return tryRegister();
    }} return false;
  };
  if(await tryRegister()) return;
  for(let i=0;i<p.hand.length;i++){
    const c=p.hand[i];
    for(let j=0;j<state.melds.length;j++){
      if(canAttach(c,state.melds[j])){
        await delay(180+Math.random()*300);
        p.hand.splice(i,1); state.melds[j].cards.push(c); state.melds[j].cards=sortByRank(state.melds[j].cards);
        logMsg(`Bot 붙이기: ${cardText(c)} → #${j+1}`);
        drawUI(); if(afterAnyAction(p)) return; i=-1; break;
      }
    }
  }
  await delay(220+Math.random()*380);
  let candIndex=0, bestScore=-1;
  for(let i=0;i<p.hand.length;i++){
    const c=p.hand[i];
    const rv=rankValue(c.rank); const suitScore = p.hand.filter(x=>x.suit===c.suit).length;
    const rankScore = p.hand.filter(x=>x.rank===c.rank).length;
    const score = rv + (1/(suitScore||1))*4 + (1/(rankScore||1))*6;
    if(score>bestScore){bestScore=score; candIndex=i;}
  }
  const dc = p.hand.splice(candIndex,1)[0]; state.discard.push(dc); logMsg(`Bot 버림: ${cardText(dc)}`);
  // 땡큐 창 오픈
  state.ty = { open:true, claimant:null, fromPlayerId:p.id, cardId:dc.id };
  drawUI(); if(afterAnyAction(p)) return; endTurn(); drawUI();
}

// ====== UI ======
function drawUI(){
  state.options.totalSeats = clampSeatCount(state.options.totalSeats ?? MIN_PLAYERS);
  const continueEl = document.getElementById('opt-continue');
  if(continueEl){ continueEl.checked = state.options.continueAfterOut; }
  const seatSelect = document.getElementById('opt-seats');
  if(seatSelect){
    const desired = String(state.options.totalSeats);
    if(seatSelect.value !== desired) seatSelect.value = desired;
    seatSelect.disabled = net.online && !net.isHost;
  }
  const activeTurn = state.players[state.turnIndex];
  const turnBadge = document.getElementById('turnBadge');
  if(turnBadge){
    if(activeTurn){ turnBadge.textContent = `턴: ${activeTurn.name} · ${activeTurn.hand.length}장`; }
    else { turnBadge.textContent = '턴: -'; }
  }
  const roundInfo = document.getElementById('roundInfo');
  if(roundInfo){ roundInfo.textContent = `R${state.round}${state.phase==='gameover'?' · 게임끝':''}`; }
  const deckCount = document.getElementById('deckCount');
  if(deckCount){ deckCount.textContent = state.deck.length ? `${state.deck.length}장 남음` : '덱 비었음'; }

  const seatLayer = document.getElementById('arenaSeats');
  if(seatLayer){
    seatLayer.innerHTML='';
    const total = state.players.length || 1;
    state.players.forEach((p, idx)=>{
      const seat=document.createElement('div');
      seat.className='seat';
      seat.style.setProperty('--angle', `${(360/total)*idx}deg`);
      seat.dataset.turn = String(state.turnIndex===idx);
      seat.dataset.status = p.status;
      seat.dataset.bot = String(p.isBot);
      const nameEl=document.createElement('div');
      nameEl.className='seat-name';
      nameEl.textContent=p.name;
      const meta=document.createElement('div');
      meta.className='seat-meta';
      meta.textContent = p.status==='active'?`${p.hand.length}장 보유`:'OUT';
      seat.appendChild(nameEl);
      seat.appendChild(meta);
      seatLayer.appendChild(seat);
    });
  }

  const dc = document.getElementById('discardCards');
  if(dc){
    dc.innerHTML='';
    const top = state.discard[state.discard.length-1];
    if(top){ const el=cardEl(top,false); el.classList.add('enter'); dc.appendChild(el); }
  }

  const mwrap = document.getElementById('melds');
  if(mwrap){
    mwrap.innerHTML='';
    state.melds.forEach((m,i)=>{
      const d=document.createElement('div'); d.className='meld enter';
      const title=document.createElement('div'); title.className='panel-title';
      title.textContent = `#${i+1} · ${m.kind.toUpperCase()} (${m.cards.length})`;
      const row=document.createElement('div'); row.className='cards';
      m.cards.forEach(c=>{ const el=cardEl(c,false); el.classList.add('enter'); row.appendChild(el); });
      d.appendChild(title); d.appendChild(row); mwrap.appendChild(d);
    });
  }

  const handEl = document.getElementById('hand');
  if(handEl){
    handEl.innerHTML='';
    const me = state.players[0];
    if(me){
      me.hand.sort((a,b)=> (a.suit===b.suit? rankValue(a.rank)-rankValue(b.rank) : a.suit.localeCompare(b.suit)));
      me.hand.forEach(c=>{ const el=cardEl(c,true); el.classList.add('enter'); handEl.appendChild(el); });
    }
  }

  const plist=document.getElementById('players');
  if(plist){
    plist.innerHTML='';
    state.players.forEach((p,idx)=>{
      const line=document.createElement('div');
      line.className='player-line';
      line.dataset.turn = String(state.turnIndex===idx);
      line.dataset.status = p.status;
      line.dataset.bot = String(p.isBot);
      const left=document.createElement('div');
      left.className='player-name';
      const nameSpan=document.createElement('span'); nameSpan.textContent=p.name;
      const typeSpan=document.createElement('span'); typeSpan.className='player-type'; typeSpan.textContent = p.isBot?'🤖':'🙂';
      left.appendChild(nameSpan); left.appendChild(typeSpan);
      const right=document.createElement('div'); right.innerHTML = `<span class="rankpill">${p.status==='active'?`${p.hand.length}장`:'OUT'}</span>`;
      line.appendChild(left); line.appendChild(right); plist.appendChild(line);
    });
  }

  const finish=document.getElementById('finish');
  if(finish){
    finish.innerHTML='';
    state.finishOrder.forEach((pid,idx)=>{
      const li=document.createElement('li'); const nm = state.players.find(p=>p.id===pid)?.name||pid; li.textContent = `${idx+1}등 · ${nm}`; finish.appendChild(li);
    });
  }

  const me = state.players[0];
  const meTurn = me && activeTurn && activeTurn.id==='P1' && me.status==='active' && state.phase!=='gameover';
  document.getElementById('btnDraw').disabled = !meTurn || state.phase!=='choose-source';
  const tyBtn=document.getElementById('btnTY');
  const tyCheck = me ? legalThankYouFor(me) : {allowed:false};
  tyBtn.disabled = !(state.ty.open && (!state.ty.claimant || state.ty.claimant==='P1') && tyCheck.allowed);
  tyBtn.classList.toggle('pulse', !tyBtn.disabled);
}
function cardEl(card, selectable){
  const d=document.createElement('div'); d.className='card'; d.dataset.id=card.id; if(selectable) d.addEventListener('click',()=>toggleSelect(card.id,d));
  const inner=document.createElement('div'); inner.className='inner';
  const rank=document.createElement('div'); rank.className='rank ' + (isRed(card.suit)?'red':'black'); rank.textContent=card.rank;
  const suit=document.createElement('div'); suit.className='suit ' + (isRed(card.suit)?'red':'black'); suit.textContent=card.suit;
  inner.appendChild(rank); inner.appendChild(suit); d.appendChild(inner); return d;
}

const selected = new Set();
function toggleSelect(id, el){ if(selected.has(id)){ selected.delete(id); el.classList.remove('selected'); } else { selected.add(id); el.classList.add('selected'); } updateDiscardButtonState(); }
function selectedFromHand(){ const me=state.players[0]; const ids=[...selected]; const out=[]; ids.forEach(id=>{ const c=me.hand.find(x=>x.id===id); if(c) out.push(c); }); return out; }
function clearSelection(){ selected.clear(); updateDiscardButtonState(); }

// ====== UX helpers ======
function flyCard(fromRect, toRect, card){
  const f=document.createElement('div'); f.className='flycard';
  const r=document.createElement('div'); r.className='flyrank'; r.textContent=card.rank; r.style.color=(isRed(card.suit)?'#e34d5c':'#2b2f3a');
  const s=document.createElement('div'); s.className='flysuit'; s.textContent=card.suit; s.style.color=(isRed(card.suit)?'#e34d5c':'#2b2f3a');
  f.appendChild(r); f.appendChild(s);
  document.body.appendChild(f);
  const startX = fromRect.left + (fromRect.width/2) - 35;
  const startY = fromRect.top + (fromRect.height/2) - 49;
  f.style.transform = `translate(${startX}px, ${startY}px)`; f.style.opacity = .7;
  f.getBoundingClientRect();
  const endX = toRect.left + (toRect.width/2) - 35;
  const endY = toRect.top + (toRect.height/2) - 49;
  requestAnimationFrame(()=>{ f.style.transform = `translate(${endX}px, ${endY}px)`; f.style.opacity=1; });
  setTimeout(()=>{ f.remove(); }, 300);
}
function showToast(message, ms=1200){
  const t = document.getElementById('toast'); if(!t){ console.warn('toast element missing'); return; }
  t.textContent = message; t.style.display = 'block';
  clearTimeout(window.__toastTimer); window.__toastTimer = setTimeout(()=>{ t.style.display='none'; }, ms);
}
function logMsg(msg){ const l=document.getElementById('log'); if(!l){ console.log('[LOG]', msg); return; } const line=document.createElement('div'); line.textContent=msg; l.appendChild(line); l.scrollTop=l.scrollHeight; }
function cardText(c){ return `${c.rank}${c.suit}`; }
function pretty(cards){ return cards.map(cardText).join(' '); }
function updateDiscardButtonState(){ const btn = document.getElementById('btnDiscard'); const meTurn = current().id==='P1' && state.players[0].status==='active' && state.phase!=='gameover'; const one = selectedFromHand().length===1; btn.disabled = !(meTurn && state.phase!=='choose-source' && one && !state.mustUseThankYouCardId); }

// ====== Unit Tests (lightweight) ======
function runUnitTests(){
  const results=[]; const rec=(name,ok,detail='')=>{ results.push({name,ok,detail}); (ok?console.log:console.error)(ok?`PASS: ${name}`:`FAIL: ${name} — ${detail}`); };
  try{ rec('isSet valid 5x3', isSet([{rank:'5',suit:'♣'},{rank:'5',suit:'♥'},{rank:'5',suit:'♦'}])); }catch(e){ rec('isSet valid 5x3', false, e.message); }
  try{ rec('isSet invalid len<3', !isSet([{rank:'5',suit:'♣'},{rank:'5',suit:'♥'}])); }catch(e){ rec('isSet invalid len<3', false, e.message); }
  try{ rec('isSet invalid mismatch', !isSet([{rank:'5',suit:'♣'},{rank:'5',suit:'♥'},{rank:'6',suit:'♦'}])); }catch(e){ rec('isSet invalid mismatch', false, e.message); }
  try{ rec('isRun 5-6-7 ♥', isRun([{rank:'5',suit:'♥'},{rank:'6',suit:'♥'},{rank:'7',suit:'♥'}])); }catch(e){ rec('isRun 5-6-7 ♥', false, e.message); }
  try{ rec('isRun A-2-3 ♣ (low ace)', isRun([{rank:'A',suit:'♣'},{rank:'2',suit:'♣'},{rank:'3',suit:'♣'}])); }catch(e){ rec('isRun A-2-3 low', false, e.message); }
  try{ rec('isRun Q-K-A ♦ (high ace)', isRun([{rank:'Q',suit:'♦'},{rank:'K',suit:'♦'},{rank:'A',suit:'♦'}])); }catch(e){ rec('isRun Q-K-A high', false, e.message); }
  try{ rec('isRun no wrap K-A-2 ♠', !isRun([{rank:'K',suit:'♠'},{rank:'A',suit:'♠'},{rank:'2',suit:'♠'}])); }catch(e){ rec('isRun no wrap', false, e.message); }
  try{ const m = classifyMeld([{rank:'7',suit:'♣'}]); rec('classify single 7 → seven', m && m.kind==='seven'); }catch(e){ rec('classify seven', false, e.message); }
  try{ const setM = {kind:'set', cards:[{rank:'5',suit:'♥'},{rank:'5',suit:'♦'},{rank:'5',suit:'♠'}]}; rec('attach 5♣ to set', canAttach({rank:'5',suit:'♣'}, setM)); }catch(e){ rec('attach to set', false, e.message); }
  try{ const runM = {kind:'run', cards: sortByRank([{rank:'2',suit:'♥'},{rank:'3',suit:'♥'},{rank:'4',suit:'♥'}])}; rec('attach 5♥ to run end', canAttach({rank:'5',suit:'♥'}, runM)); }catch(e){ rec('attach to run end 5', false, e.message); }
  try{ const runM2 = {kind:'run', cards: sortByRank([{rank:'3',suit:'♥'},{rank:'4',suit:'♥'},{rank:'5',suit:'♥'}])}; rec('attach 2♥ to run start', canAttach({rank:'2',suit:'♥'}, runM2)); }catch(e){ rec('attach to run start 2', false, e.message); }
  try{ const runM3 = {kind:'run', cards: sortByRank([{rank:'3',suit:'♥'},{rank:'4',suit:'♥'},{rank:'5',suit:'♥'}])}; rec('attach 6♥ to run end', canAttach({rank:'6',suit:'♥'}, runM3)); }catch(e){ rec('attach to run end 6', false, e.message); }
  try{ const runM4 = {kind:'run', cards: sortByRank([{rank:'3',suit:'♥'},{rank:'4',suit:'♥'},{rank:'5',suit:'♥'}])}; rec('attach 4♥ (middle) not allowed', !canAttach({rank:'4',suit:'♥'}, runM4)); }catch(e){ rec('attach to run middle 4', false, e.message); }
  try{ const sevenM = {kind:'seven', cards:[{rank:'7',suit:'♣'}]}; rec('cannot attach to solo seven', !canAttach({rank:'6',suit:'♣'}, sevenM)); }catch(e){ rec('seven attach rule', false, e.message); }
  // ThankYou race: open & claimant null, two claim attempts -> first wins
  try{
    const tmp=JSON.parse(JSON.stringify(state));
    state.players=[{id:'P1',name:'A',isBot:false,hand:[],status:'active'},{id:'P2',name:'B',isBot:false,hand:[],status:'active'}];
    state.discard=[{id:'X',rank:'7',suit:'♣'}];
    state.melds=[]; state.phase='choose-source';
    state.ty={open:true, claimant:null, fromPlayerId:'P2', cardId:'X'};
    // Give P1 a helping card to register 7 solo
    const preLen = state.players[0].hand.length;
    const c1 = claimThankYou(0);
    const c2 = claimThankYou(1);
    rec('thankyou first-come wins', c1===true && c2===false && state.players[0].hand.length===preLen+1);
    Object.assign(state,tmp);
  }catch(e){ rec('thankyou race rule', false, e.message); }
  const ok = results.filter(r=>r.ok).length; const total = results.length; logMsg(`테스트: ${ok}/${total} 성공`); results.filter(r=>!r.ok).forEach(r=>logMsg(`❌ ${r.name} ${r.detail?'- '+r.detail:''}`));
}

// initialization handled in main.js

export {
  state,
  MIN_PLAYERS,
  MAX_PLAYERS,
  clampSeatCount,
  newGame,
  current,
  nextActiveIndex,
  legalThankYouFor,
  kComb,
  afterAnyAction,
  endTurn,
  drawFromDeck,
  claimThankYou,
  takeThankYou,
  registerSelected,
  attachSelected,
  setDiscard,
  commitDiscard,
  reshuffleFromDiscard,
  maybeBotTurn,
  drawUI,
  cardEl,
  selectedFromHand,
  clearSelection,
  updateDiscardButtonState,
  showToast,
  logMsg,
  cardText,
  pretty,
  classifyMeld,
  canAttach,
  sortByRank,
  runUnitTests,
};
