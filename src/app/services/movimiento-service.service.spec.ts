import { TestBed } from '@angular/core/testing';

import { MovimientoServiceService } from './movimiento-service.service';

describe('MovimientoServiceService', () => {
  let service: MovimientoServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MovimientoServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
