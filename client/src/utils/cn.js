/**
 * Tiny class-name joiner. Keeps conditional classes readable without a dependency.
 */
export function cn(...values) {
  return values.filter(Boolean).join(' ');
}
