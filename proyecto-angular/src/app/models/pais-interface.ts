/**
 * Modelo de datos para representar un pais en la aplicacion.
 *
 * Para que sirve:
 * - Define la estructura que deben tener los datos de un pais.
 * - Ayuda a TypeScript a validar tipos y evita errores al usar la respuesta de una API.
 * - Mejora autocompletado y mantenimiento del codigo.
 *
 * Como se utiliza:
 * 1) Importa la interfaz donde la necesites.
 *    import { Pais } from './models/pais-interface';
 *
 * 2) Tipa variables, parametros o respuestas HTTP.
 *    paises: Pais[] = [];
 *
 * 3) Accede a propiedades con seguridad de tipos.
 *    const nombre = pais.name.common;
 *    const capital = pais.capital[0];
 */
export interface Pais {
    name: {
        common : string;
    }
    region: string;
    capital: string[];
    population: number;
    flags: {
        png : string;
        svg: string
    }
}
