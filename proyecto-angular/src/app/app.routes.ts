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
