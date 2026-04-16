import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaisesService } from '../../services/paises-service';
import { FavoritosService } from '../../services/favoritos.service';
import { Pais } from '../../models/pais-interface';

/**
 * Componente encargado de cargar y preparar la lista de paises para la vista.
 *
 * Para que sirve:
 * - Solicita los paises a la API mediante `PaisesService`.
 * - Gestiona estados de interfaz: carga, exito y error.
 * - Ordena los datos para mostrarlos de forma mas clara al usuario.
 */
@Component({
  selector: 'app-pais-component',
  imports: [RouterLink],
  standalone: true,
  templateUrl: './pais-component.html',
  styleUrl: './pais-component.css',
})
export class PaisComponent {
  // Opciones de orden disponibles para el selector.
  readonly opcionesOrden = [
    { valor: 'nombre-asc', etiqueta: 'Nombre (A-Z)' },
    { valor: 'nombre-desc', etiqueta: 'Nombre (Z-A)' },
    { valor: 'poblacion-asc', etiqueta: 'Poblacion (menor a mayor)' },
    { valor: 'poblacion-desc', etiqueta: 'Poblacion (mayor a menor)' },
  ] as const;

  // Inyeccion del servicio que realiza la llamada HTTP a la API de paises.
  private paisService = inject(PaisesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Servicio para marcar y persistir paises favoritos en localStorage.
  readonly favoritosService = inject(FavoritosService);

  // Estado reactivo con la lista de paises recibidos.
  paises = signal<Pais[]>([]);

  // Estado para mostrar indicador de carga mientras llega la respuesta.
  cargando = signal<boolean>(true);

  // Estado para mostrar mensajes cuando la peticion falla.
  error = signal<string | null>(null);

  // Texto que escribe el usuario para filtrar paises por nombre.
  terminoBusqueda = signal<string>('');

  // Region seleccionada por el usuario para filtrar resultados.
  regionSeleccionada = signal<string>('Todas');

  // Criterio de orden activo.
  ordenSeleccionado = signal<string>('nombre-asc');

  // Indica si mostrar solo favoritos o todos los paises.
  soloFavoritos = signal<boolean>(false);

  // Estado para informar si la URL se pudo copiar al portapapeles.
  estadoCopiaEnlace = signal<'idle' | 'ok' | 'error'>('idle');

  // Regiones disponibles construidas dinamicamente a partir de los datos.
  regionesDisponibles = computed(() => {
    const regiones = new Set(
      this.paises()
        .map((pais) => pais.region)
        .filter((region): region is string => !!region)
    );

    return ['Todas', ...Array.from(regiones).sort((a, b) => a.localeCompare(b))];
  });

  // Lista derivada que aplica filtros y orden en tiempo real.
  paisesFiltrados = computed(() => {
    const termino = this.terminoBusqueda().trim().toLowerCase();
    const region = this.regionSeleccionada();
    const orden = this.ordenSeleccionado();
    const mostrarSoloFavoritos = this.soloFavoritos();

    const filtrados = this.paises().filter((pais) => {
      const coincideNombre = !termino || pais.name.common.toLowerCase().includes(termino);
      const coincideRegion = region === 'Todas' || pais.region === region;
      const esFavorito = this.favoritosService.esFavorito(pais.name.common);
      const coincideFavoritos = !mostrarSoloFavoritos || esFavorito;

      return coincideNombre && coincideRegion && coincideFavoritos;
    });

    return [...filtrados].sort((a, b) => {
      switch (orden) {
        case 'nombre-desc':
          return b.name.common.localeCompare(a.name.common);
        case 'poblacion-asc':
          return a.population - b.population;
        case 'poblacion-desc':
          return b.population - a.population;
        case 'nombre-asc':
        default:
          return a.name.common.localeCompare(b.name.common);
      }
    });
  });

  // Cantidad total de paises marcados como favoritos.
  totalFavoritos = computed(() => this.favoritosService.lista().length);

  // Permite conocer rapidamente si el usuario tiene filtros activos.
  hayFiltrosActivos = computed(() => {
    return !!this.terminoBusqueda().trim() ||
      this.regionSeleccionada() !== 'Todas' ||
      this.ordenSeleccionado() !== 'nombre-asc' ||
      this.soloFavoritos();
  });

  // Resumen visible para dar contexto rapido sobre los resultados actuales.
  resumenResultados = computed(() => {
    const visibles = this.paisesFiltrados();
    const totalPaises = this.paises().length;
    const poblacionTotal = visibles.reduce((total, pais) => total + pais.population, 0);
    const regionMasComun = this.calcularRegionMasComun(visibles);
    const paisMasPoblado = visibles.reduce<Pais | null>((actual, pais) => {
      if (!actual || pais.population > actual.population) {
        return pais;
      }

      return actual;
    }, null);

    return {
      totalPaises,
      visibles: visibles.length,
      poblacionTotal,
      regionMasComun,
      paisMasPoblado,
    };
  });

  // Al crear el componente, dispara la primera carga de datos.
  constructor(){
    this.route.queryParamMap.subscribe((params) => {
      this.terminoBusqueda.set(params.get('q') ?? '');
      this.regionSeleccionada.set(params.get('region') ?? 'Todas');
      this.ordenSeleccionado.set(this.ordenEsValido(params.get('orden')) ? (params.get('orden') as string) : 'nombre-asc');
      this.soloFavoritos.set(params.get('fav') === '1');
    });

    this.cargarPaises();
  }

  // Actualiza el texto de busqueda cuando el usuario escribe en el input.
  actualizarBusqueda(valor: string): void {
    this.terminoBusqueda.set(valor);
    this.actualizarQueryParams();
  }

  // Actualiza la region activa del filtro.
  actualizarRegion(valor: string): void {
    this.regionSeleccionada.set(valor);
    this.actualizarQueryParams();
  }

  // Actualiza el criterio de orden activo.
  actualizarOrden(valor: string): void {
    this.ordenSeleccionado.set(valor);
    this.actualizarQueryParams();
  }

  limpiarFiltros(): void {
    this.terminoBusqueda.set('');
    this.regionSeleccionada.set('Todas');
    this.ordenSeleccionado.set('nombre-asc');
    this.soloFavoritos.set(false);
    this.actualizarQueryParams();
  }

  // Alterna entre mostrar todos los paises o solo favoritos.
  toggleSoloFavoritos(): void {
    this.soloFavoritos.set(!this.soloFavoritos());
    this.actualizarQueryParams();
  }

  // Devuelve la primera capital o un texto alternativo si no existe.
  obtenerCapital(pais: Pais): string {
    return pais.capital?.[0] || 'Sin capital disponible';
  }

  // Devuelve la region o un texto alternativo si no llega informada.
  obtenerRegion(pais: Pais): string {
    return pais.region || 'Sin region';
  }

  // Formatea la poblacion con separadores para mejorar la lectura.
  formatearPoblacion(poblacion: number): string {
    return poblacion.toLocaleString('es-ES');
  }

  // Obtiene una URL de bandera utilizable o null cuando no existe imagen.
  obtenerBandera(pais: Pais): string | null {
    return pais.flags?.png || pais.flags?.svg || null;
  }

  reintentarCarga(): void {
    this.cargarPaises(true);
  }

  async copiarEnlaceBusqueda(): Promise<void> {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      this.estadoCopiaEnlace.set('error');
      return;
    }

    const urlActual = window.location.href;

    if (!navigator.clipboard?.writeText) {
      this.estadoCopiaEnlace.set('error');
      return;
    }

    try {
      await navigator.clipboard.writeText(urlActual);
      this.estadoCopiaEnlace.set('ok');
    } catch {
      this.estadoCopiaEnlace.set('error');
    }
  }

