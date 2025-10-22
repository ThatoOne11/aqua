import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtDecode, JwtPayload } from "https://esm.sh/jwt-decode@4.0.0";
import { ResponseObject, ResponseStatuses } from "../_shared/models.ts";

console.log("Initializing create-client function.");

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

    const { display_name } = await req.json();
    if (!display_name) {
      responseObject.Message = "Input validation failed";
      responseObject.HasErrors = true;
      return new Response(
        JSON.stringify(responseObject),
        ResponseStatuses.BadRequest
      );
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const currentUser = await userClient.auth.getUser();

    const clientInfo = {
      display_name: display_name,
      created_by: currentUser.data.user!.id,
    };
    console.log(clientInfo);

    const { data, error: insertError } = await userClient
      .from("clients")
      .insert(clientInfo)
      .select("id")
      .single();

    if (insertError) {
      console.log("clientInsertError: ", insertError);
      responseObject.Message =
        "Error when saving client to the database. Manual intervention is required";
      responseObject.Error = JSON.stringify(insertError);
      responseObject.HasErrors = true;
      return new Response(
        JSON.stringify(responseObject),
        ResponseStatuses.ServerError
      );
    }
    return new Response(JSON.stringify({ id: data.id }), ResponseStatuses.Ok);
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
