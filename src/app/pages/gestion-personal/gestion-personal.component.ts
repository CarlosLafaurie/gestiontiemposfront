import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EmpleadoService, Empleado } from '../../services/empleado-service.service';
import { TiemposService, Tiempo } from '../../services/tiempos.service.service';
import { ObraService, Obra } from '../../services/obras.service';
import { CommonModule } from '@angular/common';
import { ListaTiemposComponent } from '../../lista-tiempos/lista-tiempos.component';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { forkJoin } from 'rxjs';

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
  responsable     = '';
  rol             = '';
  obraId          = '';
  obraNombre      = '';
  empleados       : Empleado[] = [];
  empleadosFiltrados: Empleado[] = [];
  empleadosSeleccionados: { id: number; nombre: string }[] = [];
  guardandoTiempos = false;
  searchQuery      = '';
  todosSeleccionados = false;

  private authService     = inject(AuthService);
  private empleadoService = inject(EmpleadoService);
  private obraService     = inject(ObraService);
  private tiemposService  = inject(TiemposService);
  private router          = inject(Router);

  ngOnInit(): void {
    // 1) Leer datos del usuario
    const usuarioJson = localStorage.getItem('usuario');
    if (usuarioJson) {
      const { nombreCompleto, rol, obra } = JSON.parse(usuarioJson);
      this.responsable = nombreCompleto;
      this.rol         = rol;
      this.obraId      = (rol === 'responsable') ? obra : '';
    }

    // 2) Si es responsable, obtenemos el nombre de la obra antes de cargar empleados
    if (this.rol === 'responsable' && this.obraId) {
      this.obraService.getObras().subscribe((obras: Obra[]) => {
        const match = obras.find(o => o.id === +this.obraId);
        this.obraNombre = match?.nombreObra ?? '';
        this.obtenerTodosEmpleados();
      });
    } else {
      this.obtenerTodosEmpleados();
    }
  }

  private obtenerTodosEmpleados(): void {
    this.empleadoService.obtenerEmpleados(1, 150).subscribe(data => {
      console.log('Total empleados cargados:', data.length);

      if (this.rol === 'responsable' && this.obraNombre) {
        // Filtrar por nombre de obra
        this.empleados = data.filter(emp => emp.obra === this.obraNombre);
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
        error: ()      => emp.fechaHoraEntrada = null
      });
      this.tiemposService.obtenerUltimaSalidaPorEmpleado(emp.id).subscribe({
        next: salida => emp.fechaHoraSalida = salida?.fechaHoraSalida ?? null,
        error: ()      => emp.fechaHoraSalida = null
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
        fechaHoraSalida:  accion === 'salida' ? new Date().toISOString() : null,
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

  esFechaDeHoy(fechaStr: string | null): boolean {
    if (!fechaStr) return false;
    return new Date(fechaStr).toDateString() === new Date().toDateString();
  }

  obtenerClaseFila(emp: Empleado): string {
    const inHoy  = this.esFechaDeHoy(emp.fechaHoraEntrada  ?? null);
    const outHoy = this.esFechaDeHoy(emp.fechaHoraSalida   ?? null);
    if (inHoy && outHoy)   return 'fila-ingreso-salida';
    if (inHoy)             return 'fila-solo-ingreso';
    return '';
  }
}
