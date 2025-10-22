import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogUserAccess } from './dialog-user-access';

describe('DialogNoAuthenticator', () => {
  let component: DialogUserAccess;
  let fixture: ComponentFixture<DialogUserAccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogUserAccess],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogUserAccess);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
