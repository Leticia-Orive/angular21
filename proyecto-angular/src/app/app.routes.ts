/**
 * Definicion de rutas de la app en cliente.
 * Sirve para mapear URL a componentes de listado y detalle de paises.
 */
import { Routes } from '@angular/router';
import { PaisComponent } from './components/pais-component/pais-component';
import { PaisDetalleComponent } from './components/pais-detalle-component/pais-detalle-component';

export const routes: Routes = [
	{
		path: '',
		component: PaisComponent,
	},
	{
		path: 'pais/:nombre',
		component: PaisDetalleComponent,
	},
];
