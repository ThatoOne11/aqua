import type {
  CoaInsert,
  ReadingInsert,
  ReadingResultInsert,
} from "../types.ts";

export type Mappings = {
  parameterResultMap: Map<string, string[]>;
  resultTypeIdToFieldName: Map<string, string>;
  paramNameToId: Map<string, string>;
  clientNameToId: Map<string, string>;
  feedNameToId: Map<string, string>;
  flushNameToId: Map<string, string>;
};

export type Repo = {
  insertCOA(row: CoaInsert): Promise<string>;
  loadMappings(): Promise<Mappings>;
  ensureSiteId(
    clientId: string,
    siteName: string,
    createdBy: string
  ): Promise<string>;
  insertReadings(rows: ReadingInsert[]): Promise<string[]>;
  insertReadingResults(rows: ReadingResultInsert[]): Promise<void>;

  findSiteId(clientId: string, siteName: string): Promise<string | null>;
  fetchFinalizedReadingsForDate(args: {
    clientId: string;
    siteId: string;
    baseIsoDate: string; // "YYYY-MM-DD"
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
  >;
};
