import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environments';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { RegistroJornadaService, ResumenEmpleado } from './registrojornada.service';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private registroJornadaService: RegistroJornadaService
  ) {}

  generarYExportarExcel(usarFestivos: boolean = false) {
    this.registroJornadaService.obtenerResumenHoras(usarFestivos)
      .subscribe(resumen => this.exportarExcel(resumen));
  }

  exportarExcel(resumenEmpleados: ResumenEmpleado[]) {
    const workbook = XLSX.utils.book_new();

    // 1) Agrupar registros por nombreCompleto
    const grupos = resumenEmpleados.reduce((acc, emp) => {
      (acc[emp.nombreCompleto] ||= []).push(emp);
      return acc;
    }, {} as Record<string, ResumenEmpleado[]>);

    // 2) Para cada grupo (un empleado), crear su propia hoja
    Object.entries(grupos).forEach(([nombre, registros]) => {
      const data: any[][] = [
        ['N°', 'FECHA', 'DÍA', 'JORNADA',
         'HORA DE ENTRADA', 'HORA DE SALIDA',
         'TOTAL HORAS TRABAJADAS (96 h. quincena)',
         'HORAS EXTRA (+25%)',
         'RECARGOS NOCTURNOS (+35%)',
         'RECARGOS NOCTURNOS DOMINICALES O FESTIVOS',
         'RECARGOS DOMINICALES (+75%)',
         'HORA EXTRA DOMINICAL'
        ]
      ];

      registros.forEach((emp, i) => {
        const fecha = this.formatearFecha(emp.fecha);
        const diaSemana = this.obtenerDiaSemana(fecha);
        const diurnasExtra = emp.horasExtrasDiurnas;
        const nocturnasExtra = emp.horasExtrasNocturnas;
        const recDom = emp.trabajoDomingo ? nocturnasExtra : 0;
        const recFes = emp.trabajoFestivo ? diurnasExtra * 0.75 : 0;

        data.push([
          String(i + 1),
          fecha,
          diaSemana,
          'X',
          this.extraerHora(emp.horaEntrada),
          this.extraerHora(emp.horaSalida),
          String(emp.horasTrabajadas),
          String(diurnasExtra),
          String(emp.horasNocturnas),
          String(recDom),
          String(recFes),
          String(recFes + nocturnasExtra * 0.75)
        ]);
      });

      const sheet = XLSX.utils.aoa_to_sheet(data);
      const sheetName = nombre.length > 31 ? nombre.slice(0, 28) + '...' : nombre;
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    });

    const buf = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'Resumen_Jornada_Empleados.xlsx');
  }

  private formatearFecha(fecha: string): string {
    const d = new Date(fecha);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  private obtenerDiaSemana(fecha: string): string {
    const d = new Date(fecha);
    const dias = ['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];
    return dias[d.getDay()];
  }

  // ✅ NUEVO MÉTODO PARA OBTENER SOLO LA HORA
  private extraerHora(fechaHora: string): string {
    const date = new Date(fechaHora);
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}
