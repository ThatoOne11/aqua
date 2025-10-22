import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

export const ResponseObject = z.object({
  Message: z.string(),
  HasErrors: z.boolean(),
  Data: z.object({ id: z.string().uuid() }).optional(),
  Error: z.union([z.string(), z.array(z.string())]).optional(),
  ErrorList: z.array(z.any()).optional(),
});

export const ResponseStatuses = {
  ServerError: {
    status: 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  },
  BadRequest: {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  },
  Unauthorised: {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  },
  Ok: {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  },
};

export const UserSchema = z.object({
  displayName: z.string(),
  email: z.string().email(),
});

export const UserInputSchema = z.object({
  clientId: z.string().uuid(),
  users: z.array(UserSchema),
});
