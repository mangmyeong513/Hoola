(function () {
  var seatSelect = document.getElementById('seatSelect');
  var seatRing = document.getElementById('seatRing');
  var logList = document.getElementById('logList');
  var modeBadge = document.getElementById('modeBadge');
  var reshuffle = document.getElementById('reshuffle');
  var currentModeLabel = '';

  var humanNames = ['YOU', 'ALLY', 'RIVAL'];
  var botNames = ['네온봇 α', '네온봇 β', '네온봇 γ'];
  var activity = ['드로우', '땡큐 대기', '등록 준비', '버림'];

  function buildRoster(count) {
    var roster = [];
    for (var i = 0; i < humanNames.length && roster.length < count; i++) {
      roster.push({ name: humanNames[i], bot: false });
    }
    var botIndex = 0;
    while (roster.length < count) {
      var label = botNames[botIndex % botNames.length] + ' #' + (Math.floor(botIndex / botNames.length) + 1);
      roster.push({ name: label, bot: true });
      botIndex++;
    }
    return roster;
  }

  function renderSeats(roster) {
    seatRing.innerHTML = '';
    var radius = roster.length >= 5 ? 240 : roster.length === 3 ? 210 : 225;
    var startAngle = -90;
    for (var i = 0; i < roster.length; i++) {
      var player = roster[i];
      var angle = startAngle + (360 / roster.length) * i;
      var li = document.createElement('li');
      li.dataset.bot = String(player.bot);
      li.innerHTML = '<strong>' + player.name + '</strong>' +
        '<span>' + (player.bot ? '자동 플레이어' : '사람 플레이어') + '</span>';
      var transform = 'translate(-50%, -50%) rotate(' + angle + 'deg) translate(0, -' + radius + 'px) rotate(' + (-angle) + 'deg)';
      li.style.transform = transform;
      seatRing.appendChild(li);
    }
  }

  function renderLog(roster) {
    logList.innerHTML = '';
    var now = new Date();
    var base = document.createElement('li');
    base.textContent = now.getHours().toString().padStart(2, '0') + ':' +
      now.getMinutes().toString().padStart(2, '0') + ' — 라운드가 시작되었습니다.';
    logList.appendChild(base);
    for (var i = 0; i < roster.length; i++) {
      var item = document.createElement('li');
      var action = activity[i % activity.length];
      item.textContent = roster[i].name + ' : ' + action;
      logList.appendChild(item);
    }
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

  function refresh(rosterSize, logOnly) {
    var count = Math.max(3, Math.min(6, rosterSize));
    var roster = buildRoster(count);
    renderSeats(roster);
    renderLog(roster);
    if (!logOnly) {
      var label = count + '명 · ' + roster.filter(function (p) { return p.bot; }).length + '봇 자동 참여';
      modeBadge.dataset.roster = label;
      modeBadge.setAttribute('title', label);
    }
    syncBadgeText();
  }

  seatSelect.addEventListener('change', function () {
    var value = parseInt(seatSelect.value, 10);
    refresh(value, false);
  });

  reshuffle.addEventListener('click', function () {
    refresh(parseInt(seatSelect.value, 10), true);
  });

  window.addEventListener('resize', updateModeClass);

  updateModeClass();
  refresh(parseInt(seatSelect.value, 10), false);
})();
