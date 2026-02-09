// client/src/lib/stores/useSyncStatus.ts
import { create } from "zustand";

interface FieldError {
  field: string;
  message: string;
}

interface SyncError {
  code: string;
  message: string;
  field?: string;
}

type SyncPhase = 'idle' | 'validating' | 'submitting' | 'syncing' | 'complete';

interface SyncStatusState {
  isSyncing: boolean;
  phase: SyncPhase;
  phaseMessage: string;
  progress: number;
  lastSyncTime: Date | null;
  syncError: string | null;
  errors: SyncError[];
  fieldErrors: Record<string, string>;
  orderId: string | null;
  orderReference: string | null;

  setSyncing: (syncing: boolean) => void;
  startSync: () => void;
  setPhase: (phase: SyncPhase, message: string, progress: number) => void;
  setSyncError: (error: string | null) => void;
  addError: (error: SyncError) => void;
  setFieldError: (field: string, error: string | null) => void;
  setFieldErrors: (errors: Record<string, string>) => void;
  clearFieldError: (field: string) => void;
  clearFieldErrors: () => void;
  setOrderId: (id: string, ref: string) => void;
  reset: () => void;
  markSynced: () => void;
}

export const useSyncStatus = create<SyncStatusState>((set) => ({
  isSyncing: false,
  phase: 'idle',
  phaseMessage: '',
  progress: 0,
  lastSyncTime: null,
  syncError: null,
  errors: [],
  fieldErrors: {},
  orderId: null,
  orderReference: null,

  setSyncing: (isSyncing) => set({ isSyncing }),

  startSync: () => set({
    isSyncing: true,
    phase: 'validating',
    phaseMessage: 'Starting submission...',
    progress: 0,
    errors: [],
    syncError: null
  }),

  setPhase: (phase, message, progress) => set({ phase, phaseMessage: message, progress }),

  setSyncError: (syncError) => set({ syncError }),

  addError: (error) => set((state) => ({
    errors: [...state.errors, error],
    syncError: error.message
  })),

  setFieldError: (field, error) => set((state) => ({
    fieldErrors: error
      ? { ...state.fieldErrors, [field]: error }
      : Object.fromEntries(
        Object.entries(state.fieldErrors).filter(([key]) => key !== field)
      ),
  })),

  setFieldErrors: (errors) => set({ fieldErrors: errors }),

  clearFieldError: (field) => set((state) => ({
    fieldErrors: Object.fromEntries(
      Object.entries(state.fieldErrors).filter(([key]) => key !== field)
    ),
  })),

  clearFieldErrors: () => set({ fieldErrors: {} }),

  setOrderId: (orderId, orderReference) => set({ orderId, orderReference }),

  reset: () => set({
    isSyncing: false,
    phase: 'idle',
    phaseMessage: '',
    progress: 0,
    syncError: null,
    errors: [],
    fieldErrors: {},
    orderId: null,
    orderReference: null
  }),

  markSynced: () => set({
    lastSyncTime: new Date(),
    isSyncing: false,
    syncError: null,
    phase: 'complete',
    progress: 100
  }),
}));