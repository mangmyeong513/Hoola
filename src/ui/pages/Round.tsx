import React from 'react';
import { t } from '../../i18n';

const mockLog = [
  { time: '00:12', text: 'Player1 버림: 7♠' },
  { time: '00:15', text: 'Player2 땡큐 선언' },
  { time: '00:30', text: 'Player2 등록 성공 (세븐)' }
];

const Round: React.FC = () => {
  return (
    <section className="page page--round">
      <header className="page__header">
        <h1>{t('roundTitle')}</h1>
        <p>라운드 진행 상황과 승패 요약을 확인하세요.</p>
      </header>
      <div className="round__summary">
        <div className="round__card">승자: Player2</div>
        <div className="round__card">남은 패수: 3</div>
        <div className="round__card">땡큐 사용: 1회</div>
      </div>
      <ol className="round__log" aria-label="라운드 로그">
        {mockLog.map((entry) => (
          <li key={entry.time}>
            <span className="round__log-time">{entry.time}</span>
            <span>{entry.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default Round;
