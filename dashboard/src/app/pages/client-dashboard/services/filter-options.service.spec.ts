import { TestBed } from '@angular/core/testing';

import { FilterOptionsService } from './filter-options.service';

describe('FilterOptionsService', () => {
  let service: FilterOptionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilterOptionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
