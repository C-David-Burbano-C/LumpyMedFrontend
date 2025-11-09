import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'calculator',
    loadChildren: () => import('./modules/calculator/calculator.module').then(m => m.CalculatorModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'medicines',
    loadChildren: () => import('./modules/medicines/medicines.module').then(m => m.MedicinesModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ADMIN' }
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
