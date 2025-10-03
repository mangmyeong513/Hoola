import React, { useEffect, useRef } from 'react';
import { Player } from '../../store';

const JoinIcon: React.FC<{ player: Player }> = ({ player }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('join-icon--pulse');
    // trigger reflow to restart animation
    void el.offsetWidth;
    el.classList.add('join-icon--pulse');
  }, [player.joinedAt]);

  return (
    <div ref={ref} className="join-icon" title={`${player.name} joined`} aria-hidden>
      <span>{player.name.charAt(0).toUpperCase()}</span>
    </div>
  );
};

export default JoinIcon;
