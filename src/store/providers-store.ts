"use client";

import { create } from "zustand";
import { providerService } from "@/services/provider-service";
import type { Provider, ProviderInput } from "@/types/domain";

interface ProvidersState {
  items: Provider[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  addProvider: (input: ProviderInput) => Promise<Provider>;
  updateProvider: (id: number, input: ProviderInput) => Promise<Provider>;
  removeProvider: (id: number) => Promise<void>;
}

export const useProvidersStore = create<ProvidersState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  fetchAll: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    const items = await providerService.list();
    set({ items, loading: false, loaded: true });
  },
  addProvider: async (input) => {
    const created = await providerService.create(input);
    set((state) => ({ items: [...state.items, created] }));
    return created;
  },
  updateProvider: async (id, input) => {
    const updated = await providerService.update(id, input);
    set((state) => ({ items: state.items.map((p) => (p.id === id ? updated : p)) }));
    return updated;
  },
  removeProvider: async (id) => {
    await providerService.remove(id);
    set((state) => ({ items: state.items.filter((p) => p.id !== id) }));
  },
}));
