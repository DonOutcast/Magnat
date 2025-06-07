export function convertWHName(name: string): string {
  return name
    .toUpperCase()
    .replace(' ', '_')
    .replace('-', '_')
    .replace('-', '_');
}
