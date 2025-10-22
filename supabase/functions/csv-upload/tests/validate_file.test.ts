import {
  assertEquals,
  assertRejects,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ZodError } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { validateFile } from "../services/validate_file.ts";
import { MockRepo } from "./mock_repo.ts";

// --- CSV fixtures ------------------------------------------------------------

// Minimal valid CSV for parameter "Legionella".
// Required headers (case-insensitive): Client, SiteName, Parameters, Date, TimeSample, FeedType, FlushType
// Required result headers (by mapping): Temperature, LegionellaResult
const VALID_CSV = `Client,SiteName,Parameters,Date,TimeSample,FeedType,FlushType,Temperature,LegionellaResult
ACME Corp,Site A,Legionella,29-Jan-25,06:03:00,cold,pre,12.3,45
`;

// Same as valid CSV but *missing* the "LegionellaResult" column to force a mapping-based failure.
const MISSING_RESULT_HEADER = `Client,SiteName,Parameters,Date,TimeSample,FeedType,FlushType,Temperature
ACME Corp,Site A,Legionella,29-Jan-25,06:03:00,cold,pre,12.3
`;

// --- Helpers ----------------------------------------------------------------

// Build a Request with multipart/form-data containing the CSV file.
function makeRequest(
  csv: string,
  filename = "test.csv",
  mime = "text/csv"
): Request {
  const fd = new FormData();
  fd.append("file", new File([csv], filename, { type: mime }));
  return new Request("http://localhost/upload", { method: "POST", body: fd });
}

// --- Tests ------------------------------------------------------------------

Deno.test("validateFile returns raw CSV text for valid files", async () => {
  const req = makeRequest(VALID_CSV);
  const result = await validateFile(req, new MockRepo());
  // validateFile returns the *raw* CSV text
  assertEquals(result.csvText, VALID_CSV);
});

Deno.test(
  "validateFile fails if required result header missing (from Parameters mapping)",
  async () => {
    const req = makeRequest(MISSING_RESULT_HEADER);

    try {
      await validateFile(req, new MockRepo());
      throw new Error("Function did not throw");
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "Function did not throw") throw e;

      // Case 1: ZodError with issues array
      if (e instanceof ZodError) {
        const combined = e.issues
          .map((i) => String(i.message ?? ""))
          .join("\n")
          .toLowerCase();
        assertStringIncludes(
          combined,
          'missing required result header "legionellaresult"'
        );
        return;
      }

      // Case 2: Our validator may throw a JSON-stringified issues array
      const msg = String((e as any)?.message ?? "");
      try {
        const parsed = JSON.parse(msg);
        if (Array.isArray(parsed)) {
          const combined = parsed
            .map((i: any) => String(i?.message ?? ""))
            .join("\n")
            .toLowerCase();
          assertStringIncludes(
            combined,
            'missing required result header "legionellaresult"'
          );
          return;
        }
      } catch {
        // Not JSON, fall through
      }

      // Case 3: Fallback to plain substring check
      assertStringIncludes(
        msg.toLowerCase(),
        'missing required result header "legionellaresult"'
      );
    }
  }
);

Deno.test("validateFile enforces CSV filetype by ext or mime", async () => {
  // Neither .csv extension nor a CSV-ish MIME -> should fail
  const badReq = makeRequest(VALID_CSV, "file.bin", "application/octet-stream");
  await assertRejects(
    () => validateFile(badReq, new MockRepo()),
    Error,
    "must be a CSV"
  );
});
