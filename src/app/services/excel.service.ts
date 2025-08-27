  import { Injectable } from '@angular/core';
  import { saveAs } from 'file-saver';
  import * as XLSX from 'xlsx';
  import { RegistroJornadaService, ResumenEmpleado } from './registrojornada.service';
  import { AusentismoService, TiempoAusentismo } from './documento-permiso.service';
  import { TiemposService, Tiempo } from './tiempos.service.service';
  import { forkJoin } from 'rxjs';

  @Injectable({ providedIn: 'root' })
  export class ExcelService {
    constructor(
      private registroJornadaService: RegistroJornadaService,
      private ausentismoService: AusentismoService,
      private tiemposService: TiemposService
    ) {}

    generarYExportarExcel(
      fechaInicio: string,
      fechaFin: string,
      ubicacion?: string,
      empleadosFiltrados?: ResumenEmpleado[]
    ) {
      forkJoin({
        jornadas: this.registroJornadaService.obtenerResumenHoras(fechaInicio, fechaFin),
        aus: this.ausentismoService.getDocumentos(),
        tiempos: this.tiemposService.obtenerTiempos()
      }).subscribe(({ jornadas, aus, tiempos }) => {
        let jornadasFiltradas = empleadosFiltrados ?? jornadas;

        if (!empleadosFiltrados && ubicacion) {
          jornadasFiltradas = jornadas.filter(j =>
            (j.ubicacion || '').trim().toLowerCase() === ubicacion.trim().toLowerCase()
          );
        }

        const tiemposEnRango = (tiempos || [])
          .filter(t => this.tiempoEnRango(t, fechaInicio, fechaFin));

          const nombresFiltrados = new Set(
            (jornadasFiltradas || []).map(j => (j.nombreCompleto || '').trim().toLowerCase())
          );

          const ausFiltrados = aus.filter(a =>
            nombresFiltrados.has((a.nombreEmpleado || '').trim().toLowerCase())
          );

          const tiemposFiltrados = tiemposEnRango.filter(t =>
            nombresFiltrados.has((t.nombreEmpleado || '').trim().toLowerCase())
          );

          this.buildWorkbook(jornadasFiltradas, ausFiltrados, tiemposFiltrados);
      });
    }

  private tiempoEnRango(t: Tiempo, fechaInicio: string, fechaFin: string): boolean {
    const inicio = new Date(fechaInicio + 'T00:00:00');
    const fin = new Date(fechaFin + 'T23:59:59');

    const entrada = t.fechaHoraEntrada ? new Date(t.fechaHoraEntrada) : null;
    const salida = t.fechaHoraSalida ? new Date(t.fechaHoraSalida) : null;

    if (entrada && salida) {
      return entrada <= fin && salida >= inicio;
    }

    if (entrada) {
      return entrada >= inicio && entrada <= fin;
    }

    if (salida) {
      return salida >= inicio && salida <= fin;
    }

      return false;
    }

    private buildWorkbook(
      jornadas: ResumenEmpleado[],
      ausentismos: TiempoAusentismo[],
      tiemposAdicionales: Tiempo[]
    ) {
      const wb = XLSX.utils.book_new();
      const normalize = (s: string) => (s || '').trim().toLowerCase();

      const jornMap = this.groupBy<ResumenEmpleado>(jornadas, j => normalize(j.nombreCompleto));
      const ausMap  = this.groupBy<TiempoAusentismo>(ausentismos, a => normalize(a.nombreEmpleado));
      const tiemposMap = this.groupBy<Tiempo>(tiemposAdicionales, t => normalize(t.nombreEmpleado || ''));

      const allKeys = new Set<string>([...Object.keys(jornMap), ...Object.keys(ausMap), ...Object.keys(tiemposMap)]);
      const nombreOriginalMap: Record<string, string> = {};
      jornadas.forEach(j => nombreOriginalMap[normalize(j.nombreCompleto)] = j.nombreCompleto);
      ausentismos.forEach(a => {
        const k = normalize(a.nombreEmpleado);
        if (!nombreOriginalMap[k]) nombreOriginalMap[k] = a.nombreEmpleado;
      });
      tiemposAdicionales.forEach(t => {
        const k = normalize(t.nombreEmpleado || '');
        if (!nombreOriginalMap[k]) nombreOriginalMap[k] = t.nombreEmpleado || '[SIN NOMBRE]';
      });

      allKeys.forEach(key => {
        const nombreOriginal = nombreOriginalMap[key] || key;
        const js = jornMap[key] || [];
        const as = ausMap[key]  || [];
        const ts = tiemposMap[key] || [];
        const filas: any[] = [];

        const tiemposByDate: Record<string, Tiempo[]> = {};
        ts.forEach(t => {
          if (t.fechaHoraEntrada && t.fechaHoraSalida) {
            const entrada = new Date(t.fechaHoraEntrada);
            const salida = new Date(t.fechaHoraSalida);

            if (salida <= entrada) {
              salida.setDate(salida.getDate() + 1);
            }

            const horasTrabajadas = Math.round(((salida.getTime() - entrada.getTime()) / 1000 / 60 / 60) * 100) / 100;

          filas.push({
            fechaEntrada: t.fechaHoraEntrada?.split('T')[0] || '',
            fechaSalida: t.fechaHoraSalida?.split('T')[0] || '',
            fechaObj: new Date(t.fechaHoraEntrada || t.fechaHoraSalida || ''), // solo para ordenar
            jornada: 'X',
            entrada: t.fechaHoraEntrada?.substring(11,16) || '', // HH:MM
            salida: t.fechaHoraSalida?.substring(11,16) || '',   // HH:MM
            horaNum: t.fechaHoraEntrada ? parseInt(t.fechaHoraEntrada.substr(11,2))*60 + parseInt(t.fechaHoraEntrada.substr(14,2)) : 0,
            total: horasTrabajadas,
            extra25: '0.00',
            noct35: '0.00',
            domFest: '0',
            dom75: '0',
            extraDom: '0',
            comentarios: t.comentarios || '',
            esAusente: false,
            fuente: 'TIEMPO_ADICIONAL',
            notas: ''
          });

          } else {
            if (t.fechaHoraEntrada) {
              filas.push(this.rowFromTiempo(t, 'entrada', new Date(t.fechaHoraEntrada)));
            }
            if (t.fechaHoraSalida) {
              filas.push(this.rowFromTiempo(t, 'salida', new Date(t.fechaHoraSalida)));
            }
          }
        });

        js.forEach(j => filas.push(...this.rowFromJornada(j, 'JORNADA')));

        as.forEach(a => {
          const ini = this.parseLocalDate(a.fechaInicio);
          const fin = this.parseLocalDate(a.fechaFin);
          for (let d = new Date(ini); d <= fin; d.setDate(d.getDate() + 1)) {
            const dia = this.truncDate(d);
            filas.push(this.rowFromAusentismo(a, dia));
          }
        });

        Object.keys(tiemposByDate).forEach(fecha => {
          const fechaObj = this.parseLocalDate(fecha);
          tiemposByDate[fecha].forEach(t => {
            if (t.fechaHoraEntrada) {
              filas.push(this.rowFromTiempo(t, 'entrada', fechaObj));
            }
            if (t.fechaHoraSalida) {
              filas.push(this.rowFromTiempo(t, 'salida', fechaObj));
            }
          });
        });

        filas.sort((x, y) => {
          const a = x.fechaObj?.getTime() ?? 0;
          const b = y.fechaObj?.getTime() ?? 0;
          if (a !== b) return a - b;
          const ha = x.horaNum ?? 0;
          const hb = y.horaNum ?? 0;
          return ha - hb;
        });

        const aoa: any[][] = [[
          'N°','FECHA ENTRADA','FECHA SALIDA','DÍA','JORNADA',
          'HORA ENTRA','HORA SALE',
          'TOTAL (96h)','EXTRA (+25%)',
          'NOCT (+35%)','DOM/FEST',
          'DOM (+75%)','EXT. DOM','AUSENTISMO','FUENTE','COMENTARIOS'
        ]];
        let cnt = 1;
        filas.forEach(f => {
        aoa.push([
            f.esAusente ? '' : String(cnt++),
            this.formatDate(f.fechaEntrada || f.fecha),
            this.formatDate(f.fechaSalida || f.fecha),
            f.diaTexto,
            f.jornada, f.entrada, f.salida,
            f.total, f.extra25, f.noct35,
            f.domFest, f.dom75, f.extraDom,
            f.comentarios || '',
            f.fuente || '',
            f.notas || ''
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(aoa);
        const name = nombreOriginal.slice(0, 31).replace(/[\[\]\*\/\\\?]/g, '');
        XLSX.utils.book_append_sheet(wb, ws, name);
      });

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'Resumen_Jornada_Empleados.xlsx');
    }

    private rowFromJornada(j: ResumenEmpleado, fuente = 'JORNADA'): any[] {
      const entrada = new Date(j.horaEntrada);
      const salida = new Date(j.horaSalida);

      if (salida < entrada) {
        salida.setDate(salida.getDate() + 1);
      }

    const totalHoras = Math.round(((salida.getTime() - entrada.getTime()) / 1000 / 60 / 60) * 100) / 100;
      let diaTexto = this.weekdayISO(entrada);
      if (entrada.getDate() !== salida.getDate()) {
        diaTexto = `${this.weekdayISO(entrada)}/${this.weekdayISO(salida)}`;
      }

      return [{
        fechaEntrada: j.horaEntrada?.split('T')[0] || '',
        fechaSalida: j.horaSalida?.split('T')[0] || '',
        diaTexto: diaTexto,
        jornada: 'X',
        entrada: this.hhmm(j.horaEntrada),
        salida: this.hhmm(j.horaSalida),
        total: Number(totalHoras.toFixed(2)),
        extra25: Number(j.horasExtrasDiurnas ?? 0),
        noct35: Number(j.horasNocturnas ?? 0),
        domFest: j.trabajoDomingo ? Number(j.horasNocturnas ?? 0) : 0,
        dom75: j.trabajoFestivo ? Math.round(Number(j.horasExtrasDiurnas ?? 0) * 0.75 * 100) / 100 : 0,
        extraDom: (j.trabajoDomingo || j.trabajoFestivo)
          ? Math.round(((Number(j.horasNocturnas ?? 0) + Number(j.horasExtrasDiurnas ?? 0)) * 0.75) * 100) / 100
          : 0,
        comentarios: 'EXTRAS NOCTURNAS DOMINICALES',
        esAusente: false,
        fuente: fuente,
        fechaObj: entrada,
        notas: ''
      }];
    }

    private weekdayISO(d: Date) {
      const dias = ['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];
      return dias[d.getDay()];
    }

private rowFromAusentismo(a: TiempoAusentismo, fecha: Date) {
  const iso = `${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}-${String(fecha.getDate()).padStart(2,'0')}`;

  const comentario = (a.comentarios || '').trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  let tipoAusencia = 'AUSENTE';
  if (comentario.includes('incapacidad')) {
    tipoAusencia = 'INCAPACIDAD';
  } else if (comentario.includes('enfermo') || comentario.includes('enfermedad')) {
    tipoAusencia = 'ENFERMEDAD GENERAL';
  } else if (comentario.includes('descanso')) {
    tipoAusencia = 'DESCANSO';
  } else if (comentario.includes('permiso')) {
    tipoAusencia = 'PERMISO';
  } else if (comentario.includes('suspension')) {
    tipoAusencia = 'SUSPENSIÓN';
  } else if (comentario.includes('sin justificacion') || comentario.includes('sin justificación')) {
    tipoAusencia = 'AUSENTISMO';
  }

  return {
    fecha: iso,
    fechaObj: fecha,
    jornada: 'X',
    entrada: tipoAusencia,
    salida: tipoAusencia,
    total: 0,
    extra25: 0,
    noct35: 0,
    domFest: 0,
    dom75: 0,
    extraDom: 0,
    comentarios: a.comentarios || '',
    esAusente: true,
    fuente: 'AUSENTISMO',
    notas: ''
  };
}

  private rowFromTiempo(t: Tiempo, tipo: 'entrada'|'salida', fechaFallback: Date) {
    const horaIso = tipo === 'entrada' ? t.fechaHoraEntrada : t.fechaHoraSalida;
    const dt = horaIso ? new Date(horaIso) : fechaFallback;

    const fechaIso = horaIso
      ? horaIso.split('T')[0]
      : `${fechaFallback.getFullYear()}-${String(fechaFallback.getMonth() + 1).padStart(2,'0')}-${String(fechaFallback.getDate()).padStart(2,'0')}`;

    const horaText = horaIso ? this.hhmm(horaIso) : '';

    return {
      fecha: fechaIso,
      fechaEntrada: tipo === 'entrada' ? fechaIso : '',
      fechaSalida: tipo === 'salida' ? fechaIso : '',
      fechaObj: dt,
      jornada: 'AD',
      entrada: tipo === 'entrada' ? horaText : '',
      salida: tipo === 'salida' ? horaText : '',
      total: 0,
      extra25: 0,
      noct35: 0,
      domFest: 0,
      dom75: 0,
      extraDom: 0,
      comentarios: t.comentarios || '',
      esAusente: false,
      fuente: tipo === 'entrada' ? 'INGRESO_ADICIONAL' : 'SALIDA_ADICIONAL',
      horaNum: dt.getHours() * 60 + dt.getMinutes(),
      notas: ''
    };
  }

    private extractDateFromTiempo(t: Tiempo): string | null {
      const s = t.fechaHoraEntrada || t.fechaHoraSalida;
      if (!s) return null;
      return s.split('T')[0];
    }

    private parseLocalDate(dt: string): Date {
      const [y, m, d] = dt.split('T')[0].split('-').map(v => parseInt(v, 10));
      return new Date(y, m - 1, d);
    }

    private truncDate(d: Date): Date {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    private formatDate(iso: string) {
      if (!iso) return '';
      const [y, m, d] = iso.split('-');
      return `${d}/${m}/${y}`;
    }

    private weekday(iso: string) {
      const d = this.parseLocalDate(iso);
      const dias = ['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];
      return dias[d.getDay()];
    }

    private hhmm(iso: string) {
      if (!iso) return '';
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
