import { TestBed } from '@angular/core/testing';

import { CalculadoraJornadaService } from './calculadora-jornada.service';

describe('CalculadoraJornadaService', () => {
  let service: CalculadoraJornadaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalculadoraJornadaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
