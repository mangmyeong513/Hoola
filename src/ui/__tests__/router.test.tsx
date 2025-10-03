import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '../../router';

function renderWithRouter(initialPath: string) {
  const memoryRouter = createMemoryRouter(routes, {
    initialEntries: [initialPath]
  });

  return render(<RouterProvider router={memoryRouter} />);
}

describe('router', () => {
  it('renders table page', () => {
    renderWithRouter('/table');
    expect(screen.getByRole('heading', { name: '테이블' })).toBeInTheDocument();
  });

  it('renders round page', () => {
    renderWithRouter('/round');
    expect(screen.getByRole('heading', { name: '라운드 요약' })).toBeInTheDocument();
  });
});
