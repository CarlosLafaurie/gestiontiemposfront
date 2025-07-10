import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environments';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { RegistroJornadaService, ResumenEmpleado } from './registrojornada.service';
import { AusentismoService, TiempoAusentismo } from './documento-permiso.service';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private registroJornadaService: RegistroJornadaService,
    private ausentismoService: AusentismoService
  ) {}

  generarYExportarExcel() {
    const hoy = new Date();
    const hace15Dias = new Date();
    hace15Dias.setDate(hoy.getDate() - 15);

    const fechaInicio = hace15Dias.toISOString().slice(0, 10);
    const fechaFin = hoy.toISOString().slice(0, 10);

    this.registroJornadaService.obtenerResumenHoras(fechaInicio, fechaFin).subscribe(resumen => {
      this.ausentismoService.getDocumentos().subscribe(ausentismos => {
        this.exportarExcel(resumen, ausentismos);
      });
    });
  }

  exportarExcel(resumenEmpleados: ResumenEmpleado[], ausentismos: TiempoAusentismo[]) {
    const workbook = XLSX.utils.book_new();

    const grupos = resumenEmpleados.reduce((acc, emp) => {
      (acc[emp.nombreCompleto] ||= []).push(emp);
      return acc;
    }, {} as Record<string, ResumenEmpleado[]>);

    const ausMap = ausentismos.reduce((acc, aus) => {
      (acc[aus.nombreEmpleado] ||= []).push(aus);
      return acc;
    }, {} as Record<string, TiempoAusentismo[]>);

    const empleadosUnicos = new Set([
      ...Object.keys(grupos),
      ...Object.keys(ausMap)
    ]);

    empleadosUnicos.forEach(nombre => {
      const jornadas = grupos[nombre] || [];
      const aus = ausMap[nombre] || [];

      const filas: any[] = [];

      jornadas.forEach(j => {
        filas.push({
          fecha: j.fecha,
          jornada: 'X',
          entrada: this.extraerHora(j.horaEntrada),
          salida: this.extraerHora(j.horaSalida),
          total: j.horasTrabajadas.toFixed(2),
          extraDiurna: j.horasExtrasDiurnas.toFixed(2),
          nocturno: j.horasNocturnas.toFixed(2),
          nocturnoDomFest: j.trabajoDomingo ? j.horasNocturnas.toFixed(2) : '0',
          dom75: j.trabajoFestivo ? (j.horasExtrasDiurnas * 0.75).toFixed(2) : '0',
          extraDom: (j.trabajoFestivo || j.trabajoDomingo)
            ? (j.horasNocturnas * 0.75 + j.horasExtrasDiurnas * 0.75).toFixed(2)
            : '0',
          ausentismo: '',
          esAusente: false
        });
      });

      aus.forEach(a => {
        const inicio = new Date(a.fechaInicio);
        const fin = new Date(a.fechaFin);

        for (let fecha = new Date(inicio); fecha <= fin; fecha.setDate(fecha.getDate() + 1)) {
          const copia = new Date(fecha);
          filas.push({
            fecha: copia.toISOString(),
            jornada: 'X',
            entrada: 'AUSENTE',
            salida: 'AUSENTE',
            total: '0',
            extraDiurna: '0',
            nocturno: '0',
            nocturnoDomFest: '0',
            dom75: '0',
            extraDom: '0',
            ausentismo: a.comentarios,
            esAusente: true
          });
        }
      });

      filas.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

      const data: any[][] = [[
        'N°', 'FECHA', 'DÍA', 'JORNADA',
        'HORA DE ENTRADA', 'HORA DE SALIDA',
        'TOTAL HORAS TRABAJADAS (96 h. quincena)',
        'HORAS EXTRA (+25%)',
        'RECARGOS NOCTURNOS (+35%)',
        'RECARGOS NOCTURNOS DOMINICALES O FESTIVOS',
        'RECARGOS DOMINICALES (+75%)',
        'HORA EXTRA DOMINICAL',
        'AUSENTISMO'
      ]];

      let contador = 1;
      filas.forEach(fila => {
        const fechaFormateada = this.formatearFecha(fila.fecha);
        const dia = this.obtenerDiaSemana(fila.fecha);
        data.push([
          fila.esAusente ? '' : String(contador++),
          fechaFormateada,
          dia,
          fila.jornada,
          fila.entrada,
          fila.salida,
          fila.total,
          fila.extraDiurna,
          fila.nocturno,
          fila.nocturnoDomFest,
          fila.dom75,
          fila.extraDom,
          fila.ausentismo
        ]);
      });

      const sheet = XLSX.utils.aoa_to_sheet(data);

      // 👉 Aplicar color a filas de ausentismo
      filas.forEach((fila, index) => {
        if (fila.esAusente) {
          const excelRowIndex = index + 2; // +1 por encabezado, +1 porque el índice arranca en 0
          for (let col = 0; col < 13; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: excelRowIndex - 1, c: col });
            if (!sheet[cellRef]) continue;
            sheet[cellRef].s = {
              fill: {
                patternType: 'solid',
                fgColor: { rgb: 'DDDDDD' } // gris claro
              }
            };
          }
        }
      });

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
    const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    return dias[d.getDay()];
  }

  private extraerHora(fechaHora: string): string {
    const date = new Date(fechaHora);
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}
