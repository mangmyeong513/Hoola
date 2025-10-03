import React, { useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { selectors, useStore } from '../store';
import Pager from './components/Pager';
import JoinToast from './components/JoinToast';
import HUD from './components/HUD';
import JoinIcon from './components/JoinIcon';
import '../styles/tokens.css';

type PagerItem = {
  label: string;
  path: string;
};

const MOBILE_QUERY = '(max-width: 768px)';

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = useStore(selectors.viewMode);
  const forceMobile = useStore((state) => state.forceMobile);
  const setMode = useStore((state) => state.setMode);
  const popToast = useStore((state) => state.popToast);
  const activeToast = useStore(selectors.activeToast);
  const players = useStore(selectors.players);

  useEffect(() => {
    if (forceMobile) {
      setMode('mobile');
      return;
    }
    const mq = window.matchMedia(MOBILE_QUERY);
    const listener = (event: MediaQueryListEvent) => {
      setMode(event.matches ? 'mobile' : 'desktop');
    };
    setMode(mq.matches ? 'mobile' : 'desktop');
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [forceMobile, setMode]);

  useEffect(() => {
    if (!activeToast) {
      return;
    }
    const timer = window.setTimeout(() => {
      popToast();
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [activeToast, popToast]);

  const isMobile = mode === 'mobile';
  const pagerItems: PagerItem[] = useMemo(
    () => [
      { label: '로비', path: '/' },
      { label: '테이블', path: '/table' },
      { label: '라운드', path: '/round' },
      { label: '설정', path: '/settings' }
    ],
    []
  );

  const layoutClass = isMobile ? 'app app--mobile' : 'app app--desktop';
  const navPlacement = isMobile ? 'bottom' : 'top';

  return (
    <div className={layoutClass} data-route={location.pathname}>
      <main className="app__content" role="main">
        <Outlet />
      </main>
      <HUD />
      <Pager
        items={pagerItems}
        currentPath={location.pathname}
        onNavigate={navigate}
        placement={navPlacement}
      />
      <div className="app__join-icons" aria-hidden>
        {players.map((player) => (
          <JoinIcon key={player.id} player={player} />
        ))}
      </div>
      <JoinToast toast={activeToast} isMobile={isMobile} />
    </div>
  );
};

export default App;
