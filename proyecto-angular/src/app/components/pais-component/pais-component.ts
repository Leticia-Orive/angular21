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

  // Lista derivada que aplica el filtro en tiempo real por nombre comun.
  paisesFiltrados = computed(() => {
    const termino = this.terminoBusqueda().trim().toLowerCase();

    if (!termino) {
      return this.paises();
    }

    return this.paises().filter((pais) =>
      pais.name.common.toLowerCase().includes(termino)
    );
  });

  // Al crear el componente, dispara la primera carga de datos.
  constructor(){
    this.cargarPaises();
  }

  // Actualiza el texto de busqueda cuando el usuario escribe en el input.
  actualizarBusqueda(valor: string): void {
    this.terminoBusqueda.set(valor);
  }

  // Obtiene los paises, los ordena alfabeticamente y actualiza el estado.
  cargarPaises(): void{
    this.paisService.obtenerPaises().subscribe({
      next: (data)=>{
        const paisesOrdenados = data.sort((a,b)=>
          a.name.common.localeCompare(b.name.common)
        );

        this.paises.set(paisesOrdenados);
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
