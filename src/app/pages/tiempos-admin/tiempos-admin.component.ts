import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../navbar/navbar.component';
import { RegistroJornadaService, ResumenEmpleado } from '../../services/registrojornada.service';
import { ExcelService } from '../../services/excel.service.ts.service';

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
  imports: [CommonModule, NavbarComponent],
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

  private datosOriginales: ResumenEmpleado[] = []; // ✅ datos sin transformar

  private jornadaService = inject(RegistroJornadaService);
  private excelService = inject(ExcelService);

  ngOnInit(): void {
    console.log('⏳ Iniciando TiemposAdminComponent...');
    this.cargarResumen();
  }

  private cargarResumen(): void {
    console.log('📡 Llamando a obtenerResumenHoras()...');
    this.jornadaService.obtenerResumenHoras(true).subscribe({
      next: (data: ResumenEmpleado[]) => {
        console.log('✅ Datos crudos recibidos del backend:', data);

        this.datosOriginales = data; // ✅ Guardamos los datos sin transformar

        const agrupado = data.reduce((acc: EmpleadoAgrupado[], r: ResumenEmpleado) => {
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
              festivos: false
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
          festivos: e.festivos ? 'Sí' : 'No'
        }));

        console.log('🔧 resumenEmpleados agrupado y mapeado:', this.resumenEmpleados);
      },
      error: err => {
        console.error('❌ Error al cargar resumen de horas:', err);
      }
    });
  }

  exportarExcel(): void {
    console.log('📤 Exportando a Excel, resumenEmpleados:', this.resumenEmpleados)
    this.excelService.exportarExcel(this.datosOriginales);
  }
}
