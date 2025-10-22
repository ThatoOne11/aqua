import { inject, Injectable } from '@angular/core';
import { SupabaseTables } from '@core/constants/supabase.constants';
import { SupabaseClientService } from '@core/services/supabase-client.service';
import { ResultType } from '@static/models/dto/result-type.model';
import { errorContext } from 'rxjs/internal/util/errorContext';
@Injectable({
  providedIn: 'root',
})
export class StaticService {
  private supabase = inject(SupabaseClientService);

  public async GetResultTypes(): Promise<ResultType[]> {
    const { data: result_types, error: selectError } =
      await this.supabase.supabaseClient
        .from(SupabaseTables.RESULT_TYPES)
        .select();

    if (selectError) {
      console.error('Error getting result types for alerts: ', selectError);
      throw new Error('Get result type error:' + selectError.message);
    }
    return result_types;
  }
}
