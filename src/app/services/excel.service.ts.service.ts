import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { RegistroJornadaService, ResumenEmpleado } from './registrojornada.service';
import { AusentismoService, TiempoAusentismo } from './documento-permiso.service';

@Injectable({ providedIn: 'root' })
export class ExcelService {
  constructor(
    private registroJornadaService: RegistroJornadaService,
    private ausentismoService: AusentismoService
  ) {}

  generarYExportarExcel() {
    const hoy = new Date();
    const hace15 = new Date(hoy);
    hace15.setDate(hoy.getDate() - 15);

    const start = hace15.toISOString().slice(0, 10);
    const end   = hoy.toISOString().slice(0, 10);

    this.registroJornadaService
      .obtenerResumenHoras(start, end)
      .subscribe((jornadas: ResumenEmpleado[]) => {
        this.ausentismoService.getDocumentos()
          .subscribe((aus: TiempoAusentismo[]) => {
            this.buildWorkbook(jornadas, aus);
          });
      });
  }

  private buildWorkbook(
    jornadas: ResumenEmpleado[],
    ausentismos: TiempoAusentismo[]
  ) {
    const wb = XLSX.utils.book_new();
    const normalize = (s: string) => s.trim().toLowerCase();

    const jornMap = this.groupBy<ResumenEmpleado>(jornadas, j => normalize(j.nombreCompleto));
    const ausMap  = this.groupBy<TiempoAusentismo>(ausentismos, a => normalize(a.nombreEmpleado));

    const allKeys = new Set<string>([...Object.keys(jornMap), ...Object.keys(ausMap)]);
    const nombreOriginalMap: Record<string, string> = {};
    jornadas.forEach(j => nombreOriginalMap[normalize(j.nombreCompleto)] = j.nombreCompleto);
    ausentismos.forEach(a => {
      const k = normalize(a.nombreEmpleado);
      if (!nombreOriginalMap[k]) nombreOriginalMap[k] = a.nombreEmpleado;
    });

    allKeys.forEach(key => {
      const nombreOriginal = nombreOriginalMap[key];
      const js = jornMap[key] || [];
      const as = ausMap[key]  || [];
      const filas: any[] = [];

      js.forEach(j => filas.push(this.rowFromJornada(j)));

      as.forEach(a => {
        const ini = this.parseLocalDate(a.fechaInicio);
        const fin = this.parseLocalDate(a.fechaFin);

        for (let d = new Date(ini); d <= fin; d.setDate(d.getDate() + 1)) {
          const dia = this.truncDate(d);
          const existeJornada = js.some(j =>
            this.truncDate(this.parseLocalDate(j.fecha)).getTime() === dia.getTime()
          );
          if (!existeJornada) {
            filas.push(this.rowFromAusentismo(a, dia));
          }
        }
      });

      filas.sort((x, y) => x.fechaObj.getTime() - y.fechaObj.getTime());

      const aoa: any[][] = [[
        'N°','FECHA','DÍA','JORNADA',
        'HORA ENTRA','HORA SALE',
        'TOTAL (96h)','EXTRA (+25%)',
        'NOCT (+35%)','DOM/FEST',
        'DOM (+75%)','EXT. DOM','AUSENTISMO'
      ]];
      let cnt = 1;
      filas.forEach(f => {
        aoa.push([
          f.esAusente ? '' : String(cnt++),
          this.formatDate(f.fecha),
          this.weekday(f.fecha),
          f.jornada, f.entrada, f.salida,
          f.total, f.extra25, f.noct35,
          f.domFest, f.dom75, f.extraDom,
          f.comentarios
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      filas.forEach((f, i) => {
        if (f.esAusente) {
          const row = i + 1;
          for (let c = 0; c < aoa[0].length; c++) {
            const cell = XLSX.utils.encode_cell({ r: row, c });
            if (ws[cell]) {
              ws[cell].s = { fill: { patternType: 'solid', fgColor: { rgb: 'DDDDDD' } } };
            }
          }
        }
      });

      const name = nombreOriginal.slice(0, 31).replace(/[\[\]\*\/\\\?]/g, '');
      XLSX.utils.book_append_sheet(wb, ws, name);
    });

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'Resumen_Jornada_Empleados.xlsx');
  }

  private parseLocalDate(dt: string): Date {
    const [y, m, d] = dt.split('T')[0].split('-').map(v => parseInt(v, 10));
    return new Date(y, m - 1, d);
  }

  private truncDate(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private rowFromJornada(j: ResumenEmpleado) {
    const fechaObj = new Date(j.horaEntrada);
    return {
      fecha: j.horaEntrada.split('T')[0],
      fechaObj,
      jornada: 'X',
      entrada: this.hhmm(j.horaEntrada),
      salida: this.hhmm(j.horaSalida),
      total: j.horasTrabajadas.toFixed(2),
      extra25: j.horasExtrasDiurnas.toFixed(2),
      noct35: j.horasNocturnas.toFixed(2),
      domFest: j.trabajoDomingo ? j.horasNocturnas.toFixed(2) : '0',
      dom75: j.trabajoFestivo ? (j.horasExtrasDiurnas * 0.75).toFixed(2) : '0',
      extraDom: (j.trabajoDomingo || j.trabajoFestivo)
        ? (j.horasNocturnas * 0.75 + j.horasExtrasDiurnas * 0.75).toFixed(2)
        : '0',
      comentarios: '',
      esAusente: false
    };
  }

  private rowFromAusentismo(a: TiempoAusentismo, fecha: Date) {
    const iso = `${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}-${String(fecha.getDate()).padStart(2,'0')}`;
    return {
      fecha: iso,
      fechaObj: fecha,
      jornada: 'X',
      entrada: 'AUSENTE',
      salida: 'AUSENTE',
      total: '0', extra25: '0', noct35: '0',
      domFest: '0', dom75: '0', extraDom: '0',
      comentarios: a.comentarios,
      esAusente: true
    };
  }

  private formatDate(iso: string) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  private weekday(iso: string) {
    const d = this.parseLocalDate(iso);
    const dias = ['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];
    return dias[d.getDay()];
  }

  private hhmm(iso: string) {
    const dt = new Date(iso);
    return `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
  }

  private groupBy<T>(arr: T[], fn: (t: T) => string): { [k: string]: T[] } {
    return arr.reduce((r, o) => {
      const k = fn(o);
      (r[k] ||= []).push(o);
      return r;
    }, {} as { [k: string]: T[] });
  }
}
