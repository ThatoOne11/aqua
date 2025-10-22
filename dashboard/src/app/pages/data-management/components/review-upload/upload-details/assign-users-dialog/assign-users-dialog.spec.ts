import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignUsersDialog } from './assign-users-dialog';

describe('AssignUsersDialog', () => {
  let component: AssignUsersDialog;
  let fixture: ComponentFixture<AssignUsersDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignUsersDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignUsersDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
