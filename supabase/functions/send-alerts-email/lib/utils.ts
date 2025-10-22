export function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors() },
  });
}

export function periodLabelFromTimes(times: string[]): string {
  if (!times?.length) return "the selected period";
  const d = (s: string) => (s || "").slice(0, 10);
  const sorted = [...times].sort();
  const first = d(sorted[0]);
  const last = d(sorted[sorted.length - 1]);
  return first === last ? first : `${first} – ${last}`;
}

export function minifyEmailHtml(s: string) {
  return s
    .replace(/[ \t]+(\r?\n)/g, "$1")
    .replace(/>\s+</g, "><")
    .trim();
}
