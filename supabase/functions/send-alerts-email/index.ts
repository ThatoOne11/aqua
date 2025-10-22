import { createClient } from "npm:@supabase/supabase-js@2";
import { renderEmail, EmailPayload } from "./email-template.ts";
import { env } from "./lib/env.ts";
import { sendMail } from "./lib/mailer.ts";
import { fetchAlertsForCoa } from "./lib/data.ts";
import {
  cors,
  json,
  periodLabelFromTimes,
  minifyEmailHtml,
} from "./lib/utils.ts";
import { resolveRecipientsForCoaDetailed } from "./lib/recipients.ts";
import { buildCoaDeepLink } from "./lib/links.ts";

type ReqBody = {
  coa_id: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors() });

  try {
    const body = (await req.json()) as ReqBody;
    if (!body?.coa_id) return json({ error: "coa_id required" }, 400);

    const sb = createClient(env.SUPABASE_URL, env.SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    const recipients = await resolveRecipientsForCoaDetailed(sb, body.coa_id);

    const result = await fetchAlertsForCoa(sb, body.coa_id);

    const siteNameForSubject = result.site_name ?? "Unknown site";
    const subject = `Alerts for site: ${siteNameForSubject}`;

    const aquaUrl = buildCoaDeepLink(result.client_id, body.coa_id);

    const base: Omit<EmailPayload, "recipient_name"> = {
      title: subject,
      site_url: env.SITE_URL,
      client_id: result.client_id,
      coa_id: body.coa_id,
      client_name: result.client_name ?? "your client",
      site_name: result.site_name ?? "the site",
      period_label: periodLabelFromTimes(result.times),
      alerts: result.alerts,
      aqua_url: aquaUrl,
    };

    const sent_to: string[] = [];

    for (const r of recipients) {
      const payload: EmailPayload = {
        ...base,
        recipient_name: r.display_name ?? "there",
      };
      const html = minifyEmailHtml(renderEmail(payload));
      await sendMail({ to: [r.email], subject, html });
      sent_to.push(r.email);
    }

    return json({ ok: true, sent_to, count: base.alerts.length });
  } catch (e) {
    return json({ error: "Bad Request", details: String(e) }, 400);
  }
});
