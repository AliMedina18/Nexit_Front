"use client";

import { create } from "zustand";

export interface Toast {
  id: number;
  message: string;
  icon?: string;
}

interface UiState {
  toasts: Toast[];
  pushToast: (message: string, icon?: string) => void;
  dismissToast: (id: number) => void;
}

let counter = 0;

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  pushToast: (message, icon) => {
    counter += 1;
    const id = counter;
    set((state) => ({ toasts: [...state.toasts, { id, message, icon }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 2800);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
