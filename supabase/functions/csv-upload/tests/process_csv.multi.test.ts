import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { processCsv } from "../services/process_csv.ts";

// Minimal in-memory repo that matches what processCsv needs now
class CaptureRepo {
  // captured inserts
  public coa: any[] = [];
  public readings: any[] = [];
  public results: any[] = [];

  // ---- mappings (make sure field_name casing matches CSV headers) ----
  async loadMappings() {
    return {
      // parameter id -> required result type ids
      parameterResultMap: new Map<string, string[]>([
        // Legionella -> Temperature + LegionellaResult
        ["p_legionella", ["r_temp", "r_legionella"]],
        // TVC combo -> TVC37, TVC22, EColi, Coliform, Temperature
        [
          "p_tvc_combo",
          ["r_tvc37", "r_tvc22", "r_ecoli", "r_coliform", "r_temp"],
        ],
      ]),
      // result type id -> CSV header field_name (EXACT casing used in CSV)
      resultTypeIdToFieldName: new Map<string, string>([
        ["r_temp", "Temperature"],
        ["r_legionella", "LegionellaResult"],
        ["r_tvc37", "TVC37Result"],
        ["r_tvc22", "TVC22Result"],
        ["r_ecoli", "EColiResult"],
        ["r_coliform", "ColiformResult"],
      ]),
      // parameter field_name (lowercased key) -> id
      paramNameToId: new Map<string, string>([
        ["legionella", "p_legionella"],
        ["tvc e coli and coliform", "p_tvc_combo"],
      ]),
      // client display_name (lowercased) -> id
      clientNameToId: new Map<string, string>([["acme inc", "client-1"]]),
      // feed/flush field_name (lowercased) -> id
      feedNameToId: new Map<string, string>([["cold", "feed-cold"]]),
      flushNameToId: new Map<string, string>([["pre", "flush-pre"]]),
    };
  }

  // ---- site helper ----
  private siteId = "site-1";
  public ensureSiteIdCalls = 0;
  async ensureSiteId(clientId: string, siteName: string, _createdBy: string) {
    this.ensureSiteIdCalls++;
    return this.siteId;
  }

  // ---- inserts used by processCsv ----
  async insertCOA(row: any): Promise<string> {
    this.coa.push(row);
    return "coa-1";
  }

  async insertReadings(rows: any[]): Promise<string[]> {
    this.readings.push(...rows);
    return rows.map((_, i) => `reading-${i + 1}`);
  }

  async insertReadingResults(rows: any[]): Promise<void> {
    this.results.push(...rows);
  }

  // ---- unused by this test but required in some contexts ----
  // (processCsv doesn't call these; included to be future-proof)
  async findSiteId(
    _clientId: string,
    _siteName: string
  ): Promise<string | null> {
    return this.siteId;
  }
  async fetchFinalizedReadingsForDate(_args: {
    clientId: string;
    siteId: string;
    baseIsoDate: string;
  }): Promise<
    Array<{
      time_utc: string;
      floor_norm: string;
      area_norm: string;
      location_norm: string;
      outlet_norm: string;
      feed_type_id: string | null;
      flush_type_id: string | null;
    }>
  > {
    return [];
  }
}

Deno.test(
  "processCsv: 1 COA, many readings; times = base date + TimeSample; results only for numeric cells",
  async () => {
    const repo = new CaptureRepo();

    const CSV = `Client,SiteName,Parameters,Date,TimeSample,FeedType,FlushType,Temperature,LegionellaResult,TVC37Result,TVC22Result,EColiResult,ColiformResult
ACME Inc,Main,"Legionella, TVC E Coli and Coliform",29-Jan-25,06:03:00,cold,pre,20.1,5,10,15,,0
ACME Inc,Main,"Legionella, TVC E Coli and Coliform",29-Jan-25,07:12:30,cold,pre,21.0,ND,  ,25, 30, 40
`;

    await processCsv(CSV, "user-123", repo as any);

    // One COA
    assertEquals(repo.coa.length, 1);
    assertEquals(repo.coa[0].reading_date, "2025-01-29 00:00:00");
    assertEquals(repo.coa[0].client_id, "client-1");
    assertEquals(repo.ensureSiteIdCalls, 1);

    // Two readings
    assertEquals(repo.readings.length, 2);
    assertEquals(repo.readings[0].time, "2025-01-29 06:03:00");
    assertEquals(repo.readings[1].time, "2025-01-29 07:12:30");

    // Results: only numeric values are inserted
    // Row 1 numeric: Temperature, LegionellaResult, TVC37Result, T22, Coliform => 5
    // Row 2 numeric: Temperature, T22, EColi, Coliform (Legionella "ND" & TVC37 blank) => 4
    assertEquals(repo.results.length, 9);

    // Sanity: every result has a reading_id & a result_type_id
    assert(repo.results.every((r) => r.reading_id && r.result_type_id));
  }
);
