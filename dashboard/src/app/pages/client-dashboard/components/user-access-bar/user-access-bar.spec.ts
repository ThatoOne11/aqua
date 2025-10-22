import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAccessBarComponent } from './user-access-bar';

describe('UserAccessBar', () => {
  let component: UserAccessBarComponent;
  let fixture: ComponentFixture<UserAccessBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAccessBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserAccessBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
