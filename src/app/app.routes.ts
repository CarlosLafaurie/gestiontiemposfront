import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { SignupComponent } from './pages/signup/signup.component';
import { ListaObrasComponent } from './lista-obras/lista-obras.component';
import { DetalleObraComponent } from './pages/detalle-obra/detalle-obra.component';
import { GestionPersonalComponent } from './pages/gestion-personal/gestion-personal.component';
import { PanelDeControlComponent } from './pages/panel-de-control/panel-de-control.component';
import { UsuariosAdminComponent } from './pages/usuarios-admin/usuarios-admin.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'obras', component: ListaObrasComponent, canActivate: [authGuard] },
  { path: 'gestionIngresos/:nombreObra', component: GestionPersonalComponent, canActivate: [authGuard] },
  { path: 'panel-control', component: PanelDeControlComponent, canActivate: [authGuard] },
  { path: 'usuario-admin', component: PanelDeControlComponent, canActivate: [authGuard] },
  

  
  { path: 'obra/:id', component: DetalleObraComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];
