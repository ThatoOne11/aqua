import { ResultType } from '@static/models/dto/result-type.model';

export class AlertForClient {
  id: string;
  resultType: ResultType;
  condition: string;
  value: number;

  constructor(
    id: string,
    resultType: ResultType,
    condition: string,
    value: number
  ) {
    this.id = id;
    this.resultType = resultType;
    this.condition = condition;
    this.value = value;
  }
}
