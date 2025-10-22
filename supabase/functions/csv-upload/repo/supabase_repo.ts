import type { Mappings, Repo } from "./types.ts";
import type {
  CoaInsert,
  ReadingInsert,
  ReadingResultInsert,
} from "../types.ts";

export class SupabaseRepo implements Repo {
  constructor(private sb: any) {}

  async loadMappings(): Promise<Mappings> {
    const [
      paramResultResp,
      resultTypesResp,
      readingParamTypesResp,
      clientsResp,
      feedTypesResp,
      flushTypesResp,
    ] = await Promise.all([
      this.sb
        .from("parameter_result_mapping")
        .select("reading_parameter_type_id, result_type_id"),
      this.sb.from("result_types").select("id, field_name"),
      this.sb.from("reading_parameter_types").select("id, field_name"),
      this.sb.from("clients").select("id, display_name").eq("archived", false),
      this.sb.from("feed_types").select("id, field_name"),
      this.sb.from("flush_types").select("id, field_name"),
    ]);

    for (const resp of [
      paramResultResp,
      resultTypesResp,
      readingParamTypesResp,
      clientsResp,
      feedTypesResp,
      flushTypesResp,
    ]) {
      if (resp.error) throw resp.error;
    }

    const parameterResultMap = new Map<string, string[]>();
    for (const m of paramResultResp.data) {
      const arr = parameterResultMap.get(m.reading_parameter_type_id) ?? [];
      arr.push(m.result_type_id);
      parameterResultMap.set(m.reading_parameter_type_id, arr);
    }

    return {
      parameterResultMap,
      resultTypeIdToFieldName: new Map(
        resultTypesResp.data.map((r: any) => [r.id, r.field_name])
      ),
      paramNameToId: new Map(
        readingParamTypesResp.data.map((p: any) => [
          (p.field_name ?? "").toLowerCase(),
          p.id,
        ])
      ),
      clientNameToId: new Map(
        clientsResp.data.map((c: any) => [
          String(c.display_name ?? "").toLowerCase(),
          c.id,
        ])
      ),
      feedNameToId: new Map(
        feedTypesResp.data.map((f: any) => [
          (f.field_name ?? "").toLowerCase(),
          f.id,
        ])
      ),
      flushNameToId: new Map(
        flushTypesResp.data.map((f: any) => [
          (f.field_name ?? "").toLowerCase(),
          f.id,
        ])
      ),
    };
  }

  private siteCache = new Map<string, string>();
  private siteKey(clientId: string, name: string) {
    return `${clientId}::${name}`;
  }

  async ensureSiteId(
    clientId: string,
    siteName: string,
    createdBy: string
  ): Promise<string> {
    const key = this.siteKey(clientId, siteName);
    if (this.siteCache.has(key)) return this.siteCache.get(key)!;

    const existingSiteResp = await this.sb
      .from("sites")
      .select("id")
      .eq("client_id", clientId)
      .eq("name", siteName)
      .maybeSingle();
    if (existingSiteResp.error) throw existingSiteResp.error;
    if (existingSiteResp.data?.id) {
      this.siteCache.set(key, existingSiteResp.data.id);
      return existingSiteResp.data.id;
    }

    const insertSiteResp = await this.sb
      .from("sites")
      .insert({ client_id: clientId, name: siteName, created_by: createdBy })
      .select("id")
      .single();
    if (insertSiteResp.error) throw insertSiteResp.error;

    this.siteCache.set(key, insertSiteResp.data.id);
    return insertSiteResp.data.id;
  }

  async insertCOA(row: CoaInsert): Promise<string> {
    const insertCoaResp = await this.sb
      .from("certificate_of_analysis")
      .insert(row)
      .select("id")
      .single();
    if (insertCoaResp.error) throw insertCoaResp.error;
    return insertCoaResp.data.id;
  }

  async insertReadings(rows: ReadingInsert[]): Promise<string[]> {
    const insertReadingsResp = await this.sb
      .from("readings")
      .insert(rows)
      .select("id");
    if (insertReadingsResp.error) throw insertReadingsResp.error;
    return insertReadingsResp.data.map((r: any) => r.id);
  }

  async insertReadingResults(rows: ReadingResultInsert[]): Promise<void> {
    const insertReadingResultsResp = await this.sb
      .from("reading_results")
      .insert(rows);
    if (insertReadingResultsResp.error) throw insertReadingResultsResp.error;
  }

  // Look up an existing site id (no insert)
  async findSiteId(clientId: string, siteName: string): Promise<string | null> {
    const resp = await this.sb
      .from("sites")
      .select("id")
      .eq("client_id", clientId)
      .eq("name", siteName)
      .maybeSingle();
    if (resp.error) throw resp.error;
    return resp.data?.id ?? null;
  }

  // Use your view v_finalized_readings_norm; filter by client/site/date
  async fetchFinalizedReadingsForDate(args: {
    clientId: string;
    siteId: string;
    baseIsoDate: string; // "YYYY-MM-DD"
  }): Promise<
    Array<{
      time_utc: string; // "YYYY-MM-DD HH:MM:SS"
      floor_norm: string | null;
      area_norm: string | null;
      location_norm: string | null;
      outlet_norm: string | null;
      feed_type_id: string | null;
      flush_type_id: string | null;
    }>
  > {
    const resp = await this.sb
      .from("v_finalized_readings_norm")
      .select(
        "time_utc,floor_norm,area_norm,location_norm,outlet_norm,feed_type_id,flush_type_id"
      )
      .eq("client_id", args.clientId)
      .eq("site_id", args.siteId)
      .eq("reading_date", args.baseIsoDate); // view exposes reading_date (date)
    if (resp.error) throw resp.error;
    return resp.data ?? [];
  }
}
