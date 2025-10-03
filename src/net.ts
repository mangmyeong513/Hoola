import { useStore } from './store';

export type NetworkEvents = {
  'player:join': { id: string; name: string };
  'player:leave': { id: string };
  'deck:reshuffle': void;
};

type EventName = keyof NetworkEvents;

type Listener<E extends EventName> = (payload: NetworkEvents[E]) => void;

type EmitArgs<E extends EventName> = NetworkEvents[E] extends void
  ? []
  : [NetworkEvents[E]];

class Emitter {
  private listeners = new Map<EventName, Set<Listener<EventName>>>();

  on<E extends EventName>(event: E, listener: Listener<E>): void {
    const eventListeners = this.listeners.get(event) ?? new Set<Listener<EventName>>();
    eventListeners.add(listener as Listener<EventName>);
    this.listeners.set(event, eventListeners);
  }

  off<E extends EventName>(event: E, listener: Listener<E>): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;
    eventListeners.delete(listener as Listener<EventName>);
    if (eventListeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  emit<E extends EventName>(event: E, ...payload: EmitArgs<E>): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    if (payload.length === 0) {
      for (const listener of eventListeners) {
        (listener as Listener<E>)(undefined as NetworkEvents[E]);
      }
      return;
    }

    const [detail] = payload as [NetworkEvents[E]];
    for (const listener of eventListeners) {
      (listener as Listener<E>)(detail);
    }
  }
}

const emitter = new Emitter();

export function on<E extends EventName>(event: E, listener: Listener<E>): () => void {
  emitter.on(event, listener);
  return () => emitter.off(event, listener);
}

export function emit<E extends EventName>(event: E, ...payload: EmitArgs<E>): void {
  emitter.emit(event, ...payload);
  const store = useStore.getState();
  switch (event) {
    case 'player:join': {
      const [detail] = payload as EmitArgs<'player:join'>;
      store.addPlayer({ id: detail.id, name: detail.name });
      store.enqueueToast({ message: `🔔 ${detail.name} 입장!`, tone: 'success' });
      break;
    }
    case 'player:leave': {
      const [detail] = payload as EmitArgs<'player:leave'>;
      store.removePlayer(detail.id);
      store.enqueueToast({ message: `👋 ${detail.id} 퇴장`, tone: 'warning' });
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
