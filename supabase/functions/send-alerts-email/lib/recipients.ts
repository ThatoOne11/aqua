import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { env } from "./env.ts";

export interface Recipient {
  email: string;
  display_name?: string;
}

export async function resolveRecipientsForCoaDetailed(
  sb: SupabaseClient,
  coa_id: string
): Promise<Recipient[]> {
  const { data: coa, error: coaErr } = await sb
    .from("certificate_of_analysis")
    .select("site_id, uploaded_by")
    .eq("id", coa_id)
    .maybeSingle();
  if (coaErr) throw coaErr;

  const site_id: string | null = coa?.site_id ?? null;
  const uploader_id: string | null = coa?.uploaded_by ?? null;

  const userIds = new Set<string>();
  if (uploader_id) userIds.add(uploader_id);

  if (site_id) {
    const { data: mappings, error: mapErr } = await sb
      .from("user_site_mapping")
      .select("user_id")
      .eq("site_id", site_id);
    if (mapErr) throw mapErr;

    for (const m of mappings ?? []) {
      if (m?.user_id) userIds.add(m.user_id);
    }
  }

  if (userIds.size === 0) {
    return [{ email: env.ALERTS_TEST_TO }];
  }

  const { data: users, error: usersErr } = await sb
    .from("users")
    .select("id, email, display_name")
    .in("id", Array.from(userIds));
  if (usersErr) throw usersErr;

  const recipients = (users ?? [])
    .map((u) => ({
      email: (u?.email ?? "").trim().toLowerCase(),
      display_name: u?.display_name ?? undefined,
    }))
    .filter((r) => !!r.email);

  const unique = Array.from(
    new Map(recipients.map((r) => [r.email, r])).values()
  );

  return unique.length ? unique : [{ email: env.ALERTS_TEST_TO }];
}
