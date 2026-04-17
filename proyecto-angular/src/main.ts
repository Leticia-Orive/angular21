/**
 * Archivo de arranque en navegador.
 * Sirve para inicializar la aplicacion Angular en el cliente con la configuracion principal.
 */
import { bootstrapApplication } from '@angular/platform-browser';

import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
