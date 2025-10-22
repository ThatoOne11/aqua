import { env } from "./env.ts";

/** Builds a deep link to the dashboard for the given client & COA. */
export function buildCoaDeepLink(clientId: string, coaId: string): string {
  const origin = (env.FRONTEND_BASE_URL || env.SITE_URL).replace(/\/+$/, "");
  return `${origin}/client-management/dashboard/${encodeURIComponent(
    clientId
  )}?coaId=${encodeURIComponent(coaId)}`;
}
