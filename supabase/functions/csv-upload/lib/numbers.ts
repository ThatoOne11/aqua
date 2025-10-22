export function parseNumericFromCell(cell: string | undefined): number | null {
  if (!cell) return null;
  const s = cell.trim();
  if (s.toUpperCase() === 'ND') return 0;
  if (!s) return null;
  const m = s.match(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}
