import { TestBed } from '@angular/core/testing';

import { ExcelService } from './excel.service.ts.service';

describe('ExcelServiceTsService', () => {
  let service: ExcelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExcelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
