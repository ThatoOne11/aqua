export interface InsertReadingAlert {
  reading_id: string;
  result_type_id: string;
  reading_value: number;
  alert_value: number;
  alert_condition: string;
  note?: string;
  ignored: boolean;
  reading_result_id: string;
}
