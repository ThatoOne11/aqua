import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { parseCsvToObjects } from "../lib/csv.ts";
import { splitParametersCell } from "../lib/parameters.ts";
import type { Repo } from "../repo/types.ts";
import { toIsoDateFromDDMonYY, normalizeTimeHHMMSS } from "../lib/datetime.ts";
import { checkForDuplicatesInUpload } from "./duplicates.ts";

/**
 * Validates:
 * - file exists and is CSV
 * - CSV parses into rows
 * - required headers exist (case-insensitive)
 * - result headers needed by the first-row Parameters exist (case-insensitive)
 *
 * Returns the RAW CSV TEXT so processCsv can parse as before.
 */

// normalize header/token for case-insensitive matching
function norm(s: string): string {
  // replace NBSP, collapse inner whitespace, trim, lowercase
  return s
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export async function validateFile(
  req: Request,
  repo: Repo
): Promise<{ csvText: string; fileName: string }> {
  // ---- Get file from multipart/form-data ----
  const formData = await req.formData();

  const file = formData.get("file") as File | null;
  if (!file) {
    throw new Error("CSV file not provided in the request.");
  }

  // ---- Basic CSV checks (name or MIME) ----
  const fileName = file.name ?? "upload.csv";
  const mimeType = file.type ?? "";
  const isCsvByExt = fileName.toLowerCase().endsWith(".csv");
  const isCsvByMime =
    mimeType.toLowerCase().includes("csv") || mimeType === "text/plain";
  if (!isCsvByExt && !isCsvByMime) {
    throw new Error(
      `Uploaded file must be a CSV (.csv). Got name="${fileName}", type="${mimeType}".`
    );
  }

  // ---- Read raw CSV text (this is what we will return) ----
  const csvText = await file.text();

  // ---- Parse once for validation only ----
  const rows = parseCsvToObjects(csvText);
  if (!rows.length) {
    throw new Error("CSV contains no data rows.");
  }

  // Headers from the first row’s keys
  const headers = Object.keys(rows[0]);

  // Build a case-insensitive map: normalized header -> actual header
  const headerLowerToActual = new Map(headers.map((h) => [norm(h), h]));

  // Helper that checks existence case-insensitively
  const hasHeaderCI = (name: string) => headerLowerToActual.has(norm(name));

  // ---- Load DB mappings (already lower-cased in your repo) ----
  const mappings = await repo.loadMappings();

  // ---- Zod validation for headers + dependent result headers ----
  const REQUIRED_HEADERS = [
    "Client",
    "SiteName",
    "Parameters",
    "Date", // COA date (e.g. 29-Jan-25)
    "TimeSample", // reading time (e.g. 06:03:00)
    "FeedType",
    "FlushType",
    "FloorLevel",
    "Area",
    "Location",
    "OutletType",
  ] as const;

  const requiredHeadersSchema = z
    .object({
      headers: z.array(z.string()).nonempty("No headers found"),
      rows: z.array(z.record(z.string())),
    })
    .superRefine((val, ctx) => {
      // 1) Required headers (case-insensitive)
      for (const key of REQUIRED_HEADERS) {
        const ok = hasHeaderCI(key);
        if (!ok) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Missing required header "${key}"`,
            path: ["headers"],
          });
        }
      }

      // 2) First-row Parameters must exist and map to known params
      const firstRow = val.rows[0] ?? {};
      // Resolve the actual "Parameters" key case-insensitively
      const parametersKey =
        headerLowerToActual.get(norm("Parameters")) ?? "Parameters";
      const paramsCell = firstRow[parametersKey] ?? "";
      const paramNames = splitParametersCell(paramsCell);

      if (paramNames.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `First row "Parameters" is required`,
          path: ["rows", 0, "Parameters"],
        });
        return;
      }

      // For each parameter, required result field_names must be present (case-insensitive)
      for (const p of paramNames) {
        const paramKey = norm(p);
        const pid = mappings.paramNameToId.get(paramKey);

        if (!pid) {
          console.warn("[validateFile] Unknown parameter (normalized):", {
            original: p,
            normalized: paramKey,
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Unknown parameter "${p}" in first row "Parameters"`,
            path: ["rows", 0, "Parameters"],
          });
          continue;
        }

        const requiredResIds = mappings.parameterResultMap.get(pid) ?? [];
        for (const rid of requiredResIds) {
          const expectedField = mappings.resultTypeIdToFieldName.get(rid); // may be "Temperature", "LegionellaResult", etc.
          const expectedKey = expectedField ? norm(expectedField) : null; // normalize to match our header map
          const present = expectedKey
            ? headerLowerToActual.has(expectedKey)
            : false;

          if (!expectedField) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Configuration error: result_type ${rid} missing field_name`,
              path: ["headers"],
            });
            continue;
          }

          if (!present) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Missing required result header "${expectedField}" for parameter "${p}"`,
              path: ["headers"],
            });
          }
        }
      }
    });

  // Run validation (throws with a zod error if invalid)
  requiredHeadersSchema.parse({ headers, rows });

  await checkForDuplicatesInUpload(rows, headerLowerToActual, repo, mappings);

  return { csvText, fileName };
}