  // Obtiene los paises y actualiza el estado.
  cargarPaises(forceRefresh = false): void{
    this.cargando.set(true);
    this.error.set(null);

    this.paisService.obtenerPaises(forceRefresh).subscribe({
      next: (data)=>{
        this.paises.set(data);
        this.cargando.set(false);
      },
      error: (err)=>{
        console.error('Error al cargar el país', err);
        this.error.set('Error al cargar el país');
        this.cargando.set(false);
      }
    });
  }

  private calcularRegionMasComun(paises: Pais[]): string {
    if (!paises.length) {
      return 'Sin datos';
    }

    const conteo = paises.reduce<Record<string, number>>((acc, pais) => {
      const region = this.obtenerRegion(pais);
      acc[region] = (acc[region] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(conteo).sort((a, b) => b[1] - a[1])[0][0];
  }

  private actualizarQueryParams(): void {
    this.estadoCopiaEnlace.set('idle');

    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        q: this.terminoBusqueda().trim() || null,
        region: this.regionSeleccionada() !== 'Todas' ? this.regionSeleccionada() : null,
        orden: this.ordenSeleccionado() !== 'nombre-asc' ? this.ordenSeleccionado() : null,
        fav: this.soloFavoritos() ? '1' : null,
      },
    });
  }

  private ordenEsValido(valor: string | null): boolean {
    if (!valor) {
      return false;
    }

    return this.opcionesOrden.some((opcion) => opcion.valor === valor);
  }
}
