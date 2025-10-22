export function splitParametersCell(cell: string): string[] {
  return (cell || "")
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}
