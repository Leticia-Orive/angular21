import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  private route = inject(ActivatedRoute);
  private paisService = inject(PaisesService);
  readonly favoritosService = inject(FavoritosService);

  pais = signal<Pais | null>(null);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor() {
    this.cargarDetalle();
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

  private cargarDetalle(): void {
    const nombre = this.route.snapshot.paramMap.get('nombre');

    if (!nombre) {
      this.error.set('No se ha indicado un pais valido.');
      this.cargando.set(false);
      return;
    }

    this.paisService.obtenerPaisPorNombre(nombre).subscribe({
      next: (paisEncontrado) => {
        if (!paisEncontrado) {
          this.error.set('No se encontro el pais solicitado.');
          this.cargando.set(false);
          return;
        }

        this.pais.set(paisEncontrado);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el detalle del pais', err);
        this.error.set('No se pudo cargar el detalle del pais.');
        this.cargando.set(false);
      },
    });
  }
}
