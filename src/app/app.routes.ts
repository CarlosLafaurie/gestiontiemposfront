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
import { InventarioComponent } from './pages/inventario/inventario.component';
import { MovimientoComponent } from './pages/movimiento/movimiento-component';
import { SolicitudesComponent } from './pages/solicitudes/solicitudes.component';
import { InventarioInternoComponent } from './pages/inventario-interno/inventario-interno.component';
import { InventariosComponent } from './pages/inventarios/inventarios.component';
import { RevisionInventarioComponent } from './pages/revision-inventario/revision-inventario.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { MetricasComponent } from './pages/metricas/metricas.component';

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
  { path: 'inventario', component: InventarioComponent, canActivate: [authGuard] },
  { path: 'movimientos', component: MovimientoComponent, canActivate: [authGuard, adminGuard] },
  { path: 'solicitudes', component: SolicitudesComponent, canActivate: [authGuard] },
  { path: 'inventario-interno/:nombreObra', component: InventarioInternoComponent, canActivate: [authGuard] },
  { path: 'inventarios', component: InventariosComponent, canActivate: [authGuard] },
  { path: 'revision-inventario', component: RevisionInventarioComponent, canActivate: [authGuard] },
  { path: 'metricas', component: MetricasComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
