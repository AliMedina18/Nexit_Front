import { mockProviders } from "@/data/mock-providers";
import { nextNumericId } from "@/lib/id";
import type { Provider, ProviderInput } from "@/types/domain";

/**
 * Contract the UI depends on. Keeping this interface small and CRUD-shaped
 * means the .NET Web API integration later on is a matter of writing one
 * new class (HttpProviderService) that implements the same shape — no
 * component code has to change.
 */
export interface ProviderService {
  list(): Promise<Provider[]>;
  create(input: ProviderInput): Promise<Provider>;
  update(id: number, input: ProviderInput): Promise<Provider>;
  remove(id: number): Promise<void>;
}

const LATENCY_MS = 120;
const delay = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), LATENCY_MS));

/**
 * In-memory implementation used until the backend is wired up. Data lives
 * for the lifetime of the tab (mirrors the original static prototype).
 */
class MockProviderService implements ProviderService {
  private store: Provider[] = [...mockProviders];

  async list(): Promise<Provider[]> {
    return delay([...this.store]);
  }

  async create(input: ProviderInput): Promise<Provider> {
    const provider: Provider = {
      ...input,
      id: nextNumericId(this.store),
      attachments: input.attachments ?? [],
    };
    this.store = [...this.store, provider];
    return delay(provider);
  }

  async update(id: number, input: ProviderInput): Promise<Provider> {
    const existing = this.store.find((p) => p.id === id);
    const updated: Provider = {
      ...input,
      id,
      attachments: input.attachments ?? existing?.attachments ?? [],
    };
    this.store = this.store.map((p) => (p.id === id ? updated : p));
    return delay(updated);
  }

  async remove(id: number): Promise<void> {
    this.store = this.store.filter((p) => p.id !== id);
    return delay(undefined);
  }
}

/**
 * TODO(backend): implement against the .NET Web API once endpoints exist,
 * e.g.
 *
 *   class HttpProviderService implements ProviderService {
 *     private base = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/providers`;
 *     async list() { return fetch(this.base).then(r => r.json()); }
 *     ...
 *   }
 *
 * and flip the export below to `new HttpProviderService()`.
 */
export const providerService: ProviderService = new MockProviderService();
