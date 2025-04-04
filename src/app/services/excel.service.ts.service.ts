import * as XLSX from 'xlsx';
import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Tiempo {
  fechaHoraEntrada: string | null | undefined;
  fechaHoraSalida?: string | null | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  private apiUrl = 'https://tu-api.com';

  constructor(private http: HttpClient) {}

  getResumenEmpleados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/resumen-empleados`);
  }

  getEmpleadosConTiempos(): Observable<{ nombre: string; tiempos: Tiempo[] }[]> {
    return this.http.get<{ nombre: string; tiempos: Tiempo[] }[]>(`${this.apiUrl}/empleados-tiempos`);
  }

  exportarExcel(resumenEmpleados: any[], empleadosConTiempos: { nombreCompleto: string; tiempos: Tiempo[] }[]) {
    const workbook = XLSX.utils.book_new();

    const resumenData = [['Nombre', 'Cédula', 'Sueldo', 'Cargo', 'Obra', 'Horas Trabajadas']];
    resumenEmpleados.forEach(emp => {
      resumenData.push([
        emp.nombreCompleto || '-',
        emp.cedula ? emp.cedula.toString() : '-',
        emp.salario ? emp.salario.toString() : '-',
        emp.cargo || '-',
        emp.obra || '-',
        emp.totalHoras ? emp.totalHoras.toString() : '0'
      ]);
    });
    const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen');

    empleadosConTiempos.forEach((emp, index) => {
      const sheetData = [['Fecha', 'Hora de Entrada', 'Hora de Salida']];
      emp.tiempos.forEach((t: Tiempo) => {
        const fechaEntrada = t.fechaHoraEntrada && typeof t.fechaHoraEntrada === 'string'
          ? new Date(t.fechaHoraEntrada).toLocaleDateString()
          : '-';
        const horaEntrada = t.fechaHoraEntrada && typeof t.fechaHoraEntrada === 'string'
          ? new Date(t.fechaHoraEntrada).toLocaleTimeString()
          : '-';
        const horaSalida = t.fechaHoraSalida && typeof t.fechaHoraSalida === 'string'
          ? new Date(t.fechaHoraSalida).toLocaleTimeString()
          : '-';
        sheetData.push([fechaEntrada, horaEntrada, horaSalida]);
      });
      const sheet = XLSX.utils.aoa_to_sheet(sheetData);

      const baseName = emp.nombreCompleto && emp.nombreCompleto.trim().length > 0 ? emp.nombreCompleto : 'Sin nombre';
      let sheetName = baseName;
      let count = 1;
      while (workbook.SheetNames.includes(sheetName)) {
        sheetName = `${baseName} ${count}`;
        count++;
      }

      XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    });

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(fileData, 'Reporte_Tiempos.xlsx');
  }
}
