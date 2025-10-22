import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertManagement } from './alert-management';

describe('AlertManagement', () => {
  let component: AlertManagement;
  let fixture: ComponentFixture<AlertManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
