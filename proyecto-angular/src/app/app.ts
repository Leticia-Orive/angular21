import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PaisComponent } from './components/pais-component/pais-component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PaisComponent],
  template: `<app-pais-component/>` ,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('proyecto-angular');
}
