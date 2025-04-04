import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EmpleadoService, Empleado } from '../../services/empleado-service.service';
import { TiemposService, Tiempo } from '../../services/tiempos.service.service';
import { CommonModule } from '@angular/common';
import { ListaTiemposComponent } from '../../lista-tiempos/lista-tiempos.component';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-gestion-personal',
  templateUrl: './gestion-personal.component.html',
  styleUrls: ['./gestion-personal.component.css'],
  imports: [FormsModule, CommonModule, ListaTiemposComponent, NavbarComponent]
})
export class GestionPersonalComponent implements OnInit {
  nombreObra: string = '';
  responsable: string = '';
  rol: string = '';
  empleados: Empleado[] = [];
  empleadosFiltrados: Empleado[] = [];
  empleadosSeleccionados: any[] = [];
  guardandoTiempos = false;
  searchQuery: string = ''; 

  private route = inject(ActivatedRoute);
  private empleadoService = inject(EmpleadoService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private tiemposService = inject(TiemposService);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.nombreObra = params.get('nombreObra')?.replace(/-/g, ' ') || '';
      this.obtenerEmpleados();
    });

    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      const usuarioParseado = JSON.parse(usuario);
      this.responsable = usuarioParseado.nombreCompleto;
      this.rol = usuarioParseado.rol;
    }
  }

  obtenerEmpleados(): void {
    this.empleadoService.obtenerEmpleados().subscribe((data) => {
      this.empleados = data.map(emp => ({ ...emp, seleccionado: false }));
      this.filtrarEmpleados();
    });
  }

  filtrarEmpleados(): void {
    const obraFiltro = this.nombreObra.trim().toLowerCase();

    // Filtrar por obra primero
    this.empleadosFiltrados = this.empleados.filter(empleado =>
      empleado.obra.trim().toLowerCase() === obraFiltro
    );

    // Aplicar la búsqueda dentro de los empleados ya filtrados
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      this.empleadosFiltrados = this.empleadosFiltrados.filter(u =>
        (u.nombreCompleto && u.nombreCompleto.toLowerCase().includes(q)) ||
        (u.responsable && u.responsable.toLowerCase().includes(q)) ||
        (u.responsableSecundario && u.responsableSecundario.toLowerCase().includes(q)) ||
        (u.cedula && u.cedula.toLowerCase().includes(q)) ||
        (u.cargo && u.cargo.toLowerCase().includes(q)) ||
        (u.obra && u.obra.toLowerCase().includes(q))
      );
    }
  }

  gestionarTiempos(): void {
    this.empleadosSeleccionados = this.empleadosFiltrados.filter(e => e.seleccionado).map(e => ({ id: e.id, nombre: e.nombreCompleto }));
  }

  registrarIngreso(): void {
    this.registrarTiempos('ingreso');
  }

  registrarSalida(): void {
    this.registrarTiempos('salida');
  }

  private registrarTiempos(accion: 'ingreso' | 'salida'): void {
    this.guardandoTiempos = true;
    const observables = this.empleadosSeleccionados.map(empleado => {
      const tiempo: Tiempo = {
        empleadoId: empleado.id,
        fechaHoraEntrada: accion === 'ingreso' ? new Date().toISOString() : null,
        fechaHoraSalida: accion === 'salida' ? new Date().toISOString() : null,
        comentarios: '',
        permisosEspeciales: '',
      };
      return accion === 'ingreso' ? this.tiemposService.registrarIngreso(tiempo) : this.tiemposService.registrarSalida(tiempo);
    });

    forkJoin(observables).subscribe({
      next: () => {
        alert(`✅ ${accion === 'ingreso' ? 'Ingresos' : 'Salidas'} registradas correctamente.`);
        window.location.reload();
      },
      error: (err) => {
        console.error(`❌ Error al registrar ${accion}`, err);
        alert(`❌ Error al registrar ${accion}.`);
      },
      complete: () => {
        this.guardandoTiempos = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
