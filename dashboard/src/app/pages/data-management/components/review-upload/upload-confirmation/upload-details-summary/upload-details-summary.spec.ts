import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadDetailsSummary } from './upload-details-summary';

describe('UploadDetails', () => {
  let component: UploadDetailsSummary;
  let fixture: ComponentFixture<UploadDetailsSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadDetailsSummary],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadDetailsSummary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
