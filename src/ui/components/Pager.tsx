import React from 'react';

export type PagerItem = {
  label: string;
  path: string;
};

type PagerProps = {
  items: PagerItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  placement: 'top' | 'bottom';
};

const Pager: React.FC<PagerProps> = ({ items, currentPath, onNavigate, placement }) => {
  return (
    <nav className={`pager pager--${placement}`} aria-label="주요 페이지">
      <ul>
        {items.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <li key={item.path}>
              <button
                type="button"
                className={isActive ? 'pager__btn pager__btn--active' : 'pager__btn'}
                onClick={() => onNavigate(item.path)}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Pager;
