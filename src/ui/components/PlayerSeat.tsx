import React from 'react';
import { Player } from '../../store';

const PlayerSeat: React.FC<{ player?: Player; position: 'north' | 'south' | 'east' | 'west' }> = ({
  player,
  position
}) => {
  return (
    <div className={`player-seat player-seat--${position}`}>
      {player ? (
        <>
          <div className="player-seat__avatar" aria-hidden>
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div className="player-seat__name">{player.name}</div>
        </>
      ) : (
        <div className="player-seat__empty">비어있음</div>
      )}
    </div>
  );
};

export default PlayerSeat;
