"use client";

import { create } from "zustand";

export type ToastVariant = "success" | "info" | "danger";

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface UiState {
  toasts: Toast[];
  pushToast: (message: string, variant?: ToastVariant) => void;
  dismissToast: (id: number) => void;
}

let counter = 0;

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  pushToast: (message, variant = "info") => {
    counter += 1;
    const id = counter;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 2800);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
