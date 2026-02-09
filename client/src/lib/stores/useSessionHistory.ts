import { create } from 'zustand';

export type OrderHistoryItem = {
    orderReference: string;
    customerName: string;
    total: string;
    date: Date;
    itemCount: number;
};

interface SessionHistoryStore {
    history: OrderHistoryItem[];
    addOrder: (order: OrderHistoryItem) => void;
    clearHistory: () => void;
}

export const useSessionHistory = create<SessionHistoryStore>((set) => ({
    history: [],
    addOrder: (order) => set((state) => ({ history: [order, ...state.history] })),
    clearHistory: () => set({ history: [] }),
}));
