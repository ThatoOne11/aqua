import { TestBed } from '@angular/core/testing';
import { CoaWarningsService } from './coa-warnings.service';
import { CoaWarnings } from '../models/review-upload/coa-warnings.model';
import { SupabaseClientService } from '@core/services/supabase-client.service';

describe('CoaWarningsService', () => {
  let service: CoaWarningsService;

  const mockRpc = jasmine.createSpy('rpc');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CoaWarningsService,
        {
          provide: SupabaseClientService,
          useValue: {
            supabaseClient: {
              rpc: mockRpc,
            },
          },
        },
      ],
    });
    service = TestBed.inject(CoaWarningsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
