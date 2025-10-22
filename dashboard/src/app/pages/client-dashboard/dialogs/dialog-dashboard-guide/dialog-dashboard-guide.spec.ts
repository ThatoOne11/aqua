import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogDashboardGuide } from './dialog-dashboard-guide/dialog-dashboard-guide';

describe('DialogDashboardGuide', () => {
  let component: DialogDashboardGuide;
  let fixture: ComponentFixture<DialogDashboardGuide>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogDashboardGuide],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogDashboardGuide);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
