export function redactSecret(value: string): string {
  if (!value) return '';
  if (value.length <= 8) return '********';
  return `${value.slice(0, 3)}****${value.slice(-3)}`;
}
