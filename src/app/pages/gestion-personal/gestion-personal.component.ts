import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EmpleadoService, Empleado } from '../../services/empleado-service.service';
import { TiemposService, Tiempo } from '../../services/tiempos.service.service';
import { AusentismoService, TiempoAusentismo } from '../../services/documento-permiso.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { ListaTiemposComponent } from '../../lista-tiempos/lista-tiempos.component';
import { forkJoin } from 'rxjs';

type EstadoTemporal = 'ingreso-salida' | 'solo-ingreso' | 'falta-ingreso' | 'sin-tiempos' | 'ausentismo';

@Component({
  selector: 'app-gestion-personal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  obraId = '';
  obraNombre = '';   // Nombre de obra a filtrar (solo para roles no-admin)

  empleados: Empleado[] = [];
  empleadosFiltrados: Empleado[] = [];
  empleadosSeleccionados: { id: number; nombreEmpleado: string; obra: string }[] = [];

  guardandoTiempos = false;
  searchQuery = '';
  todosSeleccionados = false;
  filtroEstado: EstadoTemporal | null = null;

  private authService = inject(AuthService);
  private empleadoService = inject(EmpleadoService);
  private tiemposService = inject(TiemposService);
  private ausentismoService = inject(AusentismoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    // 1) Cargo datos de usuario
    const usuarioJson = localStorage.getItem('usuario');
    if (usuarioJson) {
      const { nombreCompleto, rol, obra } = JSON.parse(usuarioJson);
      this.responsable = nombreCompleto;
      this.rol = rol;
      this.obraId = (rol === 'responsable') ? obra : '';
    }

    // 2) Leo parámetro :nombreObra de la ruta
    this.route.paramMap.subscribe(params => {
      const raw = params.get('nombreObra');
      if (raw) {
        this.obraNombre = decodeURIComponent(raw).replace(/-/g, ' ');
      }
      // cargo empleados tras obtener obraNombre
      this.obtenerTodosEmpleados();
    });
  }

  private obtenerTodosEmpleados(): void {
    this.empleadoService.obtenerEmpleados(1, 150).subscribe(data => {
      let lista = data;

      // Solo filtro por obra si NO es admin y sí hay obraNombre
      if (this.rol !== 'admin' && this.obraNombre) {
        lista = data.filter(emp => emp.obra === this.obraNombre);
      }

      // Si es admin, lista = data (todos)
      this.empleados = lista.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
      this.cargarDatosParaTodos();
    });
  }

  private cargarDatosParaTodos(): void {
    this.ausentismoService.getDocumentos().subscribe((permisos: TiempoAusentismo[]) => {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

      this.empleados.forEach(emp => {
        forkJoin({
          ing: this.tiemposService.obtenerUltimoIngresoPorEmpleado(emp.id),
          sal: this.tiemposService.obtenerUltimaSalidaPorEmpleado(emp.id)
        }).subscribe(({ ing, sal }) => {
          const permiso = permisos.find(p =>
            p.nombreEmpleado === emp.nombreCompleto &&
            new Date(p.fechaInicio) <= hoy &&
            new Date(p.fechaFin) >= hoy
          );
          if (permiso) {
            emp.fechaHoraEntrada = new Date(permiso.fechaInicio).toISOString();
            emp.fechaHoraSalida  = new Date(permiso.fechaFin).toISOString();
            emp.estadoTemporario  = 'ausentismo';
          } else {
            emp.fechaHoraEntrada = ing?.fechaHoraEntrada ?? null;
            emp.fechaHoraSalida  = sal?.fechaHoraSalida  ?? null;
            emp.estadoTemporario  = this.calcularEstado(emp);
          }
          this.aplicarFiltro();
        }, () => {
          emp.fechaHoraEntrada = null;
          emp.fechaHoraSalida  = null;
          emp.estadoTemporario  = 'sin-tiempos';
          this.aplicarFiltro();
        });
      });
    }, () => {
      this.empleados.forEach(emp => {
        emp.estadoTemporario = this.calcularEstado(emp);
      });
      this.aplicarFiltro();
    });
  }

  filtrarEmpleados(): void { this.aplicarFiltro(); }

  filtrarPorEstado(estado: EstadoTemporal): void {
    this.filtroEstado = this.filtroEstado === estado ? null : estado;
    this.aplicarFiltro();
  }

  private aplicarFiltro(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.empleadosFiltrados = this.empleados.filter(emp => {
      const texto = (
        emp.nombreCompleto +
        emp.cedula +
        emp.cargo +
        emp.obra +
        emp.responsable +
        (emp.responsableSecundario || '')
      ).toLowerCase();
      const okTexto  = !q || texto.includes(q);
      const okEstado = !this.filtroEstado || emp.estadoTemporario === this.filtroEstado;
      return okTexto && okEstado;
    });
  }

  obtenerClaseFila(emp: Empleado): string {
    if (emp.estadoTemporario === 'ausentismo') return 'fila-ausentismo';
    switch (emp.estadoTemporario) {
      case 'ingreso-salida': return 'fila-ingreso-salida';
      case 'solo-ingreso':   return 'fila-solo-ingreso';
      case 'falta-ingreso':  return 'fila-falta-ingreso';
      default:               return 'fila-sin-tiempos';
    }
  }

  private calcularEstado(emp: Empleado): EstadoTemporal {
    const ahora = new Date(), limite = 9;
    const esHoy = (d?: string) => d && new Date(d).toDateString() === ahora.toDateString();

    const ingHoy = emp.fechaHoraEntrada && esHoy(emp.fechaHoraEntrada);
    const salHoy = emp.fechaHoraSalida  && esHoy(emp.fechaHoraSalida);

    if (ahora.getHours() >= limite && !ingHoy)   return 'falta-ingreso';
    if (ingHoy && salHoy)                        return 'ingreso-salida';
    if (ingHoy && !salHoy)                       return 'solo-ingreso';
    return 'sin-tiempos';
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

  private registrarTiempos(accion: 'ingreso'|'salida'): void {
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
}
