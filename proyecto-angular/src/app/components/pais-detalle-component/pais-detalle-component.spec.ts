/**
 * Pruebas del componente de detalle de pais.
 * Sirven para validar carga por ruta, comparacion y sincronizacion de query params.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { PaisDetalleComponent } from './pais-detalle-component';
import { PaisesService } from '../../services/paises-service';
import { Pais } from '../../models/pais-interface';

describe('PaisDetalleComponent', () => {
  let component: PaisDetalleComponent;
  let fixture: ComponentFixture<PaisDetalleComponent>;
  let router: Router;
  let nombreRuta: string | null;
  let paisComparadoRuta: string | null;
  let paramMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let queryParamMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const mockPaises: Pais[] = [
    {
      name: { common: 'Spain' },
      region: 'Europe',
      capital: ['Madrid'],
      population: 48000000,
      area: 505990,
      flags: { png: 'spain.png', svg: 'spain.svg' },
    },
    {
      name: { common: 'Argentina' },
      region: 'Americas',
      capital: ['Buenos Aires'],
      population: 46000000,
      area: 2780400,
      flags: { png: 'argentina.png', svg: 'argentina.svg' },
    },
  ];

  const paisesServiceMock = {
    obtenerPaises: vi.fn(() => of(mockPaises)),
    obtenerPaisPorNombre: vi.fn((nombre: string) => of(mockPaises.find((pais) => pais.name.common === nombre))),
  };

  beforeEach(async () => {
    nombreRuta = 'Spain';
    paisComparadoRuta = null;
    paramMapSubject = new BehaviorSubject(convertToParamMap({ nombre: nombreRuta }));
    queryParamMapSubject = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [PaisDetalleComponent],
      providers: [
        provideRouter([]),
        { provide: PaisesService, useValue: paisesServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMapSubject.asObservable(),
            queryParamMap: queryParamMapSubject.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaisDetalleComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  beforeEach(() => {
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the selected country detail', () => {
    expect(component.pais()?.name.common).toBe('Spain');
    expect(component.error()).toBeNull();
    expect(component.cargando()).toBe(false);
    expect(paisesServiceMock.obtenerPaises).toHaveBeenCalled();
  });

  it('should set an error when the route param is missing', async () => {
    paramMapSubject.next(convertToParamMap({}));
    queryParamMapSubject.next(convertToParamMap({}));

    const secondFixture = TestBed.createComponent(PaisDetalleComponent);
    const secondComponent = secondFixture.componentInstance;

    await secondFixture.whenStable();
    secondFixture.detectChanges();

    expect(secondComponent.pais()).toBeNull();
    expect(secondComponent.error()).toBe('No se ha indicado un pais valido.');
    expect(secondComponent.cargando()).toBe(false);
  });

  it('should keep query params in back link to the list', () => {
    const backLinkDebugElement = fixture.debugElement.query(By.css('.back-link'));
    const backLinkDirective = backLinkDebugElement.injector.get(RouterLink);

    expect(backLinkDirective.queryParamsHandling).toBe('preserve');
  });

  it('should load a second country when compare query param is present', async () => {
    queryParamMapSubject.next(convertToParamMap({ compare: 'Argentina' }));

    const secondFixture = TestBed.createComponent(PaisDetalleComponent);
    const secondComponent = secondFixture.componentInstance;

    await secondFixture.whenStable();
    secondFixture.detectChanges();

    expect(secondComponent.pais()?.name.common).toBe('Spain');
    expect(secondComponent.paisComparado()?.name.common).toBe('Argentina');
    expect(secondComponent.nombreComparacion()).toBe('Argentina');
  });

  it('should update compare query param when selecting a country', () => {
    component.seleccionarComparacion('Argentina');

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.any(Object),
      replaceUrl: true,
      queryParamsHandling: 'merge',
      queryParams: {
        compare: 'Argentina',
      },
    });
  });

  it('should show comparison error when compare country does not exist', async () => {
    queryParamMapSubject.next(convertToParamMap({ compare: 'NoExiste' }));

    const secondFixture = TestBed.createComponent(PaisDetalleComponent);
    const secondComponent = secondFixture.componentInstance;

    await secondFixture.whenStable();
    secondFixture.detectChanges();

    expect(secondComponent.paisComparado()).toBeNull();
    expect(secondComponent.errorComparacion()).toBe('No se encontro el pais seleccionado para comparar.');
  });
});
