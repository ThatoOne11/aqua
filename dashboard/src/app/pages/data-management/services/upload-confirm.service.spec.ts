import { TestBed } from '@angular/core/testing';

import { UploadConfirmService } from './upload-confirm.service';

describe('UploadConfirm', () => {
  let service: UploadConfirmService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UploadConfirmService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
