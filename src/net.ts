import { EventEmitter } from 'events';
import { useStore } from './store';

export type NetworkEvents = {
  'player:join': { id: string; name: string };
  'player:leave': { id: string };
  'deck:reshuffle': void;
};

const emitter = new EventEmitter();

type EventName = keyof NetworkEvents;

type Listener<E extends EventName> = (payload: NetworkEvents[E]) => void;

export function on<E extends EventName>(event: E, listener: Listener<E>): () => void {
  emitter.on(event, listener as (...args: unknown[]) => void);
  return () => emitter.off(event, listener as (...args: unknown[]) => void);
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
