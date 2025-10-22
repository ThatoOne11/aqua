import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import type { Repo, Mappings } from "../repo/types.ts";
import { toIsoDateFromDDMonYY, normalizeTimeHHMMSS } from "../lib/datetime.ts";

// Local normalizer (match validate_file.ts behavior)
function norm(s: string): string {
  return s
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Checks for duplicate readings in the CSV (within the CSV and against DB finalized readings).
 * Throws an Error(JSON-stringified Zod-like issues) when duplicates are found.
 */
export async function checkForDuplicatesInUpload(
  rows: Array<Record<string, string>>,
  headerLowerToActual: Map<string, string>,
  repo: Repo,
  mappings: Mappings
): Promise<void> {
  if (!rows.length) return;

  // Resolve actual header keys (case-insensitive)
  const clientKey = headerLowerToActual.get(norm("Client")) ?? "Client";
  const siteKey = headerLowerToActual.get(norm("SiteName")) ?? "SiteName";
  const dateKey = headerLowerToActual.get(norm("Date")) ?? "Date";
  const timeKey = headerLowerToActual.get(norm("TimeSample")) ?? "TimeSample";
  const feedKey = headerLowerToActual.get(norm("FeedType")) ?? "FeedType";
  const flushKey = headerLowerToActual.get(norm("FlushType")) ?? "FlushType";
  const floorKey = headerLowerToActual.get(norm("FloorLevel")) ?? "FloorLevel";
  const areaKey = headerLowerToActual.get(norm("Area")) ?? "Area";
  const locationKey = headerLowerToActual.get(norm("Location")) ?? "Location";
  const outletKey = headerLowerToActual.get(norm("OutletType")) ?? "OutletType";

  const first = rows[0];

  // Resolve client & site (case-insensitive client match)
  const clientName = String(first[clientKey] ?? "")
    .trim()
    .toLowerCase();
  const siteName = String(first[siteKey] ?? "").trim();

  // If we can't resolve these, skip duplicate check (validate_file already enforces presence)
  if (!clientName || !siteName) return;

  const clientId = mappings.clientNameToId.get(clientName);
  if (!clientId) return; // unknown client -> skip

  const siteId = await repo.findSiteId(clientId, siteName);
  if (!siteId) return; // site not in DB -> nothing finalized to clash with

  // Base date from row 1 (e.g. "29-Jan-25") -> "YYYY-MM-DD"
  const baseDateRaw = String(first[dateKey] ?? "").trim();
  const baseIsoDate = toIsoDateFromDDMonYY(baseDateRaw, 2);

  // Fetch existing finalized readings for that client/site/day via view
  const existing = await repo.fetchFinalizedReadingsForDate({
    clientId,
    siteId,
    baseIsoDate,
  });

  // Build a Set of composite keys from DB; time_utc already "YYYY-MM-DD HH:MM:SS"
  const dbKeys = new Set(
    existing.map((r) =>
      [
        r.time_utc, // EXACT format from view
        r.floor_norm ?? "",
        r.area_norm ?? "",
        r.location_norm ?? "",
        r.outlet_norm ?? "",
        r.feed_type_id ?? "",
        r.flush_type_id ?? "",
      ].join("|")
    )
  );

  // Helper: build a normalized key for a CSV row using the same format as the view
  const toKey = (row: Record<string, string>, rowNumForErrors: number) => {
    const timeRaw = String(row[timeKey] ?? "").trim();
    if (!timeRaw)
      throw new Error(`Row ${rowNumForErrors}: "TimeSample" is required`);

    const hhmmss = normalizeTimeHHMMSS(timeRaw, rowNumForErrors); // "HH:MM:SS"
    const timeUtcText = `${baseIsoDate} ${hhmmss}`; // EXACTLY match view format

    const floor = String(row[floorKey] ?? "")
      .trim()
      .toLowerCase();
    const area = String(row[areaKey] ?? "")
      .trim()
      .toLowerCase();
    const location = String(row[locationKey] ?? "")
      .trim()
      .toLowerCase();
    const outlet = String(row[outletKey] ?? "")
      .trim()
      .toLowerCase();

    const feedName = String(row[feedKey] ?? "")
      .trim()
      .toLowerCase();
    const flushName = String(row[flushKey] ?? "")
      .trim()
      .toLowerCase();

    const feedId = mappings.feedNameToId.get(feedName) ?? "";
    const flushId = mappings.flushNameToId.get(flushName) ?? "";

    return [timeUtcText, floor, area, location, outlet, feedId, flushId].join(
      "|"
    );
  };

  // Detect duplicates within CSV and against DB
  const seen = new Map<string, number>();
  const dupWithinCsv: number[] = [];
  const dupAgainstDb: number[] = [];

  rows.forEach((row, i) => {
    const rowNum = i + 2; // header = row 1
    const key = toKey(row, rowNum);

    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count > 1) dupWithinCsv.push(rowNum);

    if (dbKeys.has(key)) dupAgainstDb.push(rowNum);
  });

  if (dupWithinCsv.length || dupAgainstDb.length) {
    const issues: z.ZodIssue[] = [];
    if (dupWithinCsv.length) {
      issues.push({
        code: "custom",
        message: `This upload has duplicate rows from an existing COA at lines: ${dupWithinCsv.join(
          ", "
        )}`,
        path: ["rows"],
      });
    }
    if (dupAgainstDb.length) {
      issues.push({
        code: "custom",
        message: `This upload has duplicate rows from an existing COA at lines: ${dupAgainstDb.join(
          ", "
        )}`,
        path: ["rows"],
      });
    }
    throw new z.ZodError(issues);
  }
}
