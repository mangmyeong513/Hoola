export type LocaleKey = keyof typeof strings['ko'];

export const strings = {
  ko: {
    lobbyTitle: '로비',
    lobbyDescription: '플레이어 수와 닉네임을 설정하고 방을 생성하거나 참여하세요.',
    nickname: '닉네임',
    playerCount: '플레이어 수',
    createRoom: '방 만들기',
    joinRoom: '방 참여',
    tableTitle: '테이블',
    roundTitle: '라운드 요약',
    settingsTitle: '설정',
    graphics: '그래픽 퀄리티',
    mobileForce: '모바일 레이아웃 강제',
    threeToggle: '3D 테이블 활성화'
  },
  en: {
    lobbyTitle: 'Lobby',
    lobbyDescription: 'Configure your nickname and seat count to create or join a room.',
    nickname: 'Nickname',
    playerCount: 'Players',
    createRoom: 'Create Room',
    joinRoom: 'Join Room',
    tableTitle: 'Table',
    roundTitle: 'Round Summary',
    settingsTitle: 'Settings',
    graphics: 'Graphics Quality',
    mobileForce: 'Force Mobile Layout',
    threeToggle: 'Enable 3D Table'
  }
};

export type Locale = keyof typeof strings;

let currentLocale: Locale = 'ko';

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function t(key: LocaleKey): string {
  const localeStrings = strings[currentLocale] ?? strings.ko;
  return localeStrings[key];
}
