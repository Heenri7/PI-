import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { Router } from '@angular/router';
import { Login } from './pages/login/login';
import { Cadastro } from './pages/cadastro/cadastro';
import { GerenciarProdutos } from './pages/gerenciar-produtos/gerenciar-produtos';
import { Produtos } from './pages/produtos/produtos';

function verificarAdministrador(): boolean | ReturnType<Router['createUrlTree']> {
  if (sessionStorage.getItem('admLogado') === 'true') {
    return true;
  }

  return inject(Router).createUrlTree(['/login']);
}

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'cadastro', component: Cadastro },
  { path: 'produtos', component: Produtos, canActivate: [verificarAdministrador] },
  { path: 'gerenciar', component: GerenciarProdutos, canActivate: [verificarAdministrador] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];