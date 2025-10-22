import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtDecode, JwtPayload } from "https://esm.sh/jwt-decode@4.0.0";
import {
  ResponseObject,
  ResponseStatuses,
  UserSchema,
} from "../_shared/models.ts";

console.log("Initializing create-user-as-admin function.");

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

    if (!decodedToken.user_role || decodedToken.user_role !== "super-admin") {
      responseObject.Message = "Unauthorized";
      return new Response(
        JSON.stringify(responseObject),
        ResponseStatuses.Unauthorised
      );
    }

    const userInput = UserSchema.safeParse(await req.json());

    if (!userInput.success) {
      console.log(
        "There is missing information in the input object. Not proceeding with the registration",
        JSON.stringify(userInput.error)
      );
      responseObject.Message = "Input validation failed";
      responseObject.HasErrors = true;
      responseObject.ErrorList = userInput.error.issues;
      return new Response(
        JSON.stringify(responseObject),
        ResponseStatuses.BadRequest
      );
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const roleId = await userClient
      .from("roles")
      .select("id")
      .eq("name", "admin")
      .single();

    if (!roleId.data) {
      console.log("roleId not found");
      responseObject.Message = "Role not found";
      responseObject.Error = `Role not found using role name admin`;
      responseObject.HasErrors = true;

      return new Response(
        JSON.stringify(responseObject),
        ResponseStatuses.BadRequest
      );
    }

    const currentUser = await userClient.auth.getUser();

    //Add displayName to invite data for custom email template
    const { data: signupData, error: signupError } =
      await adminClient.auth.admin.inviteUserByEmail(userInput.data.email, {
        data: {
          display_name: userInput.data.displayName,
        },
      });
    if (signupError) {
      const responseObject = ResponseObject.parse({
        Message: "Failed to create user",
        HasErrors: true,
        Error: JSON.stringify(signupError),
      });
      return new Response(
        JSON.stringify(responseObject),
        ResponseStatuses.ServerError
      );
    }
    const newUserId = signupData.user.id;

    const userInfo = {
      id: newUserId,
      display_name: userInput.data.displayName,
      role_id: roleId.data.id,
      email: userInput.data.email,
      created_by: currentUser.data.user!.id,
    };

    const { error: insertError } = await adminClient
      .from("users")
      .insert(userInfo)
      .select();

    if (insertError) {
      console.log("userInsertError: ", insertError);
      responseObject.Message =
        "Unable to link auth user to user table. Manual intervention is required";
      responseObject.Error = JSON.stringify(insertError);
      responseObject.HasErrors = true;
      return new Response(
        JSON.stringify(responseObject),
        ResponseStatuses.ServerError
      );
    }

    return new Response(JSON.stringify(responseObject), ResponseStatuses.Ok);
  } catch (error) {
    console.error(error);
    const responseObject = ResponseObject.parse({
      Message: "Failed to create user",
      HasErrors: true,
      Error: JSON.stringify(error),
    });
    return new Response(
      JSON.stringify(responseObject),
      ResponseStatuses.ServerError
    );
  }
});
