export interface AlertModel {
  readingId: string;
  resultTypeId: string;
  readingValue: number;
  alertValue: number;
  alertCondition: string;
  note?: string;
  ignored: boolean;
  readingResultId: string;
  time: string;
  parameter: string;
  site: string;
  floor: string;
  area: string;
  location: string;
  outlet: string;
  unitOfMeasurement: string;
  comments?: string;
}
