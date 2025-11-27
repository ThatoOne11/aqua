import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BarChartModalComponent } from './bar-chart-modal';

describe('BarChartModalComponent', () => {
  let component: BarChartModalComponent;
  let fixture: ComponentFixture<BarChartModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChartModalComponent],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { clientName: 'Test Client', data: [] } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BarChartModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
