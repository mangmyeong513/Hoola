import React from 'react';
import { createHashRouter, RouteObject } from 'react-router-dom';
import App from './ui/App';
import Lobby from './ui/pages/Lobby';
import Table3D from './ui/pages/Table3D';
import Round from './ui/pages/Round';
import Settings from './ui/pages/Settings';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Lobby /> },
      { path: '/table', element: <Table3D /> },
      { path: '/round', element: <Round /> },
      { path: '/settings', element: <Settings /> }
    ]
  }
];

const router = createHashRouter(routes);

export default router;
