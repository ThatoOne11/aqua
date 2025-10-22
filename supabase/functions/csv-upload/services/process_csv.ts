import { parseCsvToObjects } from "../lib/csv.ts";
import { toIsoDateFromDDMonYY, normalizeTimeHHMMSS } from "../lib/datetime.ts";
import { splitParametersCell } from "../lib/parameters.ts";
import { parseNumericFromCell } from "../lib/numbers.ts";
import type {
  CoaInsert,
  ReadingInsert,
  ReadingResultInsert,
} from "../types.ts";
import type { Repo, Mappings } from "../repo/types.ts";

// Single source of truth for pending status UUID
const COA_STATUS_PENDING_ID = "b354c5de-c40b-4c4a-a0ac-ff3009466545" as const;

/**
 * Consumes a raw CSV string (already validated by validateFile),
 * persists a single COA for the whole file, then one Reading per row,
 * and finally numeric reading_results that correspond to the parameters’
 * required result types.
 */
export async function processCsv(
  csvText: string,
  uploadedByUserId: string | null,
  repo: Repo,
  fileName?: string
): Promise<string> {
  // Parse CSV rows
  const rows = parseCsvToObjects(csvText);
  if (!rows.length) throw new Error("CSV contains no data rows.");

  // Load DB mappings (field_name-based)
  const mappings = await repo.loadMappings();

  // Build inserts for ONE COA + MANY readings for this file
  const { coaInsert, readingInserts, readingResults } = await buildInserts(
    rows,
    uploadedByUserId,
    mappings,
    repo,
    fileName
  );

  // 1) Insert the single COA
  const coaId = await repo.insertCOA(coaInsert);

  // 2) Insert readings linked to that COA
  for (let i = 0; i < readingInserts.length; i++) {
    readingInserts[i].certificate_of_analysis_id = coaId;
  }
  const readingIds = await repo.insertReadings(readingInserts);

  // 3) Insert reading_results linked to each reading
  for (let i = 0; i < readingResults.length; i++) {
    for (const rr of readingResults[i]) rr.reading_id = readingIds[i];
  }
  const flat = readingResults.flat();
  if (flat.length) await repo.insertReadingResults(flat);

  return coaId;
}

