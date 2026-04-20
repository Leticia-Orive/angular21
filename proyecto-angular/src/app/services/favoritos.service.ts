/**
 * Servicio de favoritos.
 * Sirve para agregar/quitar paises favoritos y persistirlos en localStorage.
 */
import { Injectable, signal, computed } from '@angular/core';

const STORAGE_KEY = 'paises-favoritos';

/**
 * Servicio para gestionar la lista de paises favoritos.
 *
 * Para que sirve:
 * - Guarda y recupera los favoritos en localStorage para que persistan entre sesiones.
 * - Expone senales reactivas para que los componentes reaccionen a cambios.
 *
 * Como se utiliza:
 *   const favs = inject(FavoritosService);
 *   favs.toggleFavorito('Spain');
 *   favs.esFavorito('Spain'); // true/false
 */
@Injectable({ providedIn: 'root' })
export class FavoritosService {
  // Lista interna de nombres de paises favoritos.
  private favoritos = signal<string[]>(this.cargarDeStorage());

  // Lista publica de solo lectura que los componentes pueden leer.
  readonly lista = computed(() => this.favoritos());

  // Devuelve true si el pais esta en la lista de favoritos.
  esFavorito(nombre: string): boolean {
    return this.favoritos().includes(nombre);
  }

  // Alterna el estado favorito de un pais y persiste el cambio.
  toggleFavorito(nombre: string): void {
    const actuales = this.favoritos();

    const nuevos = actuales.includes(nombre)
      ? actuales.filter((n) => n !== nombre)
      : [...actuales, nombre];

    this.favoritos.set(nuevos);
    this.guardarEnStorage(nuevos);
  }

  // Elimina todos los favoritos y limpia el almacenamiento.
  limpiarTodos(): void {
    this.favoritos.set([]);
    this.guardarEnStorage([]);
  }

  private cargarDeStorage(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  private guardarEnStorage(lista: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    } catch {
      // localStorage no disponible en SSR: se ignora silenciosamente.
    }
  }
}
