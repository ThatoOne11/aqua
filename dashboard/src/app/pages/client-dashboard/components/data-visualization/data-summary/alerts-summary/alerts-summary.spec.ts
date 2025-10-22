import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertsSummary } from './alerts-summary';

describe('AlertsSummary', () => {
  let component: AlertsSummary;
  let fixture: ComponentFixture<AlertsSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertsSummary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertsSummary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
