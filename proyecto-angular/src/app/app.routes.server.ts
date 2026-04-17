/**
 * Rutas de renderizado en servidor.
 * Sirven para decidir que rutas se prerenderizan y cuales se renderizan en SSR.
 */
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'pais/:nombre',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
