import React, { useState } from 'react';
import { t } from '../../i18n';
import { useStore } from '../../store';

const Lobby: React.FC = () => {
  const [nickname, setNickname] = useState('Player');
  const [count, setCount] = useState(4);
  const addPlayer = useStore((state) => state.addPlayer);

  const handleCreate = () => {
    addPlayer({ id: crypto.randomUUID(), name: nickname, isLocal: true });
  };

  return (
    <section className="page page--lobby">
      <header>
        <h1>{t('lobbyTitle')}</h1>
        <p>{t('lobbyDescription')}</p>
      </header>
      <form className="form" onSubmit={(event) => event.preventDefault()}>
        <label>
          <span>{t('nickname')}</span>
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} />
        </label>
        <label>
          <span>{t('playerCount')}</span>
          <input
            type="number"
            min={2}
            max={6}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
          />
        </label>
        <div className="form__actions">
          <button type="button" onClick={handleCreate} className="btn btn--primary">
            {t('createRoom')}
          </button>
          <button type="button" className="btn">
            {t('joinRoom')}
          </button>
        </div>
      </form>
    </section>
  );
};

export default Lobby;
