import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { env } from "./env.ts";

export async function sendMail({
  to,
  subject,
  html,
  from = env.SMTP_FROM,
}: {
  to: string[];
  subject: string;
  html: string;
  from?: string;
}) {
  const client = new SMTPClient({
    connection: {
      hostname: env.SMTP_HOST,
      port: env.SMTP_PORT, // 465
      tls: true,
      auth: { username: env.SMTP_USERNAME, password: env.SMTP_PASSWORD },
    },
  });

  try {
    await client.send({
      from,
      to,
      subject,
      html,
    });
  } finally {
    try {
      await client.close();
    } catch {}
  }
}
