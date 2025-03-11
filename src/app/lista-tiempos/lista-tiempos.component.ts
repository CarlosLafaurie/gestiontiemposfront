import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importación de FormsModule
import { TiemposService } from '../services/tiempos.service.service';

@Component({
  selector: 'app-lista-tiempos',
  standalone: true,
  templateUrl: './lista-tiempos.component.html',
  styleUrls: ['./lista-tiempos.component.css'],
  imports: [NgFor, FormsModule],
  providers: [TiemposService]
})
export class ListaTiemposComponent implements OnInit, OnChanges {
  @Input() empleadosSeleccionados: any[] = [];
  listaTiempos: any[] = [];
  tipoRegistro: string = 'entrada';
  fechaHoraGlobal: string = ''; // Campo global para la hora

  constructor(private tiemposService: TiemposService) {}

  ngOnInit() {
    if (this.empleadosSeleccionados.length === 0) {
      console.warn("⚠️ No se recibieron empleados seleccionados.");
      return;
    }
    this.generarListaTiempos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['empleadosSeleccionados']) {
      this.generarListaTiempos();
    }
  }

  generarListaTiempos() {
    // Genera la lista de tiempos basándose en los empleados seleccionados.
    this.listaTiempos = this.empleadosSeleccionados.map(emp => ({
      id: 0,
      empleadoId: emp.id,
      fechaHoraEntrada: this.tipoRegistro === 'entrada' ? null : null,
      fechaHoraSalida: this.tipoRegistro === 'salida' ? null : null,
      comentarios: "",
      permisosEspeciales: "",
      // Usa la propiedad 'nombre' en vez de 'nombreCompleto'
      nombreEmpleado: emp.nombre 
    }));
    console.log("✅ Lista de tiempos generada:", this.listaTiempos);
  }
  
  actualizarHoras() {
    // Actualiza todos los registros de la lista con la misma fecha/hora global según el tipo de registro.
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
    // Valida que al menos uno de los registros tenga definida la hora de entrada o salida.
    return this.listaTiempos.some(tiempo => tiempo.fechaHoraEntrada || tiempo.fechaHoraSalida);
  }

  guardarTiempos() {
    // Prepara el JSON eliminando la propiedad "nombreEmpleado" para que concuerde con lo que espera el backend.
    const datosAEnviar = this.listaTiempos.map(t => ({
      id: t.id ?? 0,
      empleadoId: t.empleadoId,
      fechaHoraEntrada: t.fechaHoraEntrada || null,
      fechaHoraSalida: t.fechaHoraSalida || null,
      comentarios: t.comentarios,
      permisosEspeciales: t.permisosEspeciales
    }));
    console.log("📤 Enviando datos a la API:", datosAEnviar);

    this.tiemposService.guardarTiempos(datosAEnviar).subscribe({
      next: (res) => console.log("✅ Guardado exitoso", res),
      error: (err) => {
        console.error("❌ Error al guardar tiempos", err);
        if (err.error) {
          console.error("📌 Detalles del error:", err.error);
        }
      }
    });
  }
}
