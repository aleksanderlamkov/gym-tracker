export function id(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().slice(0, 13);
  }
  return Math.random().toString(36).slice(2, 9) + Math.random().toString(36).slice(2, 8);
}
