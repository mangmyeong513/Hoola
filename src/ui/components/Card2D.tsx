import React from 'react';

type Card2DProps = {
  rank: string;
  suit: string;
  selected?: boolean;
};

const Card2D: React.FC<Card2DProps> = ({ rank, suit, selected }) => {
  return (
    <div className={selected ? 'card2d card2d--selected' : 'card2d'} role="img" aria-label={`${suit} ${rank}`}>
      <span className="card2d__rank">{rank}</span>
      <span className="card2d__suit">{suit}</span>
    </div>
  );
};

export default Card2D;
