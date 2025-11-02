import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/instruments',
    pathMatch: 'full'
  },
  {
    path: 'instruments',
    loadComponent: () => import('./instruments/instrument-list/instrument-list.component').then(m => m.InstrumentListComponent)
  },
  {
    path: 'instruments/new',
    loadComponent: () => import('./instruments/instrument-form/instrument-form.component').then(m => m.InstrumentFormComponent)
  },
  {
    path: 'instruments/:id',
    loadComponent: () => import('./instruments/instrument-detail/instrument-detail.component').then(m => m.InstrumentDetailComponent)
  },
  {
    path: 'instruments/:id/edit',
    loadComponent: () => import('./instruments/instrument-form/instrument-form.component').then(m => m.InstrumentFormComponent)
  }
];
