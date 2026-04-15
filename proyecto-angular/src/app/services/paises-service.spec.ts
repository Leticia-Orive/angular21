import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PaisesService } from './paises-service';
import { Pais } from '../models/pais-interface';

describe('PaisesService', () => {
  let service: PaisesService;
  let httpMock: HttpTestingController;

  const mockPaises: Pais[] = [
    {
      name: { common: 'Spain' },
      region: 'Europe',
      capital: ['Madrid'],
      population: 48000000,
      flags: { png: 'spain.png', svg: 'spain.svg' },
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PaisesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should request countries from the API', () => {
    let resultado: Pais[] | undefined;

    service.obtenerPaises().subscribe((data) => {
      resultado = data;
    });

    const req = httpMock.expectOne(
      'https://restcountries.com/v3.1/all?fields=name,region,capital,population,flags'
    );

    expect(req.request.method).toBe('GET');
    req.flush(mockPaises);

    expect(resultado).toEqual(mockPaises);
  });

  it('should reuse cached countries after the first request', () => {
    let primerResultado: Pais[] | undefined;
    let segundoResultado: Pais[] | undefined;

    service.obtenerPaises().subscribe((data) => {
      primerResultado = data;
    });

    const req = httpMock.expectOne(
      'https://restcountries.com/v3.1/all?fields=name,region,capital,population,flags'
    );
    req.flush(mockPaises);

    service.obtenerPaises().subscribe((data) => {
      segundoResultado = data;
    });

    httpMock.expectNone(
      'https://restcountries.com/v3.1/all?fields=name,region,capital,population,flags'
    );

    expect(primerResultado).toEqual(mockPaises);
    expect(segundoResultado).toEqual(mockPaises);
  });
});
