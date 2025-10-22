import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadAlertDetailsSummary } from './upload-alert-details-summary';

describe('UploadAlertDetailsSummary', () => {
  let component: UploadAlertDetailsSummary;
  let fixture: ComponentFixture<UploadAlertDetailsSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadAlertDetailsSummary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadAlertDetailsSummary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
