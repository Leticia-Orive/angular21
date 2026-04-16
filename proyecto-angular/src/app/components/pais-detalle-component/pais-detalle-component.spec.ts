import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { PaisDetalleComponent } from './pais-detalle-component';
import { PaisesService } from '../../services/paises-service';
import { Pais } from '../../models/pais-interface';

describe('PaisDetalleComponent', () => {
  let component: PaisDetalleComponent;
  let fixture: ComponentFixture<PaisDetalleComponent>;
  let nombreRuta: string | null;

  const mockPaises: Pais[] = [
    {
      name: { common: 'Spain' },
      region: 'Europe',
      capital: ['Madrid'],
      population: 48000000,
      flags: { png: 'spain.png', svg: 'spain.svg' },
    },
  ];

  const paisesServiceMock = {
    obtenerPaisPorNombre: vi.fn((nombre: string) => of(mockPaises.find((pais) => pais.name.common === nombre))),
  };

  beforeEach(async () => {
    nombreRuta = 'Spain';

    await TestBed.configureTestingModule({
      imports: [PaisDetalleComponent],
      providers: [
        provideRouter([]),
        { provide: PaisesService, useValue: paisesServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (clave: string) => (clave === 'nombre' ? nombreRuta : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaisDetalleComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the selected country detail', () => {
    expect(component.pais()?.name.common).toBe('Spain');
    expect(component.error()).toBeNull();
    expect(component.cargando()).toBe(false);
    expect(paisesServiceMock.obtenerPaisPorNombre).toHaveBeenCalledWith('Spain');
  });

  it('should set an error when the route param is missing', async () => {
    nombreRuta = null;

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
});
