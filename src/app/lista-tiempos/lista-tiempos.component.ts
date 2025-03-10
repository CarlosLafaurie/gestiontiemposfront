import { Component, OnInit } from '@angular/core';
import { Input } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ Importación correcta
import { Empleado, EmpleadoService } from '../services/empleado-service.service';
import { TiemposService } from '../services/tiempos.service.service';

@Component({
  selector: 'app-lista-tiempos',
  standalone: true,
  templateUrl: './lista-tiempos.component.html',
  styleUrls: ['./lista-tiempos.component.css'],
  imports: [NgIf, NgFor, FormsModule],
  providers: [EmpleadoService, TiemposService]
})
export class ListaTiemposComponent implements OnInit {
  empleados: Empleado[] = [];
  @Input() empleadosSeleccionados: any[] = [];
  listaTiempos: any[] = [];
  tipoRegistro: string = 'entrada';

  constructor(
    private empleadoService: EmpleadoService,
    private tiemposService: TiemposService
  ) {}

  ngOnInit() {
    if (this.empleadosSeleccionados.length === 0) {
      console.warn("⚠️ No se recibieron empleados seleccionados.");
      return;
    }

    this.generarListaTiempos();
  }

  generarListaTiempos() {
    const fechaActual = new Date().toISOString();
  
    this.listaTiempos = this.empleadosSeleccionados.map(emp => ({
      id: 0,
      empleadoId: emp.id,  // ✅ Solo enviamos el ID del empleado
      fechaHoraEntrada: fechaActual,
      fechaHoraSalida: fechaActual,
      comentarios: "",
      permisosEspeciales: ""
    }));

    console.log("✅ Lista de tiempos generada con empleados seleccionados:", this.listaTiempos);
  }

  guardarTiempos() {
    this.tiemposService.guardarTiempos(this.listaTiempos).subscribe({
      next: (res) => console.log('✅ Guardado correctamente', res),
      error: (err) => console.error('❌ Error al guardar tiempos', err)
    });
  }
}
