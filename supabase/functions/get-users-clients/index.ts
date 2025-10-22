import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtDecode, JwtPayload } from "https://esm.sh/jwt-decode@4.0.0";
import { ResponseObject, ResponseStatuses } from "../_shared/models.ts";

console.log("Initializing get-users-clients function.");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", ResponseStatuses.Ok);
  }
  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.split(" ")[1];
    const decodedToken = jwtDecode<JwtPayload & { user_role: string }>(token);
    const responseObject = ResponseObject.parse({
      Message: "Success",
      HasErrors: false,
      Error: "",
      ErrorList: [],
    });
    if (!decodedToken.user_role || decodedToken.user_role !== "admin") {
      responseObject.Message = "Unauthorized";
      return new Response(
        JSON.stringify(responseObject),
        ResponseStatuses.Unauthorised
      );
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const currentUser = await userClient.auth.getUser();
    const currentUserId = currentUser.data.user!.id;

    const { data: clients, error: clientsError } = await userClient
      .from("clients")
      .select("id, display_name")
      .eq("created_by", currentUserId);

    if (clientsError) {
      return new Response(JSON.stringify({ error: clientsError.message }), {
        status: 500,
      });
    }
    const results = await Promise.all(
      clients.map(async (client) => {
        const { count, error: mappingError } = await userClient
          .from("user_client_mapping")
          .select("*", { count: "exact", head: true })
          .eq("client_id", client.id);

        if (mappingError) {
          console.error(
            "Mapping error for client:",
            client.id,
            mappingError.message
          );
        }

        return {
          clientName: client.display_name,
          numberOfUsers: count ?? 0,
          numberOfAlerts: 0,
          numberOfSites: 0,
        };
      })
    );
    return new Response(JSON.stringify(results), ResponseStatuses.Ok);
  } catch (error) {
    console.error(error);
    const responseObject = ResponseObject.parse({
      Message: "Failed to create client",
      HasErrors: true,
      Error: JSON.stringify(error),
    });
    return new Response(
      JSON.stringify(responseObject),
      ResponseStatuses.ServerError
    );
  }
});
