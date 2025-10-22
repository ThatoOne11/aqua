import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadInfo } from './upload-info';

describe('UploadInfo', () => {
  let component: UploadInfo;
  let fixture: ComponentFixture<UploadInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadInfo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadInfo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
