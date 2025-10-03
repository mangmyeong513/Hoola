import { describe, expect, it } from 'vitest';
import { act } from '@testing-library/react';
import { useStore } from '../../store';

function runQueue() {
  const state = useStore.getState();
  return state.activeToast;
}

describe('join toast queue', () => {
  it('queues subsequent join toasts', () => {
    useStore.setState({ activeToast: undefined, toasts: [] } as any);
    act(() => {
      useStore.getState().enqueueToast({ message: 'first' });
      useStore.getState().enqueueToast({ message: 'second' });
    });
    const active = runQueue();
    expect(active?.message).toBe('first');
    act(() => {
      useStore.getState().popToast();
    });
    expect(useStore.getState().activeToast?.message).toBe('second');
  });
});
