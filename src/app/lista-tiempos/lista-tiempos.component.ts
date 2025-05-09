import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TiemposService } from '../services/tiempos.service.service';
import { AusentismoService } from '../services/documento-permiso.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface TiempoExtendido {
  id: number;
  empleadoId: number;
  fechaHoraEntrada: string | null;
  fechaHoraSalida: string | null;
  comentarios: string;
  permisosEspeciales: string;
  nombreEmpleado: string;
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
  tipoRegistro = 'entrada';
  fechaHoraGlobal = '';
  // Campos nuevos para ausentismo
  fechaInicioPermiso = '';
  fechaFinPermiso = '';
  modo = 'tiempos';

  constructor(
    private tiemposService: TiemposService,
    private ausentismoService: AusentismoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    if (this.empleadosSeleccionados.length === 0) {
      console.warn('⚠️ No se recibieron empleados seleccionados.');
      return;
    }
    this.generarListaTiempos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['empleadosSeleccionados'] && this.empleadosSeleccionados.length > 0) {
      this.generarListaTiempos();
    }
  }

  private generarListaTiempos() {
    this.listaTiempos = this.empleadosSeleccionados.map(emp => ({
      id: 0,
      empleadoId: emp.id,
      fechaHoraEntrada: null,
      fechaHoraSalida: null,
      comentarios: '',
      permisosEspeciales: '',
      nombreEmpleado: emp.nombre,
      archivo: null
    }));
  }

  actualizarHoras() {
    // No modificado: mantiene la lógica original para tiempos
    this.listaTiempos.forEach(t => {
      if (this.fechaHoraGlobal) {
        if (this.tipoRegistro === 'entrada') {
          t.fechaHoraEntrada = this.fechaHoraGlobal;
        } else if (this.tipoRegistro === 'salida') {
          t.fechaHoraSalida = this.fechaHoraGlobal;
        }
      }
    });
  }

  esValidoParaGuardar(): boolean {
    return this.listaTiempos.some(t => t.fechaHoraEntrada || t.fechaHoraSalida);
  }

  guardarTiempos() {
    // Lógica original sin cambios
    if (!this.esValidoParaGuardar()) {
      console.warn('⚠️ No hay tiempos válidos para guardar.');
      return;
    }
    let completados = 0;
    const total = this.listaTiempos.filter(t => t.fechaHoraEntrada || t.fechaHoraSalida).length;
    this.listaTiempos.forEach(({ nombreEmpleado, ...tiempo }) => {
      if (tiempo.fechaHoraEntrada) {
        this.tiemposService.registrarIngreso(tiempo).subscribe({
          next: () => {
            completados++;
            if (completados === total) {
              alert('✅ Ingreso cargado correctamente.');
              location.reload();
            }
          },
          error: err => {
            console.error('❌ Error al registrar ingreso:', err);
          }
        });
      }
      if (tiempo.fechaHoraSalida) {
        this.tiemposService.registrarSalida(tiempo).subscribe({
          next: () => {
            completados++;
            if (completados === total) {
              alert('✅ Salida cargada correctamente.');
              location.reload();
            }
          },
          error: err => {
            console.error('❌ Error al registrar salida:', err);
          }
        });
      }
    });
  }

  cambiarModo(modo: string) {
    this.modo = modo;
  }

  // --- Solo de aquí para abajo: AUSENTISMO ---

  esValidoParaGuardarAusentismo(): boolean {
    return (
      this.fechaInicioPermiso !== '' &&
      this.fechaFinPermiso !== '' &&
      this.fechaInicioPermiso <= this.fechaFinPermiso &&
      this.listaTiempos.some(t => !!t.permisosEspeciales)
    );
  }

  guardarAusentismo() {
    if (!this.esValidoParaGuardarAusentismo()) {
      this.snackBar.open(
        '⚠️ Complete fechas y seleccione al menos un permiso.',
        'Cerrar',
        { duration: 3000 }
      );
      return;
    }

    const registros = this.listaTiempos.filter(t => !!t.permisosEspeciales);
    let completados = 0;

    registros.forEach(tiempo => {
      const formData = new FormData();
      formData.append('NombreEmpleado', tiempo.nombreEmpleado);
      formData.append('Comentarios', tiempo.comentarios);
      formData.append('PermisosEspeciales', tiempo.permisosEspeciales);
      formData.append('FechaInicio', this.fechaInicioPermiso);
      formData.append('FechaFin', this.fechaFinPermiso);
      if (tiempo.archivo) {
        formData.append('Archivo', tiempo.archivo);
      }

      this.ausentismoService.subirDocumentoAusentismo(formData).subscribe({
        next: () => {
          completados++;
          if (completados === registros.length) {
            this.snackBar.open(
              '✅ Documento de ausentismo enviado correctamente.',
              'Cerrar',
              { duration: 3000 }
            );
            setTimeout(() => location.reload(), 1000);
          }
        },
        error: err => {
          console.error('❌ Error al subir el documento de ausentismo:', err);
          this.snackBar.open(
            '❌ Error al guardar ausentismo.',
            'Cerrar',
            { duration: 3000 }
          );
        }
      });
    });
  }

  manejarArchivo(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.listaTiempos[index].archivo = input.files[0];
    }
  }
}
