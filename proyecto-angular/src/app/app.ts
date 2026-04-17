/**
 * Componente raiz de la aplicacion.
 * Sirve como punto de entrada visual y delega la navegacion al enrutador.
 */
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('proyecto-angular');
}
