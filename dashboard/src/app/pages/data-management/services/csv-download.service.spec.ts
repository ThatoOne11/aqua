import { TestBed } from '@angular/core/testing';
import { CsvDownloadService } from './csv-download.service';
import { CertificateOfAnalysisService } from '@data-management/services/certificate-of-analysis-service';
import { CoaUploadViewModel } from '@data-management/models/review-upload/coa-details.model';

describe('CsvDownloadService', () => {
  let service: CsvDownloadService;
  let coaService: CertificateOfAnalysisService;

  const mockBundle: CoaUploadViewModel = {
    details: {
      client_name: 'Test Client',
      site_name: 'Test Site',
      coa_reading_date: '2025-09-09T12:00:00.000Z',
    } as any,
    readings: [
      {
        reading_id: 'r1',
        certificate_of_analysis_id: 'c1',
        sample_time: '2025-09-09T12:00:00.000Z',
        floor: '1',
        area: 'A',
        location: 'L1',
        outlet: 'O1',
        feed_type: 'F1',
        flush_type: 'Fl1',
        param1: '10',
        param2: '20',
      },
      {
        reading_id: 'r2',
        certificate_of_analysis_id: 'c1',
        sample_time: '2025-09-09T13:00:00.000Z',
        floor: '2',
        area: 'B',
        location: 'L2',
        outlet: 'O2',
        feed_type: 'F2',
        flush_type: 'Fl2',
        param1: '30',
        param2: '40',
      },
    ],
    headers: ['reading_id', 'certificate_of_analysis_id', 'sample_time', 'floor', 'area', 'location', 'outlet', 'feed_type', 'flush_type', 'param1', 'param2'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CsvDownloadService,
        {
          provide: CertificateOfAnalysisService,
          useValue: {
            getCoaBundle: jasmine.createSpy('getCoaBundle').and.returnValue(Promise.resolve(mockBundle)),
          },
        },
      ],
    });
    service = TestBed.inject(CsvDownloadService);
    coaService = TestBed.inject(CertificateOfAnalysisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('downloadCoaCsv', () => {
    it('should call download with the correct csv content and filename', async () => {
      const downloadSpy = spyOn(service as any, 'download');
      await service.downloadCoaCsv('test-coa-id');

      const expectedCsv = [
        'client_name,site_name,date,time,parameters,floor,area,location,outlet,feed_type,flush_type,param1,param2',
        '"Test Client","Test Site",2025-09-09,12:00,"param1, param2",1,A,L1,O1,F1,Fl1,10,20',
        '"",2025-09-09,13:00,",",2,B,L2,O2,F2,Fl2,30,40',
      ].join('\n');

      const expectedFilename = 'coa_Test_Site_test-coa-id.csv';

      expect(downloadSpy).toHaveBeenCalledWith(expectedCsv, expectedFilename);
    });
  });
});
