import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadConfirmation } from './upload-confirmation';

describe('UploadConfirmation', () => {
  let component: UploadConfirmation;
  let fixture: ComponentFixture<UploadConfirmation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadConfirmation],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadConfirmation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
