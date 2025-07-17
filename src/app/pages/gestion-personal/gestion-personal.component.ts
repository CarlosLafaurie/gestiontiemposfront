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

type EstadoTemporal = 'ingreso-salida' | 'solo-ingreso' | 'falta-ingreso' | 'sin-tiempos';

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
  responsable           = '';
  rol                   = '';
  obraId                = '';
  obraNombre            = '';
  empleados: Empleado[] = [];
  empleadosFiltrados: Empleado[] = [];
  empleadosSeleccionados: { id: number; nombreEmpleado: string; obra: string }[] = [];
  guardandoTiempos      = false;
  searchQuery           = '';
  todosSeleccionados    = false;
  filtroEstado: EstadoTemporal | null = null;

  private authService     = inject(AuthService);
  private empleadoService = inject(EmpleadoService);
  private obraService     = inject(ObraService);
  private tiemposService  = inject(TiemposService);
  private router          = inject(Router);

  ngOnInit(): void {
    const usuarioJson = localStorage.getItem('usuario');
    if (usuarioJson) {
      const { nombreCompleto, rol, obra } = JSON.parse(usuarioJson);
      this.responsable = nombreCompleto;
      this.rol         = rol;
      this.obraId      = (rol === 'responsable') ? obra : '';
    }
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
      this.empleados = (this.rol === 'responsable' && this.obraNombre)
        ? data.filter(emp => emp.obra === this.obraNombre)
        : data;
      this.applySort();
      this.cargarTiemposParaTodos();
      this.aplicarFiltro();
    });
  }

  private cargarTiemposParaTodos(): void {
    this.empleados.forEach(emp => {
      forkJoin({
        ing: this.tiemposService.obtenerUltimoIngresoPorEmpleado(emp.id),
        sal: this.tiemposService.obtenerUltimaSalidaPorEmpleado(emp.id)
      }).subscribe({
        next: ({ ing, sal }) => {
          emp.fechaHoraEntrada = ing?.fechaHoraEntrada ?? null;
          emp.fechaHoraSalida  = sal?.fechaHoraSalida  ?? null;
          emp.estadoTemporario = this.calcularEstadoTemporal(emp);
          this.aplicarFiltro();
        },
        error: () => {
          emp.fechaHoraEntrada = emp.fechaHoraEntrada ?? null;
          emp.fechaHoraSalida  = emp.fechaHoraSalida  ?? null;
          emp.estadoTemporario = this.calcularEstadoTemporal(emp);
          this.aplicarFiltro();
        }
      });
    });
  }

  filtrarEmpleados(): void {
    this.aplicarFiltro();
  }

  filtrarPorEstado(estado: EstadoTemporal): void {
    this.filtroEstado = (this.filtroEstado === estado) ? null : estado;
    this.aplicarFiltro();
  }

  private aplicarFiltro(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.empleadosFiltrados = this.empleados.filter(emp => {
      const texto = [
        emp.nombreCompleto,
        emp.cedula,
        emp.cargo,
        emp.obra,
        emp.responsable,
        emp.responsableSecundario || ''
      ].join(' ').toLowerCase();
      const pasaTexto  = !q || texto.includes(q);
      const pasaEstado = !this.filtroEstado || emp.estadoTemporario === this.filtroEstado;
      return pasaTexto && pasaEstado;
    });
  }

  obtenerClaseFila(emp: Empleado): string {
    switch ((emp as any).estadoTemporario as EstadoTemporal) {
      case 'ingreso-salida': return 'fila-ingreso-salida';
      case 'solo-ingreso':    return 'fila-solo-ingreso';
      case 'falta-ingreso':   return 'fila-falta-ingreso';
      case 'sin-tiempos':     return 'fila-sin-tiempos';
      default:                return '';
    }
  }

  private applySort(): void {
    this.empleados.sort((a, b) =>
      a.nombreCompleto.localeCompare(b.nombreCompleto, undefined, { sensitivity: 'base' })
    );
  }

  toggleSeleccionarTodos(): void {
    this.empleadosFiltrados.forEach(emp => emp.seleccionado = this.todosSeleccionados);
    this.gestionarTiempos();
  }

  verificarSeleccionIndividual(): void {
    this.todosSeleccionados = this.empleadosFiltrados.every(emp => emp.seleccionado);
    this.gestionarTiempos();
  }

  private gestionarTiempos(): void {
    this.empleadosSeleccionados = this.empleadosFiltrados
      .filter(emp => emp.seleccionado)
      .map(emp => ({
        id: emp.id,
        nombreEmpleado: emp.nombreCompleto,
        obra: emp.obra
      }));
  }

  registrarIngreso(): void { this.registrarTiempos('ingreso'); }
  registrarSalida(): void { this.registrarTiempos('salida'); }

  private registrarTiempos(accion: 'ingreso' | 'salida'): void {
    this.guardandoTiempos = true;
    const ops = this.empleadosSeleccionados.map(e => {
      const t: Tiempo = {
        empleadoId: e.id,
        fechaHoraEntrada: accion === 'ingreso' ? new Date().toISOString() : null,
        fechaHoraSalida:  accion === 'salida'  ? new Date().toISOString() : null,
        comentarios: '',
        permisosEspeciales: ''
      };
      return accion === 'ingreso'
        ? this.tiemposService.registrarIngreso(t)
        : this.tiemposService.registrarSalida(t);
    });
    forkJoin(ops).subscribe({
      next: () => window.location.reload(),
      error: () => alert(`Error al registrar ${accion}`),
      complete: () => this.guardandoTiempos = false
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private calcularEstadoTemporal(emp: Empleado): EstadoTemporal {
    const ahora = new Date(), h = ahora.getHours();
    const esHoy = (d: Date) => d.toDateString() === ahora.toDateString();
    const ing = emp.fechaHoraEntrada ? new Date(emp.fechaHoraEntrada) : null;
    const sal = emp.fechaHoraSalida  ? new Date(emp.fechaHoraSalida)  : null;
    const ingresoHoy = ing && esHoy(ing);
    const salidaHoy  = sal && esHoy(sal);

    if (h >= 9 && !ingresoHoy)          return 'falta-ingreso';
    if (ingresoHoy && salidaHoy)        return 'ingreso-salida';
    if (ingresoHoy && !salidaHoy)       return 'solo-ingreso';
    return 'sin-tiempos';
  }
}
