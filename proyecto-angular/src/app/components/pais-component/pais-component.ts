import { Component, computed, inject, signal } from '@angular/core';
import { PaisesService } from '../../services/paises-service';
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
  imports: [],
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

    const filtrados = this.paises().filter((pais) => {
      const coincideNombre = !termino || pais.name.common.toLowerCase().includes(termino);
      const coincideRegion = region === 'Todas' || pais.region === region;

      return coincideNombre && coincideRegion;
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

  // Al crear el componente, dispara la primera carga de datos.
  constructor(){
    this.cargarPaises();
  }

  // Actualiza el texto de busqueda cuando el usuario escribe en el input.
  actualizarBusqueda(valor: string): void {
    this.terminoBusqueda.set(valor);
  }

  // Actualiza la region activa del filtro.
  actualizarRegion(valor: string): void {
    this.regionSeleccionada.set(valor);
  }

  // Actualiza el criterio de orden activo.
  actualizarOrden(valor: string): void {
    this.ordenSeleccionado.set(valor);
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

  // Obtiene los paises y actualiza el estado.
  cargarPaises(): void{
    this.paisService.obtenerPaises().subscribe({
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
}
