import { TestBed } from '@angular/core/testing';

import { CertificateOfAnalysisService } from './certificate-of-analysis-service';

describe('CertificateOfAnalysisService', () => {
  let service: CertificateOfAnalysisService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CertificateOfAnalysisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
