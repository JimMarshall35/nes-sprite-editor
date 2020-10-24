import { TestBed } from '@angular/core/testing';

import { ProcessrawchararrayService } from './processrawchararray.service';

describe('ProcessrawchararrayService', () => {
  let service: ProcessrawchararrayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProcessrawchararrayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
