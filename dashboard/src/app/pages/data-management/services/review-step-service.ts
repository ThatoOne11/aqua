import { Injectable } from '@angular/core';
import {
  ActionButtonModel,
  ReviewStepModel,
} from '@data-management/models/review-steps/review-step-model';
import { ReviewStepsEnum } from '@data-management/models/review-steps/review-steps';

@Injectable({
  providedIn: 'root',
})
export class ReviewStepService {
  public getSteps(): ReviewStepModel[] {
    return [this.csvUploadStep, this.reviewAlertsStep, this.confirmStep];
  }

  private csvUploadStep: ReviewStepModel = {
    title: 'Upload Details',
    step: ReviewStepsEnum.UPLOAD,
    nextStep: ReviewStepsEnum.ALERTS,
  };

  private reviewAlertsStep: ReviewStepModel = {
    title: 'Review Alerts',
    step: ReviewStepsEnum.ALERTS,
    previousStep: ReviewStepsEnum.UPLOAD,
    nextStep: ReviewStepsEnum.CONFIRM,
  };

  private confirmStep: ReviewStepModel = {
    title: 'Upload Confirmation',
    step: ReviewStepsEnum.CONFIRM,
    previousStep: ReviewStepsEnum.ALERTS,
  };
}
