import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewUpload } from './review-upload';

describe('ReviewUpload', () => {
  let component: ReviewUpload;
  let fixture: ComponentFixture<ReviewUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewUpload]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviewUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
