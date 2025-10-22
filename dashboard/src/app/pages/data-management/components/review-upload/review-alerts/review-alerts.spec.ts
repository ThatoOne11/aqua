import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewAlerts } from './review-alerts';

describe('ReviewAlerts', () => {
  let component: ReviewAlerts;
  let fixture: ComponentFixture<ReviewAlerts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewAlerts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviewAlerts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
