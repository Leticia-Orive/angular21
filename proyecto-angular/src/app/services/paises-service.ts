import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
  private apiUrl = 'https://restcountries.com/v3.1/all?fields=name,capital,population,flags';

  constructor(private http: HttpClient){}

  /**
   * Realiza la peticion GET y devuelve un Observable con un array de paises.
   */
  obtenerPaises(): Observable<Pais[]>{
    return this.http.get<Pais[]>(this.apiUrl);
  }
}
