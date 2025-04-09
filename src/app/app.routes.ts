import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { SignupComponent } from './pages/signup/signup.component';
import { ListaObrasComponent } from './lista-obras/lista-obras.component';
import { DetalleObraComponent } from './pages/detalle-obra/detalle-obra.component';
import { GestionPersonalComponent } from './pages/gestion-personal/gestion-personal.component';
import { PanelDeControlComponent } from './pages/panel-de-control/panel-de-control.component';
import { UsuariosAdminComponent } from './pages/usuarios-admin/usuarios-admin.component';
import { EmpleadosAdminComponent } from './pages/empleados-admin/empleados-admin.component'
import { ObrasAdminComponent } from './pages/obras-admin/obras-admin.component';
import { TiemposAdminComponent } from './pages/tiempos-admin/tiempos-admin.component';
import { PermisosAdminComponent } from './pages/permisos-admin/permisos-admin.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'obras', component: ListaObrasComponent, canActivate: [authGuard] },
  { path: 'gestionIngresos/:nombreObra', component: GestionPersonalComponent, canActivate: [authGuard] },
  { path: 'panel-control', component: PanelDeControlComponent, canActivate: [authGuard, adminGuard] },
  { path: 'usuario-admin', component: UsuariosAdminComponent, canActivate: [authGuard, adminGuard] },
  { path: 'empleado-admin', component: EmpleadosAdminComponent, canActivate: [authGuard, adminGuard] },
  { path: 'obras-admin', component: ObrasAdminComponent, canActivate: [authGuard, adminGuard] },
  { path: 'tiempos-admin', component: TiemposAdminComponent, canActivate: [authGuard, adminGuard] },
  { path: 'permisos-admin', component: PermisosAdminComponent, canActivate: [authGuard, adminGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'obra/:id', component: DetalleObraComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];
