import { parse } from "jsr:@std/csv/parse";

/** Pick the most likely delimiter from the first non-empty line. */
function sniffSeparator(firstNonEmptyLine: string): string {
  const candidates = [",", ";", "\t", "|"];
  const counts = candidates.map(
    (sep) => (firstNonEmptyLine.match(new RegExp(`\\${sep}`, "g")) ?? []).length
  );
  const idx = counts.indexOf(Math.max(...counts));
  return candidates[idx] ?? ",";
}

/** CSV → array of objects using header row; tolerant to width + delimiters. */
export function parseCsvToObjects(
  csvText: string
): Array<Record<string, string>> {
  // Strip BOM, sniff delimiter from first non-empty line
  const text = csvText.replace(/^\uFEFF/, "");
  const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
  const separator = sniffSeparator(firstLine);

  // Deno std parse returns row arrays; we map headers ourselves.
  const records = Array.from(
    parse(text, {
      separator, // comma, semicolon, tab, or pipe
      lazyQuotes: true, // tolerate unbalanced quotes
      trimLeadingSpace: true,
      // NOTE: Do NOT set `columns: true` here; Deno expects string[] not boolean.
    }) as Iterable<string[]>
  );

  if (records.length === 0) return [];

  const headers = records[0];
  const colCount = headers.length;
  const out: Array<Record<string, string>> = [];

  for (let i = 1; i < records.length; i++) {
    let row = records[i];

    // Tolerant width handling: pad short rows; merge extras into last column.
    if (row.length < colCount) {
      row = row.slice();
      while (row.length < colCount) row.push("");
    } else if (row.length > colCount) {
      row = [
        ...row.slice(0, colCount - 1),
        row.slice(colCount - 1).join(separator),
      ];
    }

    const obj: Record<string, string> = {};
    for (let c = 0; c < colCount; c++) {
      obj[headers[c]] = (row[c] ?? "").trim();
    }
    out.push(obj);
  }

  return out;
}
