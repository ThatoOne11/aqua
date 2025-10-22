import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeLog } from './change-log';

describe('ChangeLog', () => {
  let component: ChangeLog;
  let fixture: ComponentFixture<ChangeLog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeLog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangeLog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
