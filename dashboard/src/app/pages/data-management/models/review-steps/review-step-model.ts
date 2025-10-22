import { MatButtonAppearance } from '@angular/material/button';
import { ReviewStepsEnum } from './review-steps';

export interface ReviewStepModel {
  title: string;
  step: ReviewStepsEnum;
  nextStep?: ReviewStepsEnum;
  previousStep?: ReviewStepsEnum;
}

export interface ActionButtonModel {
  title: string;
  action?: () => void;
  condition: boolean;
  disabled?: boolean;
  buttonAppearance: MatButtonAppearance;
}
