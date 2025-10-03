import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import Table3D from '../pages/Table3D';
import { useStore } from '../../store';

describe('visual regressions', () => {
  it('renders 3D desktop table container', () => {
    useStore.setState({ mode: 'desktop', threeEnabled: true } as any);
    const { container } = render(<Table3D />);
    expect(container.querySelector('.table-view__three')).toBeTruthy();
  });

  it('renders flat mobile table container', () => {
    useStore.setState({ mode: 'mobile', threeEnabled: false } as any);
    const { container } = render(<Table3D />);
    const flat = container.querySelector('.table-view__flat');
    expect(flat).toBeTruthy();
    expect(flat?.querySelector('.table-view__hand')).toBeTruthy();
  });
});
