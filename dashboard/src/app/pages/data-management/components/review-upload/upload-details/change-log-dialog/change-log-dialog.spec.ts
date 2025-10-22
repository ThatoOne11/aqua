import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeLogDialog } from './change-log-dialog';

describe('ChangeLogDialog', () => {
  let component: ChangeLogDialog;
  let fixture: ComponentFixture<ChangeLogDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeLogDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangeLogDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
