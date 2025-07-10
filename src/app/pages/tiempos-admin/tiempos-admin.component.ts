import { FormsModule } from '@angular/forms';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { NavbarComponent } from '../../navbar/navbar.component';
import { RegistroJornadaService, ResumenEmpleado } from '../../services/registrojornada.service';
import { ExcelService } from '../../services/excel.service.ts.service';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

interface EmpleadoAgrupado {
  nombreCompleto: string;
  totalHoras: number;
  horasDiurnas: number;
  horasNocturnas: number;
  horasExtrasDiurnas: number;
  horasExtrasNocturnas: number;
  dominicales: boolean;
  festivos: boolean;
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
  }> = [];

  private datosOriginales: ResumenEmpleado[] = [];

  fechaInicio: string = '';
  fechaFin: string = '';

  private jornadaService = inject(RegistroJornadaService);
  private excelService = inject(ExcelService);

  ngOnInit(): void {
    console.log('⏳ Iniciando TiemposAdminComponent...');
    this.cargarResumen();
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

        console.log('🧮 Agrupando datos por empleado...');
        const agrupado = data.reduce((acc: EmpleadoAgrupado[], r: ResumenEmpleado) => {
          console.log('➕ Procesando registro:', r);

          let e = acc.find(x => x.nombreCompleto === r.nombreCompleto);
          if (!e) {
            console.log(`🆕 Nuevo empleado encontrado: ${r.nombreCompleto}`);
            e = {
              nombreCompleto: r.nombreCompleto,
              totalHoras: 0,
              horasDiurnas: 0,
              horasNocturnas: 0,
              horasExtrasDiurnas: 0,
              horasExtrasNocturnas: 0,
              dominicales: false,
              festivos: false
            };
            acc.push(e);
          }

          e.totalHoras += r.horasTrabajadas;
          e.horasDiurnas += r.horasDiurnas;
          e.horasNocturnas += r.horasNocturnas;
          e.horasExtrasDiurnas += r.horasExtrasDiurnas;
          e.horasExtrasNocturnas += r.horasExtrasNocturnas;
          if (r.trabajoDomingo) {
            console.log(`📌 ${r.nombreCompleto} trabajó domingo.`);
            e.dominicales = true;
          }
          if (r.trabajoFestivo) {
            console.log(`📌 ${r.nombreCompleto} trabajó festivo.`);
            e.festivos = true;
          }

          return acc;
        }, []);

        console.log('✅ Datos agrupados:', agrupado);

        this.resumenEmpleados = agrupado.map((e) => {
          const mapeado = {
            nombreCompleto: e.nombreCompleto,
            totalHoras: e.totalHoras.toFixed(2),
            horasDiurnas: e.horasDiurnas.toFixed(2),
            horasNocturnas: e.horasNocturnas.toFixed(2),
            horasExtrasDiurnas: e.horasExtrasDiurnas.toFixed(2),
            horasExtrasNocturnas: e.horasExtrasNocturnas.toFixed(2),
            dominicales: e.dominicales ? 'Sí' : 'No',
            festivos: e.festivos ? 'Sí' : 'No'
          };
          console.log('🧾 Resumen empleado:', mapeado);
          return mapeado;
        });

        console.log('🏁 Finalizó la carga de resumenEmpleados:', this.resumenEmpleados);
      },
      error: err => {
        console.error('❌ Error al cargar resumen de horas:', err);
      }
    });
  }

  exportarExcel(): void {
    console.log('📤 Exportando a Excel...');
    console.log('🗃️ Datos originales:', this.datosOriginales);
    this.excelService.exportarExcel(this.datosOriginales);
    console.log('✅ Exportación finalizada');
  }
}
