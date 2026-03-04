/**
 * Converts a boolean value to a data attribute value.
 * Returns 'true' for truthy values, undefined otherwise.
 */
export function dataAttr(value: unknown): string | undefined {
  return value ? 'true' : undefined
}