async function buildInserts(
  rows: Array<Record<string, string>>,
  uploadedByUserId: string | null,
  m: Mappings,
  repo: Repo,
  fileName?: string
): Promise<{
  coaInsert: CoaInsert; // single COA
  readingInserts: ReadingInsert[]; // per-row readings
  readingResults: ReadingResultInsert[][];
}> {
  const first = rows[0];
  let errors: Error[] = [];

  const headerLowerToActual = new Map(
    Object.keys(first).map((h) => [h.toLowerCase(), h])
  );
  const headers = Array.from(headerLowerToActual.values());

  const rawSnapshot = {
    headers, // Object.keys(rows[0] ?? {})
    rows, // the full parsed CSV as an array of row objects
  };

  // Check required columns
  const baseDateRaw = (first["Date"] ?? "").trim();
  if (!baseDateRaw)
    errors.push(new Error(`Row 2: "Date" is required in the first row`));

  const clientName = (first["Client"] ?? "").trim();
  if (!clientName) errors.push(new Error(`Row 2: "Client" is required`));

  const siteName = (first["SiteName"] ?? "").trim();
  if (!siteName) errors.push(new Error(`Row 2: "SiteName" is required`));

  const paramsCell = (first["Parameters"] ?? "").trim();
  const paramNames = splitParametersCell(paramsCell);
  if (!paramNames.length)
    errors.push(new Error(`Row 2: "Parameters" is required`));

  if (errors.length > 0) {
    throw errors;
  } else {
    errors = [];
  }

  // Base date for the file (e.g. "29-Jan-25" -> "YYYY-MM-DD")
  const baseIsoDate = toIsoDateFromDDMonYY(baseDateRaw, 2); // "YYYY-MM-DD"
  const coaDateTime = `${baseIsoDate} 00:00:00`; // default time at midnight

  // Client / Site (COA-level)
  const clientId = m.clientNameToId.get(clientName.toLowerCase());
  if (!clientId)
    errors.push(new Error(`Row 2: Unknown Client "${clientName}"`));

  // Parameters (COA-level; taken from row 1)
  const paramIds: string[] = [];
  for (const p of paramNames) {
    const key = p.toLowerCase(); // <-- normalize to lowercase
    const id = m.paramNameToId.get(key);
    if (!id) {
      errors.push(new Error(`Row 2: Unknown parameter "${p}"`));
    } else {
      paramIds.push(id);
    }
  }

  // Required result types for those params (already validated by validateFile to exist as headers)
  const requiredResultTypeIds = new Set<string>();
  for (const pid of paramIds) {
    const required = m.parameterResultMap.get(pid) ?? [];
    required.forEach((rid) => requiredResultTypeIds.add(rid));
  }

  // ---------- Build readings for ALL rows ----------
  const readingInserts: ReadingInsert[] = rows.map((row, i) => {
    const idx = i + 2; // CSV row number (header is row 1)

    // Per-row time (e.g., "06:03:00") from "TimeSample"
    const timeRaw = (row["TimeSample"] ?? "").trim();
    if (!timeRaw)
      errors.push(new Error(`Row ${idx}: "TimeSample" is required`));
    const timeIso = normalizeTimeHHMMSS(timeRaw, idx); // "HH:MM:SS"
    const readingTs = `${baseIsoDate} ${timeIso}`; // "YYYY-MM-DD HH:MM:SS"

    const floorName = (row["FloorLevel"] ?? "").trim();

    const areaName = (row["Area"] ?? "").trim();

    const locationName = (row["Location"] ?? "").trim();
    if (!locationName)
      errors.push(new Error(`Row ${idx}: "Location" is required`));

    const outletName = (row["OutletType"] ?? "").trim();
    if (!outletName)
      errors.push(new Error(`Row ${idx}: "OutletType" is required`));

    // Per-row feed/flush
    const feedName = (row["FeedType"] ?? "").trim();
    if (!feedName) errors.push(new Error(`Row ${idx}: "FeedType" is required`));
    const feedTypeId = m.feedNameToId.get(feedName.toLowerCase());
    if (!feedTypeId)
      errors.push(new Error(`Row ${idx}: Unknown FeedType "${feedName}"`));

    const flushName = (row["FlushType"] ?? "").trim();
    if (!flushName)
      errors.push(new Error(`Row ${idx}: "FlushType" is required`));
    const flushTypeId = m.flushNameToId.get(flushName.toLowerCase());
    if (!flushTypeId)
      errors.push(new Error(`Row ${idx}: Unknown FlushType "${flushName}"`));
    const provided_id = (row["ID"] ?? "").trim();

    return {
      time: readingTs,
      floor: floorName,
      area: areaName,
      location: locationName,
      outlet: outletName,
      feed_type_id: feedTypeId!,
      flush_type_id: flushTypeId!,
      provided_id: provided_id || null,
    };
  });

  if (errors.length > 0) throw errors;

  // ---------- Build ONE COA insert ----------
  const siteId = await repo.ensureSiteId(
    clientId!,
    siteName,
    uploadedByUserId ?? ""
  );

  const coaInsert: CoaInsert = {
    uploaded_by: uploadedByUserId ?? null,
    client_id: clientId!,
    site_id: siteId,
    reading_parameter_type_ids: paramIds,
    reading_date: coaDateTime,
    status_id: COA_STATUS_PENDING_ID,
    raw_data: rawSnapshot, // audit snapshot
    file_name: fileName ?? null,
    username: first["Username"] ?? null,
    project_manager: first["ProjectManager"] ?? null,
    job_reference: first["JobReference"] ?? null,
    team_leader: first["TeamLeader"] ?? null,
    zeta_safe_client_id: first["ZetaSafeClientID"] ?? null,
    zeta_safe_client_api: first["ZetaSafeClientAPI"] ?? null,
  };

  // ---------- Build reading_results for each row ----------
  const readingResults: ReadingResultInsert[][] = rows.map((row) => {
    const inserts: ReadingResultInsert[] = [];
    const comments = (row["Comment"] ?? "").trim() || null;
    for (const rid of requiredResultTypeIds) {
      const fieldLower = m.resultTypeIdToFieldName.get(rid); // may be lowercased
      if (!fieldLower) continue;
      const actualKey =
        headerLowerToActual.get(fieldLower.toLowerCase()) ?? fieldLower;
      // Accounting for bad numeric data
      const num = parseNumericFromCell(
        row[actualKey as keyof typeof row] as unknown as string
      );
      if (num === null) continue;
      inserts.push({
        result_type_id: rid,
        reading_id: "",
        value: num,
        comments: comments,
      });
    }
    return inserts;
  });

  return { coaInsert, readingInserts, readingResults };
}
