import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

import { PaisComponent } from './pais-component';
import { PaisesService } from '../../services/paises-service';
import { Pais } from '../../models/pais-interface';

describe('PaisComponent', () => {
  let component: PaisComponent;
  let fixture: ComponentFixture<PaisComponent>;

  const mockPaises: Pais[] = [
    {
      name: { common: 'Spain' },
      region: 'Europe',
      capital: ['Madrid'],
      population: 48000000,
      flags: { png: 'spain.png', svg: 'spain.svg' },
    },
    {
      name: { common: 'Argentina' },
      region: 'Americas',
      capital: ['Buenos Aires'],
      population: 46000000,
      flags: { png: 'argentina.png', svg: 'argentina.svg' },
    },
    {
      name: { common: 'Japan' },
      region: 'Asia',
      capital: ['Tokyo'],
      population: 124000000,
      flags: { png: 'japan.png', svg: 'japan.svg' },
    },
  ];

  const paisesServiceMock = {
    obtenerPaises: vi.fn(() => of(mockPaises)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaisComponent],
      providers: [
        provideRouter([]),
        { provide: PaisesService, useValue: paisesServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaisComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load countries on init', () => {
    expect(component.paises().length).toBe(3);
    expect(component.cargando()).toBe(false);
  });

  it('should filter countries by search term and region', () => {
    component.actualizarBusqueda('spa');
    component.actualizarRegion('Europe');

    expect(component.paisesFiltrados().map((pais) => pais.name.common)).toEqual(['Spain']);
  });

  it('should sort countries by population descending', () => {
    component.actualizarOrden('poblacion-desc');

    expect(component.paisesFiltrados().map((pais) => pais.name.common)).toEqual([
      'Japan',
      'Spain',
      'Argentina',
    ]);
  });

  it('should clear active filters and restore defaults', () => {
    component.actualizarBusqueda('ja');
    component.actualizarRegion('Asia');
    component.actualizarOrden('poblacion-desc');
    component.toggleSoloFavoritos();

    component.limpiarFiltros();

    expect(component.terminoBusqueda()).toBe('');
    expect(component.regionSeleccionada()).toBe('Todas');
    expect(component.ordenSeleccionado()).toBe('nombre-asc');
    expect(component.soloFavoritos()).toBe(false);
  });

  it('should compute summary data from visible countries', () => {
    component.actualizarRegion('Europe');

    expect(component.resumenResultados()).toEqual({
      totalPaises: 3,
      visibles: 1,
      poblacionTotal: 48000000,
      regionMasComun: 'Europe',
      paisMasPoblado: mockPaises[0],
    });
  });
});
