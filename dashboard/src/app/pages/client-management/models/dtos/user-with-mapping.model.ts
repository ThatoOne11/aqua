interface UserWithMapping {
  id: string;
  display_name: string;
  email: string;
  user_client_mapping: { client_id: string; active: boolean }[] | null;
}
