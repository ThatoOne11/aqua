import { TestBed } from '@angular/core/testing';
import { DashboardDataService } from '@client-dashboard/services/dashboard-data-service';

describe('DashboardData', () => {
  let service: DashboardDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
