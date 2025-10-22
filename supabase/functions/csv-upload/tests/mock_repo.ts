import type { Repo, Mappings } from "../repo/types.ts";
import type {
  CoaInsert,
  ReadingInsert,
  ReadingResultInsert,
} from "../types.ts";

/** Matches the Repo interface's fetchFinalizedReadingsForDate return shape */
type FinalizedRow = {
  time_utc: string; // "YYYY-MM-DD HH:MM:SS"
  floor_norm: string; // non-null string
  area_norm: string; // non-null string
  location_norm: string; // non-null string
  outlet_norm: string; // non-null string
  feed_type_id: string | null;
  flush_type_id: string | null;
};

export class MockRepo implements Repo {
  // captured inserts
  public insertedCoas: CoaInsert[] = [];
  public insertedReadings: ReadingInsert[] = [];
  public insertedReadingResults: ReadingResultInsert[] = [];

  private siteCache = new Map<string, string>();

  constructor(
    private mappingsOverride: Partial<Mappings> = {},
    private options: {
      siteId?: string | null;
      finalized?: FinalizedRow[]; // <-- non-null strings for the *_norm fields
    } = {}
  ) {}

  private siteKey(clientId: string, name: string) {
    return `${clientId}::${name}`;
  }

  async loadMappings(): Promise<Mappings> {
    const LEGIONELLA_PARAM_ID = "10000000-0000-0000-0000-000000000004";
    const RESULT_TEMP_ID = "20000000-0000-0000-0000-000000000001";
    const RESULT_LEG_ID = "20000000-0000-0000-0000-000000000006";

    const defaults: Mappings = {
      parameterResultMap: new Map([
        [LEGIONELLA_PARAM_ID, [RESULT_TEMP_ID, RESULT_LEG_ID]],
      ]),
      resultTypeIdToFieldName: new Map([
        [RESULT_TEMP_ID, "Temperature"],
        [RESULT_LEG_ID, "LegionellaResult"],
      ]),
      paramNameToId: new Map([
        ["legionella", LEGIONELLA_PARAM_ID],
        ["tvc e coli and coliform", "10000000-0000-0000-0000-000000000001"],
      ]),
      clientNameToId: new Map([["acme hospital", "c-acme-uuid"]]),
      feedNameToId: new Map([
        ["cold", "feed-cold-id"],
        ["hot", "feed-hot-id"],
        ["mixed", "feed-mixed-id"],
      ]),
      flushNameToId: new Map([
        ["pre", "flush-pre-id"],
        ["post", "flush-post-id"],
        ["stored", "flush-stored-id"],
      ]),
    };

    return {
      ...defaults,
      ...this.mappingsOverride,
      parameterResultMap:
        this.mappingsOverride.parameterResultMap ?? defaults.parameterResultMap,
      resultTypeIdToFieldName:
        this.mappingsOverride.resultTypeIdToFieldName ??
        defaults.resultTypeIdToFieldName,
      paramNameToId:
        this.mappingsOverride.paramNameToId ?? defaults.paramNameToId,
      clientNameToId:
        this.mappingsOverride.clientNameToId ?? defaults.clientNameToId,
      feedNameToId: this.mappingsOverride.feedNameToId ?? defaults.feedNameToId,
      flushNameToId:
        this.mappingsOverride.flushNameToId ?? defaults.flushNameToId,
    };
  }

  async ensureSiteId(clientId: string, siteName: string, createdBy: string) {
    const k = this.siteKey(clientId, siteName);
    if (!this.siteCache.has(k))
      this.siteCache.set(k, `site-${clientId}-${siteName}`);
    return this.siteCache.get(k)!;
  }

  async findSiteId(
    _clientId: string,
    _siteName: string
  ): Promise<string | null> {
    return this.options.siteId ?? null;
  }

  async fetchFinalizedReadingsForDate(_args: {
    clientId: string;
    siteId: string;
    baseIsoDate: string; // "YYYY-MM-DD"
  }): Promise<FinalizedRow[]> {
    const rows = this.options.finalized ?? [];
    // keep a simple date filter to mirror the view behavior
    return rows.filter((r) => r.time_utc.startsWith(_args.baseIsoDate));
  }

  async insertCOA(row: CoaInsert): Promise<string> {
    this.insertedCoas.push(row);
    return `coa-${this.insertedCoas.length}`;
  }

  async insertReadings(rows: ReadingInsert[]): Promise<string[]> {
    this.insertedReadings.push(...rows);
    return rows.map((_, i) => `reading-${i + 1}`);
  }

  async insertReadingResults(rows: ReadingResultInsert[]): Promise<void> {
    this.insertedReadingResults.push(...rows);
  }
}
