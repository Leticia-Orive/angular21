import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { Pais } from '../models/pais-interface';

/**
 * Servicio para centralizar el acceso a la API de paises.
 *
 * Para que sirve:
 * - Encapsula la llamada HTTP para obtener paises.
 * - Devuelve datos tipados con la interfaz `Pais`.
 * - Permite reutilizar la misma logica desde cualquier componente.
 *
 * Como se utiliza:
 * 1) Inyecta `PaisesService` en un componente.
 * 2) Llama a `obtenerPaises()` y suscribete al Observable.
 *
 * Ejemplo rapido:
 *
 * constructor(private paisesService: PaisesService) {}
 *
 * ngOnInit(): void {
 *   this.paisesService.obtenerPaises().subscribe((data) => {
 *     this.paises = data;
 *   });
 * }
 */
@Injectable({
  providedIn: 'root',
})
export class PaisesService {
  private apiUrl = 'https://restcountries.com/v3.1/all?fields=name,region,subregion,capital,population,area,timezones,languages,currencies,flags';

  // Guarda en memoria la respuesta para reutilizarla sin repetir la llamada HTTP.
  private paisesCache$?: Observable<Pais[]>;

  constructor(private http: HttpClient){}

  /**
   * Realiza la peticion GET una sola vez y reutiliza el resultado en siguientes llamadas.
   */
  obtenerPaises(forceRefresh = false): Observable<Pais[]>{
    if (forceRefresh) {
      this.paisesCache$ = undefined;
    }

    if (!this.paisesCache$) {
      this.paisesCache$ = this.http.get<Pais[]>(this.apiUrl).pipe(
        shareReplay(1)
      );
    }

    return this.paisesCache$;
  }

  obtenerPaisPorNombre(nombre: string): Observable<Pais | undefined> {
    const nombreNormalizado = nombre.trim().toLowerCase();

    return this.obtenerPaises().pipe(
      map((paises) => {
        return paises.find((pais) => pais.name.common.toLowerCase() === nombreNormalizado);
      })
    );
  }
}
