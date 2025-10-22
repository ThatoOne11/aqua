import { SupabaseException } from './supabase.exception';

export class SupabaseValidationException extends SupabaseException {
  constructor(title: string, message: string) {
    super(title, message);
  }
}
