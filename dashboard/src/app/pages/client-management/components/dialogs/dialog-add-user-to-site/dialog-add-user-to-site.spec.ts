import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAddUserToSite } from './dialog-add-user-to-site';

describe('DialogAddUserToSite', () => {
  let component: DialogAddUserToSite;
  let fixture: ComponentFixture<DialogAddUserToSite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogAddUserToSite]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogAddUserToSite);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
