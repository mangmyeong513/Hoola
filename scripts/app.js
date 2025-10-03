(function () {
  var seatCountSelect = document.getElementById('seatCount');
  var seatRing = document.getElementById('seatRing');
  var logList = document.getElementById('logList');
  var modeBadge = document.getElementById('modeBadge');
  var reshuffle = document.getElementById('reshuffle');
  var drawButton = document.getElementById('drawButton');
  var thankButton = document.getElementById('thankButton');
  var meldButton = document.getElementById('meldButton');

  var currentModeLabel = '';
  var state = {
    seatCount: parseInt(seatCountSelect.value || '4', 10),
    players: [],
    log: [],
    currentTurn: 0,
    pendingBot: false,
    botTimeoutId: null
  };

  var localPlayerName = 'YOU';
  var botNames = ['네온봇 α', '네온봇 β', '네온봇 γ', '네온봇 δ'];

  function clampSeatCount(value) {
    var count = parseInt(value, 10);
    if (Number.isNaN(count)) {
      count = state.seatCount;
    }
    return Math.max(3, Math.min(6, count));
  }

  function createBot(index) {
    var baseName = botNames[(index - 1) % botNames.length];
    var suffix = Math.floor((index - 1) / botNames.length) + 1;
    return {
      id: 'bot-' + index,
      name: suffix > 1 ? baseName + ' #' + suffix : baseName,
      isBot: true
    };
  }

  function resetLog() {
    state.log = [];
  }

  function pushLog(message) {
    var now = new Date();
    var timestamp = now.getHours().toString().padStart(2, '0') + ':' +
      now.getMinutes().toString().padStart(2, '0');
    state.log.push(timestamp + ' — ' + message);
  }

  function currentPlayer() {
    return state.players[state.currentTurn] || null;
  }

  function updateRosterBadge() {
    var bots = state.players.filter(function (p) { return p.isBot; }).length;
    var label = state.seatCount + '명 · 봇 ' + bots + '명';
    modeBadge.dataset.roster = label;
    modeBadge.setAttribute('title', label);
  }

  function syncBadgeText() {
    var rosterInfo = modeBadge.dataset.roster ? ' · ' + modeBadge.dataset.roster : '';
    modeBadge.textContent = currentModeLabel + rosterInfo;
  }

  function updateModeClass() {
    if (window.innerWidth <= 768) {
      document.body.classList.add('mobile');
      currentModeLabel = 'Mobile Flat';
    } else {
      document.body.classList.remove('mobile');
      currentModeLabel = 'Desktop 3D';
    }
    syncBadgeText();
  }

  function renderSeats() {
    var players = state.players;
    seatRing.innerHTML = '';
    if (!players.length) {
      return;
    }
    var radius = players.length >= 5 ? 240 : players.length === 3 ? 210 : 225;
    var startAngle = -90;
    for (var i = 0; i < players.length; i++) {
      var player = players[i];
      var angle = startAngle + (360 / players.length) * i;
      var li = document.createElement('li');
      li.dataset.bot = String(player.isBot);
      li.dataset.active = i === state.currentTurn ? 'true' : 'false';
      li.innerHTML = '<strong>' + player.name + '</strong>' +
        '<span>' + (player.isBot ? '자동 플레이어' : '사람 플레이어') + '</span>';
      li.style.transform = 'translate(-50%, -50%) rotate(' + angle + 'deg) translate(0, -' + radius + 'px) rotate(' + (-angle) + 'deg)';
      seatRing.appendChild(li);
    }
  }

  function renderLog() {
    logList.innerHTML = '';
    var entries = state.log.slice(-20);
    for (var i = 0; i < entries.length; i++) {
      var li = document.createElement('li');
      li.textContent = entries[i];
      logList.appendChild(li);
    }
  }

  function setActionButtonsEnabled(enabled) {
    var buttons = [drawButton, thankButton, meldButton];
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = !enabled;
    }
  }

  function drawUI() {
    updateRosterBadge();
    renderSeats();
    renderLog();
    var player = currentPlayer();
    var allowHumanAction = Boolean(player && !player.isBot && !state.pendingBot);
    setActionButtonsEnabled(allowHumanAction);
    syncBadgeText();
  }

  function advanceTurn() {
    state.currentTurn = (state.currentTurn + 1) % state.players.length;
    drawUI();
    maybeBotTurn();
  }

  function clearBotTimer() {
    if (state.botTimeoutId !== null) {
      window.clearTimeout(state.botTimeoutId);
      state.botTimeoutId = null;
    }
  }

  function maybeBotTurn() {
    var player = currentPlayer();
    if (!player || !player.isBot) {
      state.pendingBot = false;
      clearBotTimer();
      drawUI();
      return;
    }
    if (state.pendingBot) {
      return;
    }
    state.pendingBot = true;
    drawUI();
    clearBotTimer();
    state.botTimeoutId = window.setTimeout(function () {
      pushLog(player.name + '이(가) 자동으로 드로우했습니다.');
      state.pendingBot = false;
      state.botTimeoutId = null;
      advanceTurn();
    }, 600);
  }

  function newGame(seatCount) {
    clearBotTimer();
    var count = clampSeatCount(seatCount);
    state.seatCount = count;
    state.currentTurn = 0;
    state.pendingBot = false;
    seatCountSelect.value = String(count);

    state.players = [{
      id: 'local-player',
      name: localPlayerName,
      isBot: false
    }];

    for (var i = 1; i < count; i++) {
      state.players.push(createBot(i));
    }

    resetLog();
    pushLog('라운드가 새로 시작되었습니다. 총 ' + count + '명의 참가자.');
    drawUI();
    maybeBotTurn();
  }

  function handleDraw() {
    var player = currentPlayer();
    if (!player || player.isBot || state.pendingBot) {
      return;
    }
    pushLog(player.name + '이(가) 카드를 드로우했습니다.');
    advanceTurn();
  }

  function handleThank() {
    var player = currentPlayer();
    if (!player || player.isBot || state.pendingBot) {
      return;
    }
    pushLog(player.name + '이(가) "땡큐"를 외치며 턴을 유지했습니다.');
    drawUI();
  }

  function handleMeld() {
    var player = currentPlayer();
    if (!player || player.isBot || state.pendingBot) {
      return;
    }
    pushLog(player.name + '이(가) 콤보를 등록했습니다.');
    advanceTurn();
  }

  seatCountSelect.addEventListener('change', function () {
    newGame(seatCountSelect.value);
  });

  reshuffle.addEventListener('click', function () {
    newGame(state.seatCount);
  });

  drawButton.addEventListener('click', handleDraw);
  thankButton.addEventListener('click', handleThank);
  meldButton.addEventListener('click', handleMeld);

  window.addEventListener('resize', updateModeClass);

  updateModeClass();
  newGame(state.seatCount);
})();
