const MONTH = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
} as const;

/** "29-Jan-25" -> "2025-01-29" (no regex) */
export function toIsoDateFromDDMonYY(input: string, rowIdx?: number): string {
  const trimmed = (input || "").trim();
  const parts = trimmed.split("-");
  if (parts.length !== 3) {
    throw new Error(
      `Row ${
        rowIdx ?? "?"
      }: "Date" must be DD-Mon-YY (e.g. 29-Jan-25). Got "${input}"`
    );
  }

  let [d, mon, yy] = parts;
  d = String(Number(d)).padStart(2, "0"); // coerce to int then pad
  const mm = MONTH[(mon || "").toLowerCase() as keyof typeof MONTH];
  if (!mm) {
    throw new Error(
      `Row ${
        rowIdx ?? "?"
      }: Unknown month "${mon}" in Date "${input}". Expected Jan, Feb, ...`
    );
  }

  let yearNum = Number(yy);
  if (!Number.isFinite(yearNum)) {
    throw new Error(
      `Row ${rowIdx ?? "?"}: Invalid year "${yy}" in Date "${input}".`
    );
  }
  // assume 2-digit => 2000+yy (25 => 2025)
  if (yy.length === 2) yearNum = 2000 + yearNum;
  const yyyy = String(yearNum).padStart(4, "0");

  return `${yyyy}-${mm}-${d}`;
}

/** "06:03:00" (or "6:3" or "06:03") -> "HH:MM:SS" (no regex) */
export function normalizeTimeHHMMSS(input: string, rowIdx?: number): string {
  const t = (input || "").trim();
  const parts = t.split(":");
  if (parts.length < 2 || parts.length > 3) {
    throw new Error(
      `Row ${
        rowIdx ?? "?"
      }: "TimeSample" must be HH:MM[:SS] (e.g. 06:03:00). Got "${input}"`
    );
  }
  let [h, m, s] = parts;
  if (s == null) s = "00";

  const hhNum = Number(h);
  const mmNum = Number(m);
  const ssNum = Number(s);

  if (
    !Number.isInteger(hhNum) ||
    hhNum < 0 ||
    hhNum > 23 ||
    !Number.isInteger(mmNum) ||
    mmNum < 0 ||
    mmNum > 59 ||
    !Number.isInteger(ssNum) ||
    ssNum < 0 ||
    ssNum > 59
  ) {
    throw new Error(
      `Row ${rowIdx ?? "?"}: Invalid time "${input}" for TimeSample.`
    );
  }

  const hh = String(hhNum).padStart(2, "0");
  const mm = String(mmNum).padStart(2, "0");
  const ss = String(ssNum).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
