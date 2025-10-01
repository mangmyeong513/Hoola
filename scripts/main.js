import { net } from './net-state.js';
import {
  state,
  newGame,
  drawFromDeck,
  takeThankYou,
  registerSelected,
  attachSelected,
  setDiscard,
  commitDiscard,
  selectedFromHand,
  updateDiscardButtonState,
  clampSeatCount,
  runUnitTests,
  current,
} from './game.js';
import { sendSnapshot, sendAction, hostStart, guestStart, hostApplyAnswer } from './network.js';

const elDraw = document.getElementById('btnDraw');
const elTY = document.getElementById('btnTY');
const elRegSet = document.getElementById('btnRegSet');
const elRegRun = document.getElementById('btnRegRun');
const elAttach = document.getElementById('btnAttach');
const elPendDiscard = document.getElementById('btnDiscard');
const elReset = document.getElementById('btnReset');

elDraw.onclick = () => {
  if (net.online && !net.isHost && current().id === 'P2') {
    sendAction({ t: 'draw' });
  } else {
    drawFromDeck();
    sendSnapshot();
  }
};

elTY.onclick = () => {
  if (net.online && !net.isHost) {
    sendAction({ t: 'thankyou-claim' });
  } else {
    takeThankYou();
    sendSnapshot();
  }
};

elRegSet.onclick = () => {
  const ids = selectedFromHand().map((c) => c.id);
  if (net.online && !net.isHost && current().id === 'P2') {
    sendAction({ t: 'register', kind: 'set', ids });
  } else {
    registerSelected('set');
    sendSnapshot();
  }
};

elRegRun.onclick = () => {
  const ids = selectedFromHand().map((c) => c.id);
  if (net.online && !net.isHost && current().id === 'P2') {
    sendAction({ t: 'register', kind: 'run', ids });
  } else {
    registerSelected('run');
    sendSnapshot();
  }
};

elAttach.onclick = () => {
  const sel = selectedFromHand();
  if (sel.length !== 1) {
    attachSelected();
    sendSnapshot();
    return;
  }
  const id = sel[0].id;
  if (net.online && !net.isHost && current().id === 'P2') {
    sendAction({ t: 'attach', id });
  } else {
    attachSelected();
    sendSnapshot();
  }
};

document.getElementById('hand').addEventListener('dblclick', () => {
  setDiscard();
});

elPendDiscard.onclick = () => {
  if (net.online && !net.isHost && current().id === 'P2') {
    const sel = selectedFromHand();
    if (sel.length === 1) {
      sendAction({ t: 'discard', id: sel[0].id });
    }
  } else {
    commitDiscard();
    sendSnapshot();
  }
};

document.getElementById('opt-continue').addEventListener('change', (e) => {
  state.options.continueAfterOut = e.target.checked;
  sendSnapshot();
});

document.getElementById('opt-seats').addEventListener('change', (e) => {
  const next = clampSeatCount(e.target.value);
  if (state.options.totalSeats === next) {
    e.target.value = String(next);
    return;
  }
  state.options.totalSeats = next;
  newGame();
  sendSnapshot();
});

elReset.onclick = () => {
  newGame();
  sendSnapshot();
};

document.getElementById('btnHost').onclick = () => hostStart();
document.getElementById('btnJoin').onclick = () => guestStart();
document.getElementById('btnApply').onclick = () => hostApplyAnswer();

runUnitTests();
newGame();
updateDiscardButtonState();
