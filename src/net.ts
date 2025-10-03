import { useStore } from './store';

export type NetworkEvents = {
  'player:join': { id: string; name: string };
  'player:leave': { id: string };
  'deck:reshuffle': void;
};

type EventName = keyof NetworkEvents;

class Emitter {
  private listeners: Map<EventName, Set<(...args: unknown[]) => void>> = new Map();

  on(event: EventName, listener: (...args: unknown[]) => void): void {
    const eventListeners = this.listeners.get(event) ?? new Set();
    eventListeners.add(listener);
    this.listeners.set(event, eventListeners);
  }

  off(event: EventName, listener: (...args: unknown[]) => void): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;
    eventListeners.delete(listener);
    if (eventListeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  emit(event: EventName, payload: unknown): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;
    for (const listener of Array.from(eventListeners)) {
      listener(payload);
    }
  }
}

const emitter = new Emitter();

type Listener<E extends EventName> = (payload: NetworkEvents[E]) => void;

export function on<E extends EventName>(event: E, listener: Listener<E>): () => void {
  const wrappedListener = listener as (...args: unknown[]) => void;
  emitter.on(event, wrappedListener);
  return () => emitter.off(event, wrappedListener);
}

export function emit<E extends EventName>(event: E, payload: NetworkEvents[E]): void {
  emitter.emit(event, payload);
  const store = useStore.getState();
  switch (event) {
    case 'player:join': {
      store.addPlayer({ id: payload.id, name: payload.name });
      store.enqueueToast({ message: `🔔 ${payload.name} 입장!`, tone: 'success' });
      break;
    }
    case 'player:leave': {
      store.removePlayer(payload.id);
      store.enqueueToast({ message: `👋 ${payload.id} 퇴장`, tone: 'warning' });
      break;
    }
    case 'deck:reshuffle': {
      store.showReshuffle();
      store.enqueueToast({ message: '♻️ 버린 패 재섞기', tone: 'info' });
      break;
    }
    default:
      break;
  }
}

export function simulateJoin(name: string, id = crypto.randomUUID()) {
  emit('player:join', { id, name });
}

export default {
  on,
  emit,
  simulateJoin
};
