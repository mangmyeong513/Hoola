import React from 'react';
import { selectors, useStore } from '../../store';
import { emit } from '../../net';

const HUD: React.FC = () => {
  const isMobile = useStore(selectors.isMobile);
  const thankYouOpen = useStore(selectors.thankYouOpen);
  const thankYouFrom = useStore(selectors.thankYouFrom);
  const sevenBadgeVisible = useStore(selectors.sevenBadgeVisible);
  const reshuffle = useStore(selectors.reshuffleNotice);
  const hideSeven = useStore((state) => state.hideSevenBadge);
  const clearReshuffle = useStore((state) => state.clearReshuffle);

  const handleFakeJoin = () => {
    emit('player:join', { id: crypto.randomUUID(), name: 'Ally' });
  };

  return (
    <aside className={`hud ${isMobile ? 'hud--mobile' : 'hud--desktop'}`} aria-label="게임 조작">
      <div className="hud__row">
        <button type="button" className="hud__btn">드로우</button>
        <button type="button" className="hud__btn hud__btn--accent">버림</button>
        <button type="button" className="hud__btn" disabled={!thankYouOpen}>
          {thankYouOpen ? `땡큐 (${thankYouFrom ?? '??'})` : '땡큐' }
        </button>
      </div>
      <div className="hud__row">
        <button type="button" className="hud__btn" onClick={() => hideSeven()}>
          {sevenBadgeVisible ? '7 등록 완료!' : '등록'}
        </button>
        <button type="button" className="hud__btn">붙이기</button>
        <button type="button" className="hud__btn" onClick={handleFakeJoin}>
          가상 입장
        </button>
      </div>
      {sevenBadgeVisible && <div className="hud__badge">⭐ 7 단독 등록!</div>}
      {reshuffle && (
        <div className="hud__toast" role="status" aria-live="polite">
          ♻️ 버린 패 재섞기
          <button type="button" onClick={clearReshuffle} aria-label="알림 닫기">
            닫기
          </button>
        </div>
      )}
    </aside>
  );
};

export default HUD;
