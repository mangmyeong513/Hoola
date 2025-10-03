import create from 'zustand';
import { persist } from 'zustand/middleware';

export type Player = {
  id: string;
  name: string;
  isLocal?: boolean;
  joinedAt?: number;
};

export type Toast = {
  id: number;
  message: string;
  tone?: 'info' | 'success' | 'warning';
};

export type MeldDropHint = {
  meldId: string;
  allowLeft: boolean;
  allowRight: boolean;
};

export type ViewMode = 'mobile' | 'desktop';

export interface ViewState {
  mode: ViewMode;
  forceMobile: boolean;
  threeEnabled: boolean;
  setMode: (mode: ViewMode) => void;
  toggleForceMobile: (force: boolean) => void;
  toggleThree: (enabled: boolean) => void;
}

export interface GameState {
  players: Player[];
  toasts: Toast[];
  activeToast?: Toast;
  meldHints: Record<string, MeldDropHint>;
  thankYouOpen: boolean;
  thankYouFrom?: string;
  sevenBadgeVisible: boolean;
  reshuffleNotice: boolean;
  enqueueToast: (toast: Omit<Toast, 'id'>) => void;
  popToast: () => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  openThankYou: (fromPlayer: string) => void;
  closeThankYou: () => void;
  showSevenBadge: () => void;
  hideSevenBadge: () => void;
  showReshuffle: () => void;
  clearReshuffle: () => void;
  setMeldHint: (meldId: string, hint: MeldDropHint) => void;
}

let toastCounter = 0;

export const useStore = create<ViewState & GameState>()(
  persist(
    (set, get) => ({
      mode: 'desktop',
      forceMobile: false,
      threeEnabled: true,
      players: [],
      toasts: [],
      meldHints: {},
      thankYouOpen: false,
      sevenBadgeVisible: false,
      reshuffleNotice: false,
      setMode: (mode) => set({ mode }),
      toggleForceMobile: (force) => set({ forceMobile: force, mode: force ? 'mobile' : 'desktop' }),
      toggleThree: (enabled) => set({ threeEnabled: enabled }),
      enqueueToast: (toast) => {
        const newToast = { ...toast, id: ++toastCounter };
        const { activeToast } = get();
        if (!activeToast) {
          set({ activeToast: newToast });
        } else {
          set({ toasts: [...get().toasts, newToast] });
        }
      },
      popToast: () => {
        const queue = get().toasts;
        if (queue.length === 0) {
          set({ activeToast: undefined });
        } else {
          const [next, ...rest] = queue;
          set({ activeToast: next, toasts: rest });
        }
      },
      addPlayer: (player) => {
        const players = get().players.filter((p) => p.id !== player.id);
        set({ players: [...players, { ...player, joinedAt: Date.now() }] });
      },
      removePlayer: (playerId) => {
        set({ players: get().players.filter((p) => p.id !== playerId) });
      },
      openThankYou: (fromPlayer) => set({ thankYouOpen: true, thankYouFrom: fromPlayer }),
      closeThankYou: () => set({ thankYouOpen: false, thankYouFrom: undefined }),
      showSevenBadge: () => set({ sevenBadgeVisible: true }),
      hideSevenBadge: () => set({ sevenBadgeVisible: false }),
      showReshuffle: () => set({ reshuffleNotice: true }),
      clearReshuffle: () => set({ reshuffleNotice: false }),
      setMeldHint: (meldId, hint) =>
        set({ meldHints: { ...get().meldHints, [meldId]: hint } })
    }),
    {
      name: 'hoola-ui-state',
      partialize: (state) => ({
        forceMobile: state.forceMobile,
        threeEnabled: state.threeEnabled
      })
    }
  )
);

export const selectors = {
  viewMode: (state: ViewState & GameState) => state.mode,
  isMobile: (state: ViewState & GameState) => state.mode === 'mobile',
  threeEnabled: (state: ViewState & GameState) => state.threeEnabled,
  players: (state: ViewState & GameState) => state.players,
  activeToast: (state: ViewState & GameState) => state.activeToast,
  toastQueue: (state: ViewState & GameState) => state.toasts,
  thankYouOpen: (state: ViewState & GameState) => state.thankYouOpen,
  thankYouFrom: (state: ViewState & GameState) => state.thankYouFrom,
  sevenBadgeVisible: (state: ViewState & GameState) => state.sevenBadgeVisible,
  reshuffleNotice: (state: ViewState & GameState) => state.reshuffleNotice,
  meldHints: (state: ViewState & GameState) => state.meldHints
};
