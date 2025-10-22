export interface EmailPayload {
  title: string;
  site_url: string;
  client_id: string;
  coa_id: string;
  recipient_name?: string;
  client_name?: string;
  site_name?: string;
  period_label?: string;
  header_image_url?: string;
  aqua_url?: string;
  alerts: Array<{
    id: string;
    parameter: string;
    time: string;
    site: string;
    floor: string;
    area: string;
    location: string;
    outlet: string;
    reading_value: number | string;
    unit_of_measurement: string;
    alert_condition: string;
    alert_value: number | string;
    note: string;
  }>;
}

function esc(s: unknown) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatIsoNoTz(iso: string): string {
  try {
    const [datePart, rawTime = ""] = iso.split(/[T\s]/);
    const [yyyy, mm, dd] = (datePart || "").split("-");

    let t = rawTime.replace(/(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/, "");
    const [H = "00", M = "00", S = "00"] = t.split(":");

    const hour24 = parseInt(H, 10);
    const suffix = hour24 >= 12 ? "pm" : "am";
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

    const hh = String(hour12).padStart(2, "0");
    const ss = S ?? "00";

    if (!yyyy || !mm || !dd) return iso;
    return `${dd}/${mm}/${yyyy} - ${hh}:${M}:${ss}${suffix}`;
  } catch {
    return iso;
  }
}

export function renderEmail(payload: EmailPayload) {
  const count = payload.alerts.length;
  const headerImg =
    payload.header_image_url ||
    "https://ocjoogbcpppcvnjzpjvb.supabase.co/storage/v1/object/public/logos/aqua_protec_logo.png";
  const recipient = payload.recipient_name || "there";
  const clientName = payload.client_name || "your client";
  const siteName = payload.site_name || "the site";
  const period = payload.period_label || "the selected period";
  const aquaUrl =
    payload.aqua_url ?? "https://aqua-protrack-production.pages.dev/";

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>${esc(payload.title)}</title>
      <meta name="x-apple-disable-message-reformatting" />
      <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no" />
    </head>
    <!--[if mso]>
      <style type="text/css">.fallback-font { font-family: Arial, Helvetica, sans-serif !important; }</style>
    <![endif]-->
    <body class="fallback-font" style="margin:0; padding:0; background:#f0f3f9;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
             style="width:100%; background: linear-gradient(180deg, #eef2f7, #f8f9fb); padding:40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0"
                   style="width:600px; max-width:600px; margin:0 auto;">
              <!-- Top image -->
              <tr>
                <td align="center" style="padding:0 20px 12px 20px;">
                  <img src="${esc(headerImg)}" alt="Aqua Protrack" width="200"
                       style="display:block; border:0; line-height:0; max-width:200px; height:auto;">
                </td>
              </tr>

              <!-- Headline [number] New Alerts -->
              <tr>
                <td align="center" style="padding:0 20px 20px 20px;">
                  <div style="font-family: Arial, Helvetica, sans-serif; font-size:24px; line-height:32px; color:#1b1b1f; font-weight:bold;">
                    ${esc(count)} New Alerts
                  </div>
                </td>
              </tr>

              <!-- White container -->
              <tr>
                <td style="padding:0 20px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                         style="background:#ffffff; border-radius:12px; box-shadow:0 1px 2px rgba(16,24,40,0.06);">
                    <tr>
                      <td style="padding:24px 24px 12px 24px; font-family: Arial, Helvetica, sans-serif;">
                        <div style="font-size:16px; color:#1b1b1f; margin:0 0 12px 0;">Hi ${esc(
                          recipient
                        )},</div>
                        <div style="font-size:16px; color:#1b1b1f; margin:0 0 12px 0;">
                          Here are the alerts for <strong>${esc(
                            clientName
                          )}</strong> at <strong>${esc(
    siteName
  )}</strong>, for the period of <strong>${esc(period)}</strong>.
                        </div>
                        <div style="font-size:14px; color:#1b1b1f; margin:0 0 16px 0;">
                          You can access Aqua Protrack online:
                          <a href="${esc(aquaUrl)}"
                            style="color:#264d9c; text-decoration:underline;"
                            title="Open Aqua Protrack">
                            Aqua Protrack Dashboard
                          </a>
                        </div>


                        <!-- Divider -->
                        <div style="height:1px; background:#e5e7eb; margin:12px 0;"></div>

                        ${renderCards(payload.alerts)}

                        <!-- Sign-off -->
                        <div style="margin-top:16px; font-size:14px; color:#1b1b1f;">
                          Best regards,<br/>The Aqua Protrack Team
                        </div>
                      </td>
                    </tr>

                    <!-- footer line inside white container -->
                    <tr>
                      <td style="padding:0 24px 24px 24px;">
                        <div style="height:1px; background:#e5e7eb; margin:8px 0 16px 0;"></div>
                        <div style="text-align:center; font-size:12px; color:#9ca3af; font-family: Arial, Helvetica, sans-serif;">
                          &copy; 2025 Aqua Protec
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr><td style="height:20px; line-height:20px;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

function renderCards(alerts: EmailPayload["alerts"]) {
  if (!alerts.length) {
    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="background:#ffffff; border:1px solid #e5e7eb; border-radius:10px; padding:20px; font-size:16px; color:#1b1b1f;">
            All good — no alerts to review.
          </td>
        </tr>
      </table>
    `;
  }
  return alerts.map((a) => renderAlertCard(a)).join("");
}

function renderAlertCard(a: EmailPayload["alerts"][number]) {
  const headerBg = "#d32f2f";
  const headerFg = "#ffffff";
  const border = "#e5e7eb";
  const locationLine = [a.site, a.floor, a.area, a.location, a.outlet]
    .filter(Boolean)
    .map(esc)
    .join(", ");

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 14px 0;">
    <tr>
      <td style="border:1px solid ${border}; border-radius:12px; overflow:hidden;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="background:${headerBg}; color:${headerFg}; padding:12px 16px; border-radius:12px 12px 0 0;">
              <div style="font-family: Arial, Helvetica, sans-serif; font-size:16px; font-weight:bold; margin:0 0 4px 0;">
                ${esc(a.parameter)} Result Alert
              </div>
              <div style="font-family: Arial, Helvetica, sans-serif; font-size:13px; font-weight:400; margin:0;">
                Alert on: ${esc(formatIsoNoTz(a.time))}
              </div>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="background:#ffffff; padding:16px; border-radius:0 0 12px 12px; font-family: Arial, Helvetica, sans-serif;">
              <div style="font-weight:bold; margin:0 0 6px 0; font-size:14px; color:#111827;">Alert information</div>
              <div style="margin:0 0 10px 0; font-size:14px; color:#111827; word-break:break-word; white-space:normal;">
                ${locationLine || "—"}
              </div>

              <div style="margin:10px 0; font-size:14px; color:#111827;">
                <div>
                  <strong>Received Value:</strong>
                  <span style="color:${headerBg}; font-weight:bold;">
                    ${esc(a.reading_value)}${
    a.unit_of_measurement ? esc(a.unit_of_measurement) : ""
  }
                  </span>
                </div>
                

              <div style="margin-top:12px;">
                <div style="font-weight:bold; margin-bottom:6px; font-size:14px; color:#111827;">Alert Note</div>
                <div style="background:#f8f9fb; border:1px solid ${border}; border-radius:6px; padding:10px 12px; font-size:13px; color:#1b1b1f;">
                  ${a.note ? esc(a.note) : "—"}
                </div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}
