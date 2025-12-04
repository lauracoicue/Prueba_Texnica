import { Routes } from '@angular/router';


export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/hero-list/hero-list.component')
            .then(m => m.HeroListComponent) // Lista principal
    },
    {
        path: 'hero/:id',
        loadComponent: () => import('./components/hero-detail/hero-detail.component')
            .then(m => m.HeroDetailComponent) // Detalle de héroe
    },
    {
        path: '**',
        redirectTo: '' // Redirige rutas no encontradas
    }
];