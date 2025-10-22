import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoFChart } from './bar-chart';

describe('PoFChart', () => {
  let component: PoFChart;
  let fixture: ComponentFixture<PoFChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoFChart],
    }).compileComponents();

    fixture = TestBed.createComponent(PoFChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
