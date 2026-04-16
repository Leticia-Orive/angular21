import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { provideRouter, Router, RouterLink } from '@angular/router';

import { PaisComponent } from './pais-component';
import { PaisesService } from '../../services/paises-service';
import { Pais } from '../../models/pais-interface';

describe('PaisComponent', () => {
  let component: PaisComponent;
  let fixture: ComponentFixture<PaisComponent>;
  let router: Router;

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

  it('should sync active filters to query params', () => {
    component.actualizarBusqueda('spa');
    component.actualizarRegion('Europe');
    component.actualizarOrden('poblacion-desc');
    component.toggleSoloFavoritos();

    expect(router.navigate).toHaveBeenLastCalledWith([], {
      relativeTo: expect.any(Object),
      replaceUrl: true,
      queryParams: {
        q: 'spa',
        region: 'Europe',
        orden: 'poblacion-desc',
        fav: '1',
      },
    });
  });

  it('should remove query params when filters are reset', () => {
    component.actualizarBusqueda('spa');
    component.actualizarRegion('Europe');
    component.actualizarOrden('poblacion-desc');
    component.toggleSoloFavoritos();

    component.limpiarFiltros();

    expect(router.navigate).toHaveBeenLastCalledWith([], {
      relativeTo: expect.any(Object),
      replaceUrl: true,
      queryParams: {
        q: null,
        region: null,
        orden: null,
        fav: null,
      },
    });
  });

  it('should keep query params when navigating to detail', () => {
    const detailLinkDebugElement = fixture.debugElement.query(By.css('.detail-link'));
    const detailLinkDirective = detailLinkDebugElement.injector.get(RouterLink);

    expect(detailLinkDirective.queryParamsHandling).toBe('preserve');
  });

  it('should copy current url to clipboard', async () => {
    vi.useFakeTimers();

    const writeTextMock = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: writeTextMock,
      },
    });

    await component.copiarEnlaceBusqueda();

    expect(writeTextMock).toHaveBeenCalledWith(window.location.href);
    expect(component.estadoCopiaEnlace()).toBe('ok');

    vi.advanceTimersByTime(2500);
    expect(component.estadoCopiaEnlace()).toBe('idle');

    vi.useRealTimers();
  });

  it('should show error state when clipboard API is unavailable', async () => {
    vi.useFakeTimers();

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });

    await component.copiarEnlaceBusqueda();

    expect(component.estadoCopiaEnlace()).toBe('error');

    vi.advanceTimersByTime(2500);
    expect(component.estadoCopiaEnlace()).toBe('idle');

    vi.useRealTimers();
  });

  it('should close copy toast manually', () => {
    component.estadoCopiaEnlace.set('ok');

    component.cerrarToastCopia();

    expect(component.estadoCopiaEnlace()).toBe('idle');
  });

  it('should close copy toast when Esc key is pressed', () => {
    component.ayudaAtajosAbierta.set(true);
    component.estadoCopiaEnlace.set('error');

    component.cerrarToastConEsc();

    expect(component.ayudaAtajosAbierta()).toBe(false);
    expect(component.estadoCopiaEnlace()).toBe('idle');
  });

  it('should not close copy toast when Esc pressed and toast is idle', () => {
    component.estadoCopiaEnlace.set('idle');

    component.cerrarToastConEsc();

    expect(component.estadoCopiaEnlace()).toBe('idle');
  });

  it('should focus search input when slash shortcut is used', () => {
    const input = fixture.nativeElement.querySelector('#buscador-paises') as HTMLInputElement;
    const focusSpy = vi.spyOn(input, 'focus');
    const preventDefault = vi.fn();

    component.manejarAtajosTeclado({
      key: '/',
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      target: document.body,
      preventDefault,
    } as unknown as KeyboardEvent);

    expect(preventDefault).toHaveBeenCalled();
    expect(focusSpy).toHaveBeenCalled();
  });

  it('should toggle favorites with F shortcut when focus is outside editable elements', () => {
    const preventDefault = vi.fn();
    const estadoInicial = component.soloFavoritos();

    component.manejarAtajosTeclado({
      key: 'f',
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      target: document.body,
      preventDefault,
    } as unknown as KeyboardEvent);

    expect(preventDefault).toHaveBeenCalled();
    expect(component.soloFavoritos()).toBe(!estadoInicial);
  });

  it('should ignore F shortcut when typing in editable elements', () => {
    const input = fixture.nativeElement.querySelector('#buscador-paises') as HTMLInputElement;
    const preventDefault = vi.fn();

    component.soloFavoritos.set(false);
    component.manejarAtajosTeclado({
      key: 'f',
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      target: input,
      preventDefault,
    } as unknown as KeyboardEvent);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(component.soloFavoritos()).toBe(false);
  });

  it('should toggle shortcuts help panel with question mark shortcut', () => {
    const preventDefault = vi.fn();

    component.ayudaAtajosAbierta.set(false);
    component.manejarAtajosTeclado({
      key: '?',
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      target: document.body,
      preventDefault,
    } as unknown as KeyboardEvent);

    expect(preventDefault).toHaveBeenCalled();
    expect(component.ayudaAtajosAbierta()).toBe(true);

    component.manejarAtajosTeclado({
      key: '?',
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      target: document.body,
      preventDefault,
    } as unknown as KeyboardEvent);

    expect(component.ayudaAtajosAbierta()).toBe(false);
  });

  it('should ignore question mark shortcut while typing in inputs', () => {
    const input = fixture.nativeElement.querySelector('#buscador-paises') as HTMLInputElement;
    const preventDefault = vi.fn();

    component.ayudaAtajosAbierta.set(false);
    component.manejarAtajosTeclado({
      key: '?',
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      target: input,
      preventDefault,
    } as unknown as KeyboardEvent);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(component.ayudaAtajosAbierta()).toBe(false);
  });

  it('should show first page of countries when there are more than page size', () => {
    const TAMANIO = PaisComponent.TAMANIO_PAGINA;
    const muchosPaises = Array.from({ length: TAMANIO + 5 }, (_, i) => ({
      name: { common: `Pais${i}` },
      region: 'Europe',
      capital: [`Capital${i}`],
      population: i * 1000,
      flags: { png: `flag${i}.png`, svg: `flag${i}.svg` },
    })) as Pais[];

    component.paises.set(muchosPaises);

    expect(component.paisesPagina().length).toBe(TAMANIO);
    expect(component.totalPaginas()).toBe(2);
    expect(component.paginaActual()).toBe(1);
  });

  it('should navigate to next page', () => {
    const TAMANIO = PaisComponent.TAMANIO_PAGINA;
    const muchosPaises = Array.from({ length: TAMANIO + 5 }, (_, i) => ({
      name: { common: `Pais${i}` },
      region: 'Europe',
      capital: [`Capital${i}`],
      population: i * 1000,
      flags: { png: `flag${i}.png`, svg: `flag${i}.svg` },
    })) as Pais[];

    component.paises.set(muchosPaises);
    component.paginaSiguiente();

    expect(component.paginaActual()).toBe(2);
    expect(component.paisesPagina().length).toBe(5);
  });

  it('should not go beyond last page', () => {
    component.paises.set(mockPaises);

    component.irAPagina(99);

    expect(component.paginaActual()).toBe(component.totalPaginas());
  });

  it('should reset page to 1 when filters change', () => {
    const TAMANIO = PaisComponent.TAMANIO_PAGINA;
    const muchosPaises = Array.from({ length: TAMANIO + 5 }, (_, i) => ({
      name: { common: `Pais${i}` },
      region: 'Europe',
      capital: [`Capital${i}`],
      population: i * 1000,
      flags: { png: `flag${i}.png`, svg: `flag${i}.svg` },
    })) as Pais[];

    component.paises.set(muchosPaises);
    component.irAPagina(2);
    expect(component.paginaActual()).toBe(2);

    component.actualizarBusqueda('algo');

    expect(component.paginaActual()).toBe(1);
  });

  it('should reset page to 1 when filters are cleared', () => {
    const TAMANIO = PaisComponent.TAMANIO_PAGINA;
    const muchosPaises = Array.from({ length: TAMANIO + 5 }, (_, i) => ({
      name: { common: `Pais${i}` },
      region: 'Europe',
      capital: [`Capital${i}`],
      population: i * 1000,
      flags: { png: `flag${i}.png`, svg: `flag${i}.svg` },
    })) as Pais[];

    component.paises.set(muchosPaises);
    component.irAPagina(2);

    component.limpiarFiltros();

    expect(component.paginaActual()).toBe(1);
  });

  it('should mark help as seen when closed', () => {
    localStorage.removeItem('paises-ayuda-atajos-vista');
    component.ayudaAtajosAbierta.set(true);

    component.cerrarAyudaAtajos();

    expect(component.ayudaAtajosAbierta()).toBe(false);
    expect(component.ayudaFueVista()).toBe(true);
  });
});

describe('PaisComponent – first visit', () => {
  beforeEach(async () => {
    localStorage.removeItem('paises-ayuda-atajos-vista');

    await TestBed.configureTestingModule({
      imports: [PaisComponent],
      providers: [
        provideRouter([]),
        { provide: PaisesService, useValue: { obtenerPaises: vi.fn(() => of([])) } },
      ],
    }).compileComponents();
  });

  it('should open help panel automatically on first visit', async () => {
    const fixture = TestBed.createComponent(PaisComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.ayudaAtajosAbierta()).toBe(true);
  });
});

describe('PaisComponent – returning visit', () => {
  beforeEach(async () => {
    localStorage.setItem('paises-ayuda-atajos-vista', '1');

    await TestBed.configureTestingModule({
      imports: [PaisComponent],
      providers: [
        provideRouter([]),
        { provide: PaisesService, useValue: { obtenerPaises: vi.fn(() => of([])) } },
      ],
    }).compileComponents();
  });

  it('should not open help panel when already seen', async () => {
    const fixture = TestBed.createComponent(PaisComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.ayudaAtajosAbierta()).toBe(false);
  });
});
