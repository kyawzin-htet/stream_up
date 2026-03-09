export function formatCompactCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';

  const abs = Math.abs(value);
  const format = (divisor: number, suffix: string) => {
    const scaled = value / divisor;
    const rounded = Math.round(scaled * 10) / 10;
    const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    return `${str}${suffix}`;
  };

  if (abs < 1000) return String(Math.round(value));
  if (abs < 1_000_000) return format(1_000, 'k');
  if (abs < 1_000_000_000) return format(1_000_000, 'm');
  return format(1_000_000_000, 'b');
}
