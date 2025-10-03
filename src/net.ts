import { useStore } from './store';

export type NetworkEvents = {
  'player:join': { id: string; name: string };
  'player:leave': { id: string };
  'deck:reshuffle': void;
};

type EventName = keyof NetworkEvents;

type Listener<E extends EventName> = NetworkEvents[E] extends void
  ? () => void
  : (payload: NetworkEvents[E]) => void;

type EmitArgs<E extends EventName> = NetworkEvents[E] extends void ? [] : [NetworkEvents[E]];

type AnyListener = {
  [K in EventName]: Listener<K>;
}[EventName];

class TinyEmitter {
  private listeners: Partial<Record<EventName, Set<AnyListener>>> = {};

  on<E extends EventName>(event: E, listener: Listener<E>): () => void {
    const bucket = (this.listeners[event] ??= new Set());
    bucket.add(listener as AnyListener);
    return () => this.off(event, listener);
  }

  off<E extends EventName>(event: E, listener: Listener<E>): void {
    const bucket = this.listeners[event];
    if (!bucket) return;

    bucket.delete(listener as AnyListener);
    if (bucket.size === 0) {
      delete this.listeners[event];
    }
  }

  emit<E extends EventName>(event: E, ...args: EmitArgs<E>): void {
    const bucket = this.listeners[event];
    if (!bucket) return;

    for (const handler of [...bucket]) {
      if (args.length === 0) {
        (handler as () => void)();
      } else {
        (handler as (payload: NetworkEvents[E]) => void)(args[0] as NetworkEvents[E]);
      }
    }
  }
}

const emitter = new TinyEmitter();

function runSideEffects<E extends EventName>(event: E, ...args: EmitArgs<E>): void {
  const store = useStore.getState();

  switch (event) {
    case 'player:join': {
      const [detail] = args as EmitArgs<'player:join'>;
      store.addPlayer({ id: detail.id, name: detail.name });
      store.enqueueToast({ message: `🔔 ${detail.name} 입장!`, tone: 'success' });
      break;
    }
    case 'player:leave': {
      const [detail] = args as EmitArgs<'player:leave'>;
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

export function on<E extends EventName>(event: E, listener: Listener<E>): () => void {
  return emitter.on(event, listener);
}

export function off<E extends EventName>(event: E, listener: Listener<E>): void {
  emitter.off(event, listener);
}

export function emit<E extends EventName>(event: E, ...args: EmitArgs<E>): void {
  emitter.emit(event, ...args);
  runSideEffects(event, ...args);
}

export function simulateJoin(name: string, id = crypto.randomUUID()): void {
  emit('player:join', { id, name });
}

export default {
  on,
  emit,
  simulateJoin
};
