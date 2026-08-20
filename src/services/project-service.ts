import { mockProjects } from "@/data/mock-projects";
import { nextNumericId } from "@/lib/id";
import type { Project, ProjectInput } from "@/types/domain";

export interface ProjectService {
  list(): Promise<Project[]>;
  create(input: ProjectInput): Promise<Project>;
  update(id: number, input: ProjectInput): Promise<Project>;
  remove(id: number): Promise<void>;
}

const LATENCY_MS = 120;
const delay = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), LATENCY_MS));

class MockProjectService implements ProjectService {
  private store: Project[] = [...mockProjects];

  async list(): Promise<Project[]> {
    return delay([...this.store]);
  }

  async create(input: ProjectInput): Promise<Project> {
    const project: Project = { ...input, id: nextNumericId(this.store) };
    this.store = [...this.store, project];
    return delay(project);
  }

  async update(id: number, input: ProjectInput): Promise<Project> {
    const updated: Project = { ...input, id };
    this.store = this.store.map((p) => (p.id === id ? updated : p));
    return delay(updated);
  }

  async remove(id: number): Promise<void> {
    this.store = this.store.filter((p) => p.id !== id);
    return delay(undefined);
  }
}

/** TODO(backend): swap for an HttpProjectService hitting the .NET API, see provider-service.ts. */
export const projectService: ProjectService = new MockProjectService();
