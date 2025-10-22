import { TestBed } from '@angular/core/testing';

import { ReviewStepService } from './review-step-service';
import { ReviewStepsEnum } from '@data-management/models/review-steps/review-steps';

describe('ReviewStepService', () => {
  let service: ReviewStepService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReviewStepService],
    });
    service = TestBed.inject(ReviewStepService);
  });

  it('should return the correct button for the UPLOAD step', () => {
    const buttons = service.getActionButtons(ReviewStepsEnum.UPLOAD);
    expect(buttons.length).toBe(1);
    expect(buttons[0].title).toBe('Accept');
  });

  it('should return the correct buttons for the ALERTS step', () => {
    const buttons = service.getActionButtons(ReviewStepsEnum.ALERTS);
    expect(buttons.length).toBe(2);
    expect(buttons[0].title).toBe('Ignore All');
    expect(buttons[1].title).toBe('Accept All');
  });

  it('should return the correct button for the CONFIRM step', () => {
    const buttons = service.getActionButtons(ReviewStepsEnum.CONFIRM);
    expect(buttons.length).toBe(1);
    expect(buttons[0].title).toBe('Confirm Upload');
  });

  it('should return an array of three review steps', () => {
    const steps = service.getSteps();
    expect(steps.length).toBe(3); // Check the first step (UPLOAD)

    expect(steps[0].title).toBe('Upload Details');
    expect(steps[0].step).toBe(ReviewStepsEnum.UPLOAD);
    expect(steps[0].nextStep).toBe(ReviewStepsEnum.ALERTS);
    expect(steps[0].previousStep).toBeUndefined(); // Check the second step (ALERTS)

    expect(steps[1].title).toBe('Review Alerts');
    expect(steps[1].step).toBe(ReviewStepsEnum.ALERTS);
    expect(steps[1].nextStep).toBe(ReviewStepsEnum.CONFIRM);
    expect(steps[1].previousStep).toBe(ReviewStepsEnum.UPLOAD); // Check the third step (CONFIRM)

    expect(steps[2].title).toBe('Upload Confirmation');
    expect(steps[2].step).toBe(ReviewStepsEnum.CONFIRM);
    expect(steps[2].nextStep).toBeUndefined();
    expect(steps[2].previousStep).toBe(ReviewStepsEnum.ALERTS);
  });
});
