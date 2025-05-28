import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TiemposService } from '../services/tiempos.service.service';
import { AusentismoService } from '../services/documento-permiso.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, Observable } from 'rxjs';

export interface TiempoExtendido {
  ingresoId: number | null;
  salidaId: number | null;
  empleadoId: number;
  nombreEmpleado: string;
  fechaHoraEntrada: string | null;
  fechaHoraSalida: string | null;
  comentarios: string;
  permisosEspeciales: string;
  archivo?: File | null;
}

@Component({
  selector: 'app-lista-tiempos',
  standalone: true,
  imports: [NgFor, FormsModule, MatExpansionModule, CommonModule],
  templateUrl: './lista-tiempos.component.html',
  styleUrls: ['./lista-tiempos.component.css'],
  providers: [TiemposService, AusentismoService]
})
export class ListaTiemposComponent implements OnInit, OnChanges {
  @Input() empleadosSeleccionados: any[] = [];
  listaTiempos: TiempoExtendido[] = [];

  empleadoSeleccionado: TiempoExtendido | null = null;

  tipoRegistro = 'entrada';
  fechaHoraGlobal = '';
  fechaInicioPermiso = '';
  fechaFinPermiso = '';
  modo = 'tiempos';

  constructor(
    private tiemposService: TiemposService,
    private ausentismoService: AusentismoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    if (this.empleadosSeleccionados.length) {
      this.generarListaTiempos();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['empleadosSeleccionados'] && this.empleadosSeleccionados.length > 0) {
      this.generarListaTiempos();
    }
  }

  private generarListaTiempos() {
    this.listaTiempos = this.empleadosSeleccionados.map(emp => ({
      ingresoId: null,
      salidaId: null,
      empleadoId: emp.id,
      nombreEmpleado: emp.nombre,
      fechaHoraEntrada: null,
      fechaHoraSalida: null,
      comentarios: '',
      permisosEspeciales: '',
      archivo: null
    }));
  }

  actualizarHoras() {
    this.listaTiempos.forEach(t => {
      if (!this.fechaHoraGlobal) return;
      if (this.tipoRegistro === 'entrada') {
        t.fechaHoraEntrada = this.fechaHoraGlobal;
      } else {
        t.fechaHoraSalida = this.fechaHoraGlobal;
      }
    });
  }

  esValidoParaGuardar(): boolean {
    return this.listaTiempos.some(t => t.fechaHoraEntrada || t.fechaHoraSalida);
  }

  guardarTiempos() {
    const observables: Observable<any>[] = [];
    this.listaTiempos.forEach(t => {
      if (t.fechaHoraEntrada) {
        observables.push(this.tiemposService.registrarIngreso({
          empleadoId: t.empleadoId,
          fechaHoraEntrada: t.fechaHoraEntrada,
          comentarios: t.comentarios,
          permisosEspeciales: ''
        }));
      }
      if (t.fechaHoraSalida) {
        observables.push(this.tiemposService.registrarSalida({
          empleadoId: t.empleadoId,
          fechaHoraSalida: t.fechaHoraSalida,
          comentarios: t.comentarios,
          permisosEspeciales: ''
        }));
      }
    });
    forkJoin(observables).subscribe({
      next: () => {
        this.snackBar.open('✅ Tiempos cargados correctamente.', 'Cerrar', { duration: 3000 });
        location.reload();
      },
      error: () => {
        this.snackBar.open('❌ Error al guardar tiempos.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cambiarModo(modo: string) {
    this.modo = modo;
    if (modo === 'editar' && this.listaTiempos.length) {
      this.empleadoSeleccionado = this.listaTiempos[0];
      this.cargarUltimosTiempos();
    }
  }

  esValidoParaGuardarAusentismo(): boolean {
    return !!this.fechaInicioPermiso &&
           !!this.fechaFinPermiso &&
           this.fechaInicioPermiso <= this.fechaFinPermiso &&
           this.listaTiempos.some(t => t.permisosEspeciales.trim() !== '');
  }

  guardarAusentismo() {
    const regs = this.listaTiempos.filter(t => t.permisosEspeciales.trim());
    const observables = regs.map(t => {
      const fd = new FormData();
      fd.append('NombreEmpleado', t.nombreEmpleado);
      fd.append('Comentarios', t.comentarios);
      fd.append('PermisosEspeciales', t.permisosEspeciales);
      fd.append('FechaInicio', this.fechaInicioPermiso);
      fd.append('FechaFin', this.fechaFinPermiso);
      if (t.archivo) fd.append('Archivo', t.archivo);
      return this.ausentismoService.subirDocumentoAusentismo(fd);
    });
    forkJoin(observables).subscribe({
      next: () => {
        this.snackBar.open('✅ Ausentismo enviado correctamente.', 'Cerrar', { duration: 3000 });
        setTimeout(() => location.reload(), 1000);
      },
      error: () => {
        this.snackBar.open('❌ Error al guardar ausentismo.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  manejarArchivo(event: Event, i: number) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.listaTiempos[i].archivo = input.files[0];
    }
  }

  cargarUltimosTiempos() {
    if (!this.empleadoSeleccionado) return;
    const emp = this.empleadoSeleccionado;
    forkJoin([
      this.tiemposService.obtenerUltimoIngresoPorEmpleado(emp.empleadoId),
      this.tiemposService.obtenerUltimaSalidaPorEmpleado(emp.empleadoId)
    ]).subscribe({
      next: ([ingreso, salida]) => {
        emp.ingresoId        = ingreso.id ?? null;
        emp.fechaHoraEntrada = ingreso.fechaHoraEntrada ?? null;
        emp.comentarios      = ingreso.comentarios ?? '';
        emp.salidaId         = salida.id ?? null;
        emp.fechaHoraSalida  = salida.fechaHoraSalida ?? null;
      },
      error: () => {
        this.snackBar.open('❌ No se pudieron cargar últimos tiempos.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  guardarEdicion() {
    if (!this.empleadoSeleccionado) {
      this.snackBar.open('⚠️ Seleccione un empleado.', 'Cerrar', { duration: 3000 });
      return;
    }
    const t = this.empleadoSeleccionado;
    const tareas: Observable<void>[] = [];

    if (t.fechaHoraEntrada && t.ingresoId != null) {
      tareas.push(this.tiemposService.actualizarIngreso(t.ingresoId, {
        id: t.ingresoId,
        empleadoId: t.empleadoId,
        fechaHoraEntrada: t.fechaHoraEntrada,
        comentarios: t.comentarios,
        permisosEspeciales: ''
      }));
    }
    if (t.fechaHoraSalida && t.salidaId != null) {
      tareas.push(this.tiemposService.actualizarSalida(t.salidaId, {
        id: t.salidaId,
        empleadoId: t.empleadoId,
        fechaHoraSalida: t.fechaHoraSalida,
        comentarios: t.comentarios,
        permisosEspeciales: ''
      }));
    }

    forkJoin(tareas).subscribe({
      next: () => {
        this.snackBar.open('✅ Tiempo actualizado correctamente.', 'Cerrar', { duration: 3000 });
        this.empleadoSeleccionado = null;
        setTimeout(() => location.reload(), 500);
      },
      error: () => {
        this.snackBar.open('❌ Error al actualizar tiempo.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cancelarEdicion() {
    this.empleadoSeleccionado = null;
  }
}
