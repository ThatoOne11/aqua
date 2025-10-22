import { SupabaseException } from './supabase.exception';

export class SupabaseDatabaseException extends SupabaseException {
  constructor() {
    const genericErrorMessage =
      'There was an error when attempting to facilate this process. Please contact an admin for assistance.';
    super('Error', genericErrorMessage);
  }
}
