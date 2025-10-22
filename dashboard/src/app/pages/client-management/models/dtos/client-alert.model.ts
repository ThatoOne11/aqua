import { ResultType } from '@static/models/dto/result-type.model';

export class ClientAlert {
  resultType: ResultType;
  condition: string;
  value: number;

  constructor(resultType: ResultType, condition: string, value: number) {
    this.resultType = resultType;
    this.condition = condition;
    this.value = value;
  }
}
