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

type EmitArgs<E extends EventName> = NetworkEvents[E] extends void
  ? []
  : [NetworkEvents[E]];

class TypedEmitter {
  private buckets: { [K in EventName]?: Set<Listener<K>> } = {};

  on<E extends EventName>(event: E, listener: Listener<E>): () => void {
    const bucket = (this.buckets[event] ??= new Set()) as Set<Listener<E>>;
    bucket.add(listener);
    return () => this.off(event, listener);
  }

  off<E extends EventName>(event: E, listener: Listener<E>): void {
    const bucket = this.buckets[event] as Set<Listener<E>> | undefined;
    if (!bucket) return;

    bucket.delete(listener);
    if (bucket.size === 0) {
      delete this.buckets[event];
    }
  }

  emit<E extends EventName>(event: E, ...payload: EmitArgs<E>): void {
    const bucket = this.buckets[event] as Set<Listener<E>> | undefined;
    if (!bucket) return;

    const listeners = [...bucket];
    if (payload.length === 0) {
      for (const listener of listeners) {
        (listener as () => void)();
      }
      return;
    }

    const [detail] = payload;
    for (const listener of listeners) {
      (listener as (value: NetworkEvents[E]) => void)(detail as NetworkEvents[E]);
    }
  }
}

const emitter = new TypedEmitter();

export function on<E extends EventName>(event: E, listener: Listener<E>): () => void {
  return emitter.on(event, listener);
}

export function off<E extends EventName>(event: E, listener: Listener<E>): void {
  emitter.off(event, listener);
}

const reactions: { [K in EventName]: (...args: EmitArgs<K>) => void } = {
  'player:join': (detail: NetworkEvents['player:join']) => {
    const store = useStore.getState();
    store.addPlayer({ id: detail.id, name: detail.name });
    store.enqueueToast({ message: `🔔 ${detail.name} 입장!`, tone: 'success' });
  },
  'player:leave': (detail: NetworkEvents['player:leave']) => {
    const store = useStore.getState();
    store.removePlayer(detail.id);
    store.enqueueToast({ message: `👋 ${detail.id} 퇴장`, tone: 'warning' });
  },
  'deck:reshuffle': () => {
    const store = useStore.getState();
    store.showReshuffle();
    store.enqueueToast({ message: '♻️ 버린 패 재섞기', tone: 'info' });
  }
};

export function emit<E extends EventName>(event: E, ...payload: EmitArgs<E>): void {
  emitter.emit(event, ...payload);
  const reaction = reactions[event] as ((...args: EmitArgs<E>) => void) | undefined;
  reaction?.(...payload);
}

export function simulateJoin(name: string, id = crypto.randomUUID()): void {
  emit('player:join', { id, name });
}

export default {
  on,
  emit,
  simulateJoin
};
