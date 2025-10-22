import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadDetails } from './upload-details';

describe('UploadDetails', () => {
  let component: UploadDetails;
  let fixture: ComponentFixture<UploadDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
