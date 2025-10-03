import React from 'react';
import Card3D from '../components/Card3D';

export type CardLayout = {
  id: string;
  position: [number, number, number];
};

const CardMesh: React.FC<{ cards: CardLayout[] }> = ({ cards }) => (
  <>{cards.map((card) => (
    <Card3D key={card.id} position={card.position} rotation={[-Math.PI / 2.4, 0, 0]} />
  ))}</>
);

export default CardMesh;
