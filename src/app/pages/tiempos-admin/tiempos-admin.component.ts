import { FormsModule } from '@angular/forms';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { NavbarComponent } from '../../navbar/navbar.component';
import { RegistroJornadaService, ResumenEmpleado } from '../../services/registrojornada.service';
import { ExcelService } from '../../services/excel.service';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { EmpleadoService } from '../../services/empleado-service.service';

interface EmpleadoAgrupado {
  nombreCompleto: string;
  totalHoras: number;
  horasDiurnas: number;
  horasNocturnas: number;
  horasExtrasDiurnas: number;
  horasExtrasNocturnas: number;
  dominicales: boolean;
  festivos: boolean;
  ubicacion?: string;
}

@Component({
  selector: 'tiempos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BotonRegresarComponent, NgFor],
  templateUrl: './tiempos-admin.component.html',
  styleUrls: ['./tiempos-admin.component.css']
})
export class TiemposAdminComponent implements OnInit {
  resumenEmpleados: Array<{
    nombreCompleto: string;
    totalHoras: string;
    horasDiurnas: string;
    horasNocturnas: string;
    horasExtrasDiurnas: string;
    horasExtrasNocturnas: string;
    dominicales: string;
    festivos: string;
    ubicacion?: string;
  }> = [];

  private datosOriginales: ResumenEmpleado[] = [];

  fechaInicio: string = '';
  fechaFin: string = '';

  ubicaciones: string[] = [];
  ubicacionSeleccionada: string = 'Todos';
  empleadosFiltrados: ResumenEmpleado[] = [];


  private jornadaService = inject(RegistroJornadaService);
  private excelService = inject(ExcelService);
  private empleadoService = inject(EmpleadoService);

  ngOnInit(): void {
    console.log('⏳ Iniciando TiemposAdminComponent...');
    this.cargarUbicaciones();
    this.cargarResumen();
  }

  private normalizarTexto(txt: string): string {
    if (!txt) return '';
    return txt
      .trim()
      .toLowerCase()
      .replace('bogota', 'bogotá')
      .replace('picso central', 'medellín')
      .replace('picso sentral', 'medellín');
  }

  cargarUbicaciones(): void {
    this.empleadoService.obtenerUbicaciones().subscribe({
      next: (ubicaciones: string[]) => {
        this.ubicaciones = ['Todos', ...ubicaciones];
        console.log('🌎 Ubicaciones desde backend:', this.ubicaciones);
      },
      error: (err) => {
        console.error('❌ Error al cargar ubicaciones:', err);
      }
    });
  }

  cargarResumen(): void {
    console.log('📥 Método cargarResumen() invocado');
    console.log('🕓 Fecha inicio seleccionada:', this.fechaInicio);
    console.log('🕓 Fecha fin seleccionada:', this.fechaFin);

    if (!this.fechaInicio || !this.fechaFin) {
      console.warn('⚠️ Debes seleccionar ambas fechas.');
      return;
    }

    console.log('📡 Solicitando datos al backend...');
    this.jornadaService.obtenerResumenHoras(this.fechaInicio, this.fechaFin).subscribe({
      next: (data: ResumenEmpleado[]) => {
        console.log('✅ Datos recibidos del backend:', data);
        this.datosOriginales = data;

        // 🔽 Filtro de ubicación
        let filtrados = data;
        if (this.ubicacionSeleccionada && this.ubicacionSeleccionada !== 'Todos') {
          const ubSel = this.normalizarTexto(this.ubicacionSeleccionada);
          filtrados = data.filter(emp =>
            this.normalizarTexto(emp.ubicacion || '') === ubSel
          );
        }

        console.log('🧮 Agrupando datos por empleado...');
        const agrupado = filtrados.reduce((acc: EmpleadoAgrupado[], r: ResumenEmpleado) => {
          let e = acc.find(x => x.nombreCompleto === r.nombreCompleto);
          if (!e) {
            e = {
              nombreCompleto: r.nombreCompleto,
              totalHoras: 0,
              horasDiurnas: 0,
              horasNocturnas: 0,
              horasExtrasDiurnas: 0,
              horasExtrasNocturnas: 0,
              dominicales: false,
              festivos: false,
              ubicacion: this.normalizarTexto(r.ubicacion || '')
            };
            acc.push(e);
          }

          e.totalHoras += r.horasTrabajadas;
          e.horasDiurnas += r.horasDiurnas;
          e.horasNocturnas += r.horasNocturnas;
          e.horasExtrasDiurnas += r.horasExtrasDiurnas;
          e.horasExtrasNocturnas += r.horasExtrasNocturnas;
          if (r.trabajoDomingo) e.dominicales = true;
          if (r.trabajoFestivo) e.festivos = true;

          return acc;
        }, []);

        this.resumenEmpleados = agrupado.map((e) => ({
          nombreCompleto: e.nombreCompleto,
          totalHoras: e.totalHoras.toFixed(2),
          horasDiurnas: e.horasDiurnas.toFixed(2),
          horasNocturnas: e.horasNocturnas.toFixed(2),
          horasExtrasDiurnas: e.horasExtrasDiurnas.toFixed(2),
          horasExtrasNocturnas: e.horasExtrasNocturnas.toFixed(2),
          dominicales: e.dominicales ? 'Sí' : 'No',
          festivos: e.festivos ? 'Sí' : 'No',
          ubicacion: e.ubicacion
        }));

        this.empleadosFiltrados = filtrados;

        console.log('🏁 Finalizó la carga de resumenEmpleados:', this.resumenEmpleados);
      },
      error: err => {
        console.error('❌ Error al cargar resumen de horas:', err);
      }
    });
  }

  exportarExcel(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      console.warn('⚠️ Debes seleccionar ambas fechas antes de exportar.');
      return;
    }

    const ubicacion = this.ubicacionSeleccionada !== 'Todos'
      ? this.ubicacionSeleccionada
      : undefined;

    this.excelService.generarYExportarExcel(
      this.fechaInicio,
      this.fechaFin,
      ubicacion,
      this.empleadosFiltrados
    );
  }



}
