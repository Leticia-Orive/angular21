import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Pais } from '../../models/pais-interface';
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

  formatearPoblacion(poblacion: number): string {
    return poblacion.toLocaleString('es-ES');
  }

  obtenerBandera(pais: Pais): string | null {
    return pais.flags?.png || pais.flags?.svg || null;
  }

  private cargarDetalle(): void {
    const nombre = this.route.snapshot.paramMap.get('nombre');

    if (!nombre) {
      this.error.set('No se ha indicado un pais valido.');
      this.cargando.set(false);
      return;
    }

    this.paisService.obtenerPaises().subscribe({
      next: (data) => {
        const paisEncontrado = data.find((pais) => pais.name.common === nombre);

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
