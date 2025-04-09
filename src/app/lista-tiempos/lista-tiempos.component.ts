import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TiemposService } from '../services/tiempos.service.service';
import { AusentismoService } from '../services/documento-permiso.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

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
  templateUrl: './lista-tiempos.component.html',
  styleUrls: ['./lista-tiempos.component.css'],
  imports: [NgFor, FormsModule, MatExpansionModule],
  providers: [TiemposService, AusentismoService]
})
export class ListaTiemposComponent implements OnInit, OnChanges {
  @Input() empleadosSeleccionados: any[] = [];
  listaTiempos: TiempoExtendido[] = [];
  tipoRegistro: string = 'entrada';
  fechaHoraGlobal: string = '';
  fechaHoraGlobalAusentismo: string = '';
  modo: string = 'tiempos';

  constructor(
    private tiemposService: TiemposService,
    private ausentismoService: AusentismoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    if (this.empleadosSeleccionados.length === 0) {
      console.warn("⚠️ No se recibieron empleados seleccionados.");
      return;
    }
    this.generarListaTiempos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['empleadosSeleccionados'] && this.empleadosSeleccionados.length > 0) {
      this.generarListaTiempos();
    }
  }

  generarListaTiempos() {
    this.listaTiempos = this.empleadosSeleccionados.map(emp => ({
      id: 0,
      empleadoId: emp.id,
      fechaHoraEntrada: null,
      fechaHoraSalida: null,
      comentarios: "",
      permisosEspeciales: "",
      nombreEmpleado: emp.nombre,
      archivo: null
    })) as TiempoExtendido[];
  }

  actualizarHoras() {
    this.listaTiempos.forEach(tiempo => {
      if (this.fechaHoraGlobal) {
        if (this.tipoRegistro === 'entrada') {
          tiempo.fechaHoraEntrada = this.fechaHoraGlobal;
        } else if (this.tipoRegistro === 'salida') {
          tiempo.fechaHoraSalida = this.fechaHoraGlobal;
        }
      }
    });
  }

  esValidoParaGuardar(): boolean {
    return this.listaTiempos.some(t => t.fechaHoraEntrada || t.fechaHoraSalida);
  }

  guardarTiempos() {
    if (!this.esValidoParaGuardar()) {
      console.warn("⚠️ No hay tiempos válidos para guardar.");
      return;
    }

    let registrosCompletados = 0;
    const totalRegistros = this.listaTiempos.filter(t => t.fechaHoraEntrada || t.fechaHoraSalida).length;

    this.listaTiempos.forEach(({ nombreEmpleado, ...tiempo }) => {
      if (tiempo.fechaHoraEntrada) {
        this.tiemposService.registrarIngreso(tiempo).subscribe({
          next: res => {
            registrosCompletados++;
            this.verificarFinalizacion(registrosCompletados, totalRegistros);
          },
          error: err => {
            if (err.status === 409) {
              const fecha = tiempo.fechaHoraEntrada ? new Date(tiempo.fechaHoraEntrada).toLocaleDateString() : 'desconocida';
              this.snackBar.open(
                `⚠️ Ya existe un ingreso registrado para la fecha ${fecha}`,
                'Cerrar',
                { duration: 5000, panelClass: ['snackbar-error'] }
              );
            } else {
              console.error("❌ Error al registrar ingreso:", err);
            }
          }
        });
      }

      if (tiempo.fechaHoraSalida) {
        this.tiemposService.registrarSalida(tiempo).subscribe({
          next: res => {
            registrosCompletados++;
            this.verificarFinalizacion(registrosCompletados, totalRegistros);
          },
          error: err => {
            if (err.status === 409) {
              const fecha = tiempo.fechaHoraSalida ? new Date(tiempo.fechaHoraSalida).toLocaleDateString() : 'desconocida';
              this.snackBar.open(
                `⚠️ Ya existe una salida registrada para la fecha ${fecha}`,
                'Cerrar',
                { duration: 5000, panelClass: ['snackbar-error'] }
              );
            } else {
              console.error("❌ Error al registrar salida:", err);
            }
          }
        });
      }
    });
  }



  verificarFinalizacion(completados: number, total: number) {
    if (completados === total) {
      alert("✅ Ingreso cargado correctamente.");
      location.reload();
    }
  }

  cambiarModo(modo: string) {
    this.modo = modo;
  }

  esValidoParaGuardarAusentismo(): boolean {
    return this.fechaHoraGlobalAusentismo !== '' && this.listaTiempos.some(t => t.permisosEspeciales);
  }

  guardarAusentismo() {
    const registros = this.listaTiempos.filter(t => t.permisosEspeciales);
    if (registros.length === 0) return;

    let completados = 0;

    for (let tiempo of registros) {
      const formData = new FormData();
      formData.append('NombreEmpleado', tiempo.nombreEmpleado);
      formData.append('Comentarios', tiempo.comentarios || '');
      formData.append('PermisosEspeciales', tiempo.permisosEspeciales || '');
      formData.append('FechaHoraEntrada', this.fechaHoraGlobalAusentismo || '');

      if (tiempo.archivo) {
        formData.append('Archivo', tiempo.archivo);
      }

      this.ausentismoService.subirDocumentoAusentismo(formData).subscribe({
        next: res => {
          completados++;
          if (completados === registros.length) {
            this.snackBar.open('✅ Documento de ausentismo enviado correctamente.', 'Cerrar', {
              duration: 5000,
              panelClass: ['snackbar-success']
            });
            setTimeout(() => location.reload(), 1000);
          }
        },
        error: err => {
          console.error('❌ Error al subir el documento:', err);
          this.snackBar.open('❌ Error al subir el documento de ausentismo.', 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
          });
        }
      });
    }
  }


  manejarArchivo(event: any, index: number) {
    const archivo = event.target.files[0];
    if (archivo) {
      this.listaTiempos[index].archivo = archivo;
    }
  }
}
