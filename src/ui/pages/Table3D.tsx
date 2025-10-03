import React, { useMemo } from 'react';
import { useStore, selectors } from '../../store';
import Scene from '../three/scene';
import TableMesh from '../three/TableMesh';
import CardMesh from '../three/CardMesh';
import Card2D from '../components/Card2D';
import PlayerSeat from '../components/PlayerSeat';

const mockHand = [
  { rank: '7', suit: '♠' },
  { rank: '8', suit: '♠' },
  { rank: '9', suit: '♠' },
  { rank: '10', suit: '♠' },
  { rank: 'J', suit: '♠' }
];

const Table3D: React.FC = () => {
  const isMobile = useStore(selectors.isMobile);
  const threeEnabled = useStore(selectors.threeEnabled);
  const meldHints = useStore(selectors.meldHints);
  const showSeven = useStore((state) => state.showSevenBadge);
  const players = useStore(selectors.players);

  const tableCards = useMemo(
    () =>
      mockHand.map((_, index) => ({
        id: `card-${index}`,
        position: [index * 0.9 - 2, 0.12, Math.sin(index * 0.4) * 0.3]
      })),
    []
  );

  const layoutPlayers = {
    north: players[1],
    east: players[2],
    south: players[0],
    west: players[3]
  };

  return (
    <section className="page page--table">
      <header className="page__header">
        <h1>테이블</h1>
        <p>데스크탑은 3D, 모바일은 2D 테이블이 자동으로 전환됩니다.</p>
      </header>
      <div className={isMobile || !threeEnabled ? 'table-view table-view--flat' : 'table-view'}>
        {isMobile || !threeEnabled ? (
          <div className="table-view__flat">
            <div className="table-view__seats">
              <PlayerSeat position="north" player={layoutPlayers.north} />
              <PlayerSeat position="east" player={layoutPlayers.east} />
              <PlayerSeat position="south" player={layoutPlayers.south} />
              <PlayerSeat position="west" player={layoutPlayers.west} />
            </div>
            <div className="table-view__melds" role="list">
              <div className="meld-dropzone" aria-label="왼쪽 붙이기만 가능">
                왼쪽만
              </div>
              <div className="meld" role="listitem">
                {mockHand.map((card, index) => (
                  <Card2D key={index} rank={card.rank} suit={card.suit} />
                ))}
              </div>
              <div className="meld-dropzone" aria-label="오른쪽 붙이기만 가능">
                오른쪽만
              </div>
            </div>
            <div className="table-view__hand" aria-label="내 손패">
              {mockHand.map((card, index) => (
                <Card2D key={`hand-${index}`} rank={card.rank} suit={card.suit} selected={index === 0} />
              ))}
            </div>
          </div>
        ) : (
          <div className="table-view__three">
            <Scene shadows camera={{ position: [0, 6, 6], fov: 55 }}>
              <group rotation={[-Math.PI / 5, 0, 0]}>
                <TableMesh />
                <CardMesh cards={tableCards} />
              </group>
            </Scene>
          </div>
        )}
      </div>
      <footer className="table-view__footer">
        <button type="button" onClick={showSeven} className="btn btn--ghost">
          7 등록 트리거
        </button>
        <div className="meld-hints" role="status" aria-live="polite">
          {Object.entries(meldHints).map(([key, hint]) => (
            <div key={key} className="meld-hints__item">
              {key}: 양끝만 ({hint.allowLeft ? '왼쪽 가능' : '왼쪽 불가'}) / (
              {hint.allowRight ? '오른쪽 가능' : '오른쪽 불가'})
            </div>
          ))}
        </div>
      </footer>
    </section>
  );
};

export default Table3D;
