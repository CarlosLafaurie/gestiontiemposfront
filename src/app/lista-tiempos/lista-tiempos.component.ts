import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TiemposService, Tiempo } from '../services/tiempos.service.service';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-lista-tiempos',
  standalone: true,
  templateUrl: './lista-tiempos.component.html',
  styleUrls: ['./lista-tiempos.component.css'],
  imports: [NgFor, FormsModule, MatExpansionModule],
  providers: [TiemposService]
})
export class ListaTiemposComponent implements OnInit, OnChanges {
  @Input() empleadosSeleccionados: any[] = [];
  listaTiempos: Tiempo[] = [];
  tipoRegistro: string = 'entrada';
  fechaHoraGlobal: string = '';
  modo: string = 'tiempos';  // 'tiempos' o 'ausentismo'

  constructor(private tiemposService: TiemposService) {}

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
      nombreEmpleado: emp.nombre
    })) as Tiempo[];
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
            this.verificarFinalizacion(++registrosCompletados, totalRegistros);
          },
        });
      }
      if (tiempo.fechaHoraSalida) {
        this.tiemposService.registrarSalida(tiempo).subscribe({
          next: res => {
            console.log(`✅ Salida registrada`, res);
            this.verificarFinalizacion(++registrosCompletados, totalRegistros);
          },
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
}
