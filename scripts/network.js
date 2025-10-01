import { net, netBadge } from './net-state.js';
import {
  state,
  current,
  classifyMeld,
  canAttach,
  sortByRank,
  logMsg,
  afterAnyAction,
  newGame,
  drawUI,
  showToast,
  endTurn,
  drawFromDeck,
  claimThankYou,
} from './game.js';

function wireDataChannel(dc){
  dc.onopen = () => {
    net.online = true;
    const badge = netBadge();
    if (badge) {
      badge.textContent = '온라인';
      badge.style.background = '#eaffea';
      badge.style.color = '#137a13';
    }
    if (net.isHost) {
      newGame();
      sendSnapshot();
    } else {
      drawUI();
    }
  };
  dc.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.t === 'snapshot') {
      Object.assign(state, msg.state);
      drawUI();
      return;
    }
    if (!net.isHost) {
      return;
    }
    handleRemoteAction(msg);
  };
}

export function sendSnapshot(){
  if (net.online && net.dc?.readyState === 'open') {
    net.dc.send(JSON.stringify({ t: 'snapshot', state }));
  }
}

export function sendAction(a){
  if (net.online && net.dc?.readyState === 'open') {
    net.dc.send(JSON.stringify(a));
  }
}

function handleRemoteAction(a){
  switch (a.t) {
    case 'draw': {
      if (current().id === 'P2') {
        drawFromDeck();
        drawUI();
      }
      break;
    }
    case 'thankyou-claim': {
      if (state.ty.open && !state.ty.claimant) {
        const idx = state.players.findIndex((p) => p.id === 'P2');
        if (idx >= 0) {
          claimThankYou(idx);
          drawUI();
        }
      }
      break;
    }
    case 'register': {
      if (current().id !== 'P2' || state.phase === 'gameover') break;
      const p = state.players[1];
      const cards = p.hand.filter((c) => a.ids.includes(c.id));
      if (state.mustUseThankYouCardId && !cards.some((c) => c.id === state.mustUseThankYouCardId)) break;
      const m = classifyMeld(cards);
      if (!m) break;
      if (a.kind && m.kind !== a.kind) break;
      p.hand = p.hand.filter((c) => !cards.includes(c));
      state.melds.push(m);
      logMsg(`Remote 등록: ${m.kind}`);
      if (state.mustUseThankYouCardId && cards.some((c) => c.id === state.mustUseThankYouCardId)) {
        state.mustUseThankYouCardId = null;
      }
      afterAnyAction(p);
      break;
    }
    case 'attach': {
      if (current().id !== 'P2' || state.phase === 'gameover') break;
      const p = state.players[1];
      const card = p.hand.find((c) => c.id === a.id);
      if (!card) break;
      if (state.mustUseThankYouCardId && card.id !== state.mustUseThankYouCardId) break;
      let targetIndex = -1;
      for (let j = 0; j < state.melds.length; j++) {
        if (canAttach(card, state.melds[j])) {
          targetIndex = j;
          break;
        }
      }
      if (targetIndex >= 0) {
        const m = state.melds[targetIndex];
        p.hand = p.hand.filter((x) => x !== card);
        m.cards.push(card);
        m.cards = sortByRank(m.cards);
        logMsg('Remote 붙이기');
        if (state.mustUseThankYouCardId === card.id) {
          state.mustUseThankYouCardId = null;
        }
        afterAnyAction(p);
      }
      break;
    }
    case 'discard': {
      if (current().id !== 'P2' || state.phase === 'gameover') break;
      if (state.mustUseThankYouCardId) break;
      const p = state.players[1];
      const card = p.hand.find((c) => c.id === a.id);
      if (!card) break;
      p.hand = p.hand.filter((x) => x !== card);
      state.discard.push(card);
      state.ty = { open: true, claimant: null, fromPlayerId: p.id, cardId: card.id };
      endTurn();
      break;
    }
    default:
      break;
  }
  drawUI();
  sendSnapshot();
}

export async function hostStart(){
  net.role = 'host';
  net.isHost = true;
  net.pc = new RTCPeerConnection();
  net.dc = net.pc.createDataChannel('hoola');
  wireDataChannel(net.dc);
  const offer = await net.pc.createOffer();
  await net.pc.setLocalDescription(offer);
  document.getElementById('sdpOut').value = btoa(JSON.stringify(net.pc.localDescription));
  net.pc.onicecandidate = (e) => {
    if (!e.candidate) {
      document.getElementById('sdpOut').value = btoa(JSON.stringify(net.pc.localDescription));
    }
  };
}

export async function guestStart(){
  net.role = 'guest';
  net.isHost = false;
  net.pc = new RTCPeerConnection();
  net.pc.ondatachannel = (e) => {
    net.dc = e.channel;
    wireDataChannel(net.dc);
  };
  const offerStr = document.getElementById('sdpIn').value.trim();
  if (!offerStr) {
    showToast('호스트 코드를 붙여넣으세요');
    return;
  }
  const offer = JSON.parse(atob(offerStr));
  await net.pc.setRemoteDescription(offer);
  const answer = await net.pc.createAnswer();
  await net.pc.setLocalDescription(answer);
  document.getElementById('sdpOut').value = btoa(JSON.stringify(net.pc.localDescription));
  net.pc.onicecandidate = (e) => {
    if (!e.candidate) {
      document.getElementById('sdpOut').value = btoa(JSON.stringify(net.pc.localDescription));
    }
  };
}

export async function hostApplyAnswer(){
  const ansStr = document.getElementById('sdpIn').value.trim();
  if (!ansStr) {
    showToast('게스트 코드를 붙여넣으세요');
    return;
  }
  const ans = JSON.parse(atob(ansStr));
  await net.pc.setRemoteDescription(ans);
}
