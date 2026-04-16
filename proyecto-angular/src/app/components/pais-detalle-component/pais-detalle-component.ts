import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';
import { Pais } from '../../models/pais-interface';
import { FavoritosService } from '../../services/favoritos.service';
import { PaisesService } from '../../services/paises-service';

@Component({
  selector: 'app-pais-detalle-component',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pais-detalle-component.html',
  styleUrl: './pais-detalle-component.css',
})
export class PaisDetalleComponent {
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paisService = inject(PaisesService);
  readonly favoritosService = inject(FavoritosService);

  catalogoPaises = signal<Pais[]>([]);
  pais = signal<Pais | null>(null);
  paisComparado = signal<Pais | null>(null);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  errorComparacion = signal<string | null>(null);
  nombreComparacion = signal<string>('');

  opcionesComparacion = computed(() => {
    const nombreActual = this.pais()?.name.common;

    return this.catalogoPaises().filter((pais) => pais.name.common !== nombreActual);
  });

  constructor() {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([params, queryParams]) => {
        this.cargarDetalle(params.get('nombre'), queryParams.get('compare'));
      });
  }

  obtenerCapital(pais: Pais): string {
    return pais.capital?.[0] || 'Sin capital disponible';
  }

  obtenerRegion(pais: Pais): string {
    return pais.region || 'Sin region';
  }

  obtenerSubregion(pais: Pais): string {
    return pais.subregion || 'Sin subregion';
  }

  formatearPoblacion(poblacion: number): string {
    return poblacion.toLocaleString('es-ES');
  }

  formatearArea(area?: number): string {
    return typeof area === 'number' ? `${area.toLocaleString('es-ES')} km2` : 'Sin dato de area';
  }

  obtenerIdiomas(pais: Pais): string[] {
    if (!pais.languages) {
      return [];
    }

    const idiomas = Object.values(pais.languages);
    return idiomas;
  }

  obtenerMonedas(pais: Pais): string[] {
    if (!pais.currencies) {
      return [];
    }

    const monedas = Object.values(pais.currencies).map((moneda) => {
      return moneda.symbol ? `${moneda.name} (${moneda.symbol})` : moneda.name;
    });

    return monedas;
  }

  obtenerZonaHorariaPrincipal(pais: Pais): string {
    return pais.timezones?.[0] || 'Sin zona horaria';
  }

  obtenerZonasHorarias(pais: Pais): string[] {
    return pais.timezones ?? [];
  }

  obtenerBandera(pais: Pais): string | null {
    return pais.flags?.png || pais.flags?.svg || null;
  }

  esFavorito(nombrePais: string): boolean {
    return this.favoritosService.esFavorito(nombrePais);
  }

  toggleFavorito(nombrePais: string): void {
    this.favoritosService.toggleFavorito(nombrePais);
  }

  seleccionarComparacion(nombrePais: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParamsHandling: 'merge',
      queryParams: {
        compare: nombrePais || null,
      },
    });
  }

  limpiarComparacion(): void {
    this.seleccionarComparacion('');
  }

  private cargarDetalle(nombre: string | null, nombreComparado: string | null): void {
    if (!nombre) {
      this.pais.set(null);
      this.paisComparado.set(null);
      this.catalogoPaises.set([]);
      this.nombreComparacion.set('');
      this.errorComparacion.set(null);
      this.error.set('No se ha indicado un pais valido.');
      this.cargando.set(false);
      return;
    }

    this.cargando.set(true);
    this.error.set(null);
    this.errorComparacion.set(null);

    this.paisService.obtenerPaises().subscribe({
      next: (paises) => {
        this.catalogoPaises.set(paises);

        const paisEncontrado = this.buscarPaisPorNombre(paises, nombre);

        if (!paisEncontrado) {
          this.pais.set(null);
          this.paisComparado.set(null);
          this.nombreComparacion.set('');
          this.error.set('No se encontro el pais solicitado.');
          this.cargando.set(false);
          return;
        }

        this.pais.set(paisEncontrado);
        this.error.set(null);

        if (!nombreComparado || nombreComparado === paisEncontrado.name.common) {
          this.paisComparado.set(null);
          this.nombreComparacion.set('');
          this.cargando.set(false);
          return;
        }

        const paisParaComparar = this.buscarPaisPorNombre(paises, nombreComparado);

        if (!paisParaComparar) {
          this.paisComparado.set(null);
          this.nombreComparacion.set('');
          this.errorComparacion.set('No se encontro el pais seleccionado para comparar.');
          this.cargando.set(false);
          return;
        }

        this.paisComparado.set(paisParaComparar);
        this.nombreComparacion.set(paisParaComparar.name.common);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el detalle del pais', err);
        this.pais.set(null);
        this.paisComparado.set(null);
        this.catalogoPaises.set([]);
        this.nombreComparacion.set('');
        this.errorComparacion.set(null);
        this.error.set('No se pudo cargar el detalle del pais.');
        this.cargando.set(false);
      },
    });
  }

  private buscarPaisPorNombre(paises: Pais[], nombre: string): Pais | null {
    return paises.find((pais) => pais.name.common === nombre) ?? null;
  }
}
