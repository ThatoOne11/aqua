import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountSetupIssue } from './account-setup-issue';

describe('AccountSetupIssue', () => {
  let component: AccountSetupIssue;
  let fixture: ComponentFixture<AccountSetupIssue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountSetupIssue]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountSetupIssue);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
