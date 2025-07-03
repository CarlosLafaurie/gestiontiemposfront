import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EmpleadoService, Empleado } from '../../services/empleado-service.service';
import { TiemposService, Tiempo } from '../../services/tiempos.service.service';
import { CommonModule } from '@angular/common';
import { ListaTiemposComponent } from '../../lista-tiempos/lista-tiempos.component';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { forkJoin } from 'rxjs';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

@Component({
  selector: 'app-gestion-personal',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ListaTiemposComponent,
    NavbarComponent,
    BotonRegresarComponent
  ],
  templateUrl: './gestion-personal.component.html',
  styleUrls: ['./gestion-personal.component.css']
})
export class GestionPersonalComponent implements OnInit {
  responsable = '';
  rol = '';
  empleados: Empleado[] = [];
  empleadosFiltrados: Empleado[] = [];
  empleadosSeleccionados: { id: number; nombre: string }[] = [];
  guardandoTiempos = false;
  searchQuery = '';
  todosSeleccionados = false;
  obra: string = '';

  private empleadoService = inject(EmpleadoService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private tiemposService = inject(TiemposService);

  ngOnInit(): void {
    this.obtenerTodosEmpleados();

    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      const { nombreCompleto, rol, obra } = JSON.parse(usuario);
      this.responsable = nombreCompleto;
      this.rol = rol;
      if (rol === 'responsable') {
        this.obra = obra;
      }
    }
  }

  private obtenerTodosEmpleados(): void {
    this.empleadoService.obtenerEmpleados(1, 150).subscribe(data => {
      console.log('Total empleados cargados:', data.length);

      if (this.rol === 'responsable' && this.obra) {
        this.empleados = data.filter(emp => emp.obra === this.obra);
      } else {
        this.empleados = data;
      }

      this.applySort();
      this.cargarTiemposParaTodos();
      this.aplicarFiltro();
    });
  }

  private cargarTiemposParaTodos(): void {
    this.empleados.forEach(emp => {
      this.tiemposService.obtenerUltimoIngresoPorEmpleado(emp.id).subscribe({
        next: ingreso => emp.fechaHoraEntrada = ingreso?.fechaHoraEntrada ?? null,
        error: () => emp.fechaHoraEntrada = null
      });

      this.tiemposService.obtenerUltimaSalidaPorEmpleado(emp.id).subscribe({
        next: salida => emp.fechaHoraSalida = salida?.fechaHoraSalida ?? null,
        error: () => emp.fechaHoraSalida = null
      });
    });
  }


  filtrarEmpleados(): void {
    this.aplicarFiltro();
  }

  private aplicarFiltro(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.empleadosFiltrados = q
      ? this.empleados.filter(emp =>
          emp.nombreCompleto.toLowerCase().includes(q) ||
          emp.cedula.toLowerCase().includes(q) ||
          emp.cargo.toLowerCase().includes(q) ||
          emp.obra.toLowerCase().includes(q) ||
          emp.responsable.toLowerCase().includes(q) ||
          (emp.responsableSecundario || '').toLowerCase().includes(q)
        )
      : [...this.empleados];
  }

  private applySort(): void {
    this.empleados.sort((a, b) =>
      a.nombreCompleto.localeCompare(b.nombreCompleto, undefined, { sensitivity: 'base' })
    );
  }

  toggleSeleccionarTodos(): void {
  this.empleadosFiltrados.forEach(emp => (emp.seleccionado = this.todosSeleccionados));
  this.gestionarTiempos();
}

  verificarSeleccionIndividual(): void {
    this.todosSeleccionados = this.empleadosFiltrados.every(emp => emp.seleccionado);
    this.gestionarTiempos();
  }

  gestionarTiempos(): void {
    this.empleadosSeleccionados = this.empleadosFiltrados
      .filter(emp => emp.seleccionado)
      .map(emp => ({ id: emp.id, nombre: emp.nombreCompleto }));
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
        permisosEspeciales: ''
      };
      return accion === 'ingreso'
        ? this.tiemposService.registrarIngreso(tiempo)
        : this.tiemposService.registrarSalida(tiempo);
    });

    forkJoin(observables).subscribe({
      next: () => {
        alert(`✅ ${accion === 'ingreso' ? 'Ingresos' : 'Salidas'} registradas correctamente.`);
        window.location.reload();
      },
      error: err => {
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
