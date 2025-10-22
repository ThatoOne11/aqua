import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import { jwtDecode, JwtPayload } from "https://esm.sh/jwt-decode@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import {
  ResponseObject,
  ResponseStatuses,
  UserInputSchema,
} from "../_shared/models.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", ResponseStatuses.Ok);
  }
  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.split(" ")[1];
    const decodedToken = jwtDecode<JwtPayload & { user_role: string }>(token);

    if (
      !decodedToken.user_role ||
      (decodedToken.user_role !== "admin" &&
        decodedToken.user_role !== "super-admin")
    ) {
      return new Response("Unauthorized", ResponseStatuses.Unauthorised);
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
    const body = await req.json();

    const userInputDetails = UserInputSchema.safeParse(body);

    if (!userInputDetails.success) {
      console.log(
        "There is missing information in the input object. Not proceeding with the registration",
        JSON.stringify(userInputDetails.error)
      );
      const responseObject = ResponseObject.parse({
        Message: "Missing information in request.",
        HasErrors: true,
        Error: "",
        ErrorList: userInputDetails.error.issues,
      });
      return new Response(
        JSON.stringify(responseObject),
        ResponseStatuses.BadRequest
      );
    }

    const clientId = body.clientId;

    const registrationErrors: string[] = [];
    for (const currentUserRequest of userInputDetails.data!.users) {
      await RegisterUser(
        adminClient,
        userClient,
        clientId,
        currentUserRequest,
        registrationErrors
      );
    }

    const responseObject = ResponseObject.parse({
      Message: "Success",
      HasErrors: false,
      Error: "",
      ErrorList: registrationErrors,
    });

    if (registrationErrors.length > 0) {
      if (registrationErrors.length == userInputDetails.data.users.length) {
        responseObject.Message = "Failed to register all supplied users";
        responseObject.HasErrors = true;
        return new Response(
          JSON.stringify(responseObject),
          ResponseStatuses.ServerError
        );
      } else {
        responseObject.Message = "Some users failed to register";
        responseObject.HasErrors = true;
        return new Response(
          JSON.stringify(responseObject),
          ResponseStatuses.Ok
        );
      }
    }
    return new Response(JSON.stringify(responseObject), ResponseStatuses.Ok);
  } catch (error) {
    console.error(error);
    return new Response("Failed to register users", { status: 500 });
  }
});

async function RegisterUser(
  adminClient: SupabaseClient,
  userClient: SupabaseClient,
  clientId: string,
  userInput: z.infer<typeof UserInputSchema>,
  registrationErrors: string[]
) {
  try {
    const { data: existingUser, error: existingUserError } = await userClient
      .from("users")
      .select("id")
      .eq("email", userInput.email)
      .limit(1)
      .maybeSingle();

    if (existingUserError) {
      console.error("Error checking existing user:", existingUserError);
      registrationErrors.push(
        `Error checking if user exists: ${userInput.email}`
      );
      return; // stop processing this user
    }

    if (existingUser) {
      console.log(`User already exists: ${userInput.email}`);
      registrationErrors.push(`User already exists: ${userInput.email}`);
      return; // stop processing this user
    }

    const roleId = await userClient
      .from("roles")
      .select("id")
      .eq("name", "client")
      .single();

    if (!roleId.data) {
      console.log("roleId not found");
      registrationErrors.push("Role not found using role name client");
      return;
    }

    const currentUser = await userClient.auth.getUser();

    //Add displayName to invite data for custom email template
    const { data: signupData } = await adminClient.auth.admin.inviteUserByEmail(
      userInput.email,
      {
        data: {
          display_name: userInput.displayName,
        },
      }
    );

    const newUserId = signupData.user!.id;

    const userInfo = {
      id: newUserId,
      display_name: userInput.displayName,
      role_id: roleId.data.id,
      email: userInput.email,
      created_by: currentUser.data.user!.id,
    };

    const { error: userError } = await adminClient
      .from("users")
      .insert(userInfo)
      .select("id")
      .single();

    if (userError) {
      console.log("userInsertError: ", userError);
      registrationErrors.push(
        `Unable to link auth user to user table. Manual intervention is required: ${userInput.email}. User partially registered.`
      );
    }

    const clientUserMappingInfo = {
      user_id: newUserId,
      client_id: clientId,
    };
    console.log(clientUserMappingInfo);
    const { error: clientUserMappingError } = await adminClient
      .from("user_client_mapping")
      .insert(clientUserMappingInfo)
      .select();

    if (clientUserMappingError) {
      console.log("userClientMappingError: ", clientUserMappingError);
      registrationErrors.push(
        `Unable to link user to client. Manual intervention is required: ${userInput.email}. User partially registered.`
      );
    }
  } catch (error) {
    console.error("UserRegistrationError: ", error);
    registrationErrors.push("Unable to register user");
  }
}
