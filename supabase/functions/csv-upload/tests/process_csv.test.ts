import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { processCsv } from "../services/process_csv.ts";
import { MockRepo } from "./mock_repo.ts";

// Small realistic CSV (Legionella only)
const CSV = `Client,SiteName,Date,Parameters,FeedType,FlushType,TimeSample,Temperature,LegionellaResult,FloorLevel,Area,Location,OutletType
ACME Hospital,Main Campus,29-Jan-25,Legionella,Cold,Pre,06:00:00,18.2,10,,,,
,,,,Cold,Pre,06:15:00,19.1,,1,East,Corridor,TAP
,,,,Cold,Pre,06:30:00,20.0,<1,,,,
`;

Deno.test(
  "processCsv inserts 1 COA, N readings, and numeric reading_results only",
  async () => {
    const repo = new MockRepo(); // defaults map Legionella -> Temp + LegionellaResult

    await processCsv(CSV, "user-123", repo);

    // 1) One COA, linked to row-1 metadata
    assertEquals(repo.insertedCoas.length, 1);
    const coa = repo.insertedCoas[0];
    assertEquals(coa.client_id, "c-acme-uuid");
    assertExists(coa.site_id);
    assertEquals(coa.reading_parameter_type_ids.length, 1); // only Legionella
    assertEquals(coa.reading_date, "2025-01-29 00:00:00"); // default time from row-1 Date

    // 2) Readings: one per CSV row (3 data rows)
    assertEquals(repo.insertedReadings.length, 3);
    // Times composed from Date + TimeSample
    assertEquals(repo.insertedReadings[0].time, "2025-01-29 06:00:00");
    assertEquals(repo.insertedReadings[1].time, "2025-01-29 06:15:00");
    assertEquals(repo.insertedReadings[2].time, "2025-01-29 06:30:00");

    // 3) reading_results: Temperature present in all rows (3),
    //    LegionellaResult present in row1 (10) and row3 ("<1" => numeric 1) => 2 more
    //    Total expected: 5
    assertEquals(repo.insertedReadingResults.length, 5);

    // Check a couple of values landed as numbers
    const values = repo.insertedReadingResults
      .map((r) => r.value)
      .sort((a, b) => a - b);
    assertEquals(
      values,
      [1, 10, 18.2, 19.1, 20.0].sort((a, b) => a - b)
    );
  }
);
