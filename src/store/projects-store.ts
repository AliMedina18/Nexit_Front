"use client";

import { create } from "zustand";
import { projectService } from "@/services/project-service";
import type { Project, ProjectInput } from "@/types/domain";

interface ProjectsState {
  items: Project[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  addProject: (input: ProjectInput) => Promise<Project>;
  updateProject: (id: number, input: ProjectInput) => Promise<Project>;
  removeProject: (id: number) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  fetchAll: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    const items = await projectService.list();
    set({ items, loading: false, loaded: true });
  },
  addProject: async (input) => {
    const created = await projectService.create(input);
    set((state) => ({ items: [...state.items, created] }));
    return created;
  },
  updateProject: async (id, input) => {
    const updated = await projectService.update(id, input);
    set((state) => ({ items: state.items.map((p) => (p.id === id ? updated : p)) }));
    return updated;
  },
  removeProject: async (id) => {
    await projectService.remove(id);
    set((state) => ({ items: state.items.filter((p) => p.id !== id) }));
  },
}));
