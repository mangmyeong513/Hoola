import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '../../router';
import { useStore } from '../../store';

function renderApp(initialPath: string) {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  return render(<RouterProvider router={router} />);
}

describe('view mode layout', () => {
  it('applies mobile layout class', () => {
    useStore.setState({ mode: 'mobile' } as any);
    const { container } = renderApp('/');
    expect(container.querySelector('.app')).toHaveClass('app--mobile');
  });

  it('applies desktop layout class', () => {
    useStore.setState({ mode: 'desktop' } as any);
    const { container } = renderApp('/');
    expect(container.querySelector('.app')).toHaveClass('app--desktop');
  });
});
