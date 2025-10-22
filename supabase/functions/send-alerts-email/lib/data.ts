// supabase/functions/send-alerts-email/lib/data.ts
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { EmailPayload } from "../email-template.ts";

interface ReadingAlertJoined {
  reading_id: string;
  result_type_id: string;
  reading_value: number;
  alert_value: number;
  alert_condition: string;
  note: string | null;
  ignored: boolean;
  reading_result_id: string | null;
  reading_results: { id: string; value: number | null } | null;
  result_types: {
    display_name: string | null;
    unit_of_measurement: string | null;
  } | null;
  readings: {
    time: string;
    floor: string | null;
    area: string | null;
    location: string | null;
    outlet: string | null;
    certificate_of_analysis_id: string;
    certificate_of_analysis: {
      id: string;
      client_id: string;
      site_id: string | null;
      clients: { id: string; display_name: string | null } | null;
      sites: { id: string; name: string | null } | null;
    } | null;
  } | null;
}

interface CoaRow {
  id: string;
  client_id: string;
  site_id: string | null;
  clients: { display_name: string | null } | null;
  sites: { name: string | null } | null;
}

export async function fetchAlertsForCoa(
  sb: SupabaseClient,
  coa_id: string
): Promise<{
  client_id: string;
  client_name?: string | null;
  site_name?: string | null;
  alerts: EmailPayload["alerts"];
  times: string[];
}> {
  const { data, error } = await sb
    .from<ReadingAlertJoined>("reading_alert")
    .select(
      `
      reading_id,
      result_type_id,
      reading_value,
      alert_value,
      alert_condition,
      note,
      ignored,
      reading_result_id,
      readings!inner (
        time,
        floor,
        area,
        location,
        outlet,
        certificate_of_analysis_id,
        certificate_of_analysis:certificate_of_analysis_id (
          id,
          client_id,
          site_id,
          clients:client_id ( id, display_name ),
          sites:site_id ( id, name )
        )
      ),
      reading_results:reading_result_id ( id, value ),
      result_types:result_type_id ( display_name, unit_of_measurement )
    `
    )
    .eq("ignored", false)
    .eq("readings.certificate_of_analysis_id", coa_id)
    .order("time", { foreignTable: "readings", ascending: false });

  if (error) throw error;

  const rows = data ?? [];

  let client_id = rows[0]?.readings?.certificate_of_analysis?.client_id;
  let client_name =
    rows[0]?.readings?.certificate_of_analysis?.clients?.display_name ?? null;
  let site_name =
    rows[0]?.readings?.certificate_of_analysis?.sites?.name ?? null;

  if (!client_id) {
    const { data: coa, error: coaErr } = await sb
      .from<CoaRow>("certificate_of_analysis")
      .select(
        "id, client_id, site_id, clients:client_id(display_name), sites:site_id(name)"
      )
      .eq("id", coa_id)
      .maybeSingle();
    if (coaErr) throw coaErr;

    client_id = coa?.client_id;
    client_name = coa?.clients?.display_name ?? client_name;
    site_name = coa?.sites?.name ?? site_name;
  }

  if (!client_id) throw new Error("Client ID not found for COA");

  const alerts: EmailPayload["alerts"] = rows.map((r) => {
    const read = r.readings;
    const unit = r.result_types?.unit_of_measurement ?? "";
    const readingVal = r.reading_value ?? r.reading_results?.value ?? "";

    return {
      id: r.reading_result_id ?? r.reading_id,
      parameter: r.result_types?.display_name ?? "Parameter",
      time: read?.time ?? "",
      site: read?.certificate_of_analysis?.sites?.name ?? "",
      floor: read?.floor ?? "",
      area: read?.area ?? "",
      location: read?.location ?? "",
      outlet: read?.outlet ?? "",
      reading_value: String(readingVal),
      unit_of_measurement: unit,
      alert_condition: r.alert_condition,
      alert_value: r.alert_value,
      note: r.note ?? "",
    };
  });

  const times = rows
    .map((r) => r.readings?.time)
    .filter((t): t is string => !!t);

  return { client_id, client_name, site_name, alerts, times };
}
