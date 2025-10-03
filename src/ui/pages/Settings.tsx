import React from 'react';
import { t } from '../../i18n';
import { useStore } from '../../store';

const Settings: React.FC = () => {
  const forceMobile = useStore((state) => state.forceMobile);
  const threeEnabled = useStore((state) => state.threeEnabled);
  const toggleForceMobile = useStore((state) => state.toggleForceMobile);
  const toggleThree = useStore((state) => state.toggleThree);

  return (
    <section className="page page--settings">
      <header className="page__header">
        <h1>{t('settingsTitle')}</h1>
        <p>그래픽, 레이아웃, 접근성 옵션을 설정하세요.</p>
      </header>
      <div className="settings__group">
        <label className="settings__option">
          <span>{t('graphics')}</span>
          <select>
            <option value="low">저</option>
            <option value="medium">중</option>
            <option value="high">고</option>
          </select>
        </label>
        <label className="settings__option">
          <span>{t('mobileForce')}</span>
          <input
            type="checkbox"
            checked={forceMobile}
            onChange={(event) => toggleForceMobile(event.target.checked)}
          />
        </label>
        <label className="settings__option">
          <span>{t('threeToggle')}</span>
          <input
            type="checkbox"
            checked={threeEnabled}
            onChange={(event) => toggleThree(event.target.checked)}
          />
        </label>
      </div>
    </section>
  );
};

export default Settings;
