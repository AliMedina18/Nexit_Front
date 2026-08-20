let counter = 0;

/** Simple client-side id generator for mock data. Real IDs will come from the API. */
export function nextNumericId(existing: { id: number }[]): number {
  const max = existing.reduce((acc, item) => Math.max(acc, item.id), 0);
  return max + 1;
}

export function nextStringId(prefix = "id"): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}
