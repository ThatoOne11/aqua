const required = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USERNAME",
  "SMTP_PASSWORD",
  "SMTP_FROM",
] as const;

for (const k of required) {
  if (!Deno.env.get(k)) throw new Error(`Missing required env: ${k}`);
}

export const env = {
  SUPABASE_URL: Deno.env.get("SUPABASE_URL")!,
  SERVICE_ROLE: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  SITE_URL: Deno.env.get("SITE_URL") ?? "http://localhost:4200",
  FRONTEND_BASE_URL: Deno.env.get("FRONTEND_BASE_URL") ?? "",
  SMTP_HOST: Deno.env.get("SMTP_HOST")!,
  SMTP_PORT: Number(Deno.env.get("SMTP_PORT")) || 465,
  SMTP_USERNAME: Deno.env.get("SMTP_USERNAME")!,
  SMTP_PASSWORD: Deno.env.get("SMTP_PASSWORD")!,
  SMTP_FROM: Deno.env.get("SMTP_FROM")!, // bare email
  ALERTS_TEST_TO:
    Deno.env.get("ALERTS_TEST_TO") ?? "alerts-preview@example.com",
} as const;
