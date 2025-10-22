import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtDecode, type JwtPayload } from "https://esm.sh/jwt-decode@4";
import { corsHeaders } from "../_shared/cors.ts";
import { ResponseObject, ResponseStatuses } from "../_shared/models.ts";
import { processCsv } from "./services/process_csv.ts";
import { SupabaseRepo } from "./repo/supabase_repo.ts";
import { validateFile } from "./services/validate_file.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ===== REQUIRED AUTH =====
    const authHeader = req.headers.get("Authorization") ?? "";

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";

    // Decode quickly to check role claim and get user id from `sub`
    let decoded: JwtPayload & { user_role?: string };
    try {
      decoded = jwtDecode<JwtPayload & { user_role?: string }>(token);
    } catch {
      const resp = ResponseObject.parse({
        Message: "Unauthorized",
        HasErrors: true,
        Error: "Invalid token.",
      });
      return new Response(JSON.stringify(resp), {
        ...ResponseStatuses.Unauthorised,
        status: 403,
        headers: corsHeaders,
      });
    }

    const role = (decoded.user_role ?? "").toLowerCase();
    if (role !== "admin" && role !== "super-admin") {
      const resp = ResponseObject.parse({
        Message: "Unauthorized",
        HasErrors: true,
        Error: "Forbidden: admin or super-admin required.",
      });
      return new Response(JSON.stringify(resp), {
        ...ResponseStatuses.Unauthorised,
        status: 403,
        headers: corsHeaders,
      });
    }

    const uploadedByUserId = decoded.sub ?? null;
    if (!uploadedByUserId) {
      const resp = ResponseObject.parse({
        Message: "Unauthorized",
        HasErrors: true,
        Error: "Token missing subject (sub).",
      });
      return new Response(JSON.stringify(resp), {
        ...ResponseStatuses.Unauthorised,
        status: 403,
        headers: corsHeaders,
      });
    }

    // ===== CSV validation + processing =====
    const repo = new SupabaseRepo(supabase);

    // Validate + get raw CSV text (or throw ZodError)
    const { csvText, fileName } = await validateFile(req, repo);

    // Process into COA + readings + reading_results
    const coaId = await processCsv(csvText, uploadedByUserId, repo, fileName);

    const successfullResponse = ResponseObject.parse({
      Message: "CSV successfully processed",
      HasErrors: false,
      Data: {
        id: coaId,
      },
    });

    return Response.json(successfullResponse, {
      headers: corsHeaders,
      status: 200,
    });
  } catch (err: unknown) {
    console.error("[csv-upload] error:", err);

    let messages: string[] = [];
    if (
      typeof err === "object" &&
      err !== null &&
      "issues" in err &&
      Array.isArray((err as { issues: Array<{ message: string }> }).issues)
    ) {
      messages = (err as { issues: Array<{ message: string }> }).issues.map(
        (i) => i.message
      );
    } else if (err instanceof Error && typeof err.message === "string") {
      messages = [err.message];
    } else if (
      Array.isArray(err) &&
      err.every((item) => item instanceof Error)
    ) {
      messages = err.map((e) => e.message);
    } else {
      messages = [String(err)];
    }

    const body = ResponseObject.parse({
      Message: "CSV processing failed",
      HasErrors: true,
      Error: JSON.stringify(messages),
    });

    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "content-type": "application/json" },
      status: 400,
    });
  }
});
