import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../navbar/navbar.component';
import { EmpleadoService } from '../../services/empleado-service.service';
import { TiemposService, Tiempo } from '../../services/tiempos.service.service';
import { ExcelService } from '../../services/excel.service.ts.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'tiempos-admin',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './tiempos-admin.component.html',
  styleUrls: ['./tiempos-admin.component.css']
})
export class TiemposAdminComponent implements OnInit {
  empleados: any[] = [];
  ingresos: Tiempo[] = [];
  salidas: Tiempo[] = [];
  resumenEmpleados: any[] = [];

  private empleadoService = inject(EmpleadoService);
  private tiemposService = inject(TiemposService);
  private excelService = inject(ExcelService);

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    forkJoin({
      empleados: this.empleadoService.obtenerEmpleados(),
      ingresos: this.tiemposService.obtenerIngresos(),
      salidas: this.tiemposService.obtenerSalidas()
    }).subscribe({
      next: ({ empleados, ingresos, salidas }) => {
        this.empleados = empleados;
        this.ingresos = ingresos;
        this.salidas = salidas;
        this.procesarResumen();
      },
      error: (err) => console.error('❌ Error al cargar datos:', err)
    });
  }

  procesarResumen(): void {
    if (!this.empleados.length || !this.ingresos.length || !this.salidas.length) {
      console.warn("⚠️ No hay suficientes datos para calcular las horas trabajadas.");
      return;
    }

    this.resumenEmpleados = this.empleados.map(emp => {
      const ingresosEmp = this.ingresos
        .filter(ing => ing.empleadoId === emp.id && ing.fechaHoraEntrada)
        .sort((a, b) => new Date(a.fechaHoraEntrada as string).getTime() - new Date(b.fechaHoraEntrada as string).getTime());

      const salidasEmp = this.salidas
        .filter(sal => sal.empleadoId === emp.id && sal.fechaHoraSalida)
        .sort((a, b) => new Date(a.fechaHoraSalida as string).getTime() - new Date(b.fechaHoraSalida as string).getTime());

      let totalHoras = 0;
      let diasUnicos = new Set<string>();
      let i = 0, j = 0;

      while (i < ingresosEmp.length && j < salidasEmp.length) {
        const entrada = ingresosEmp[i].fechaHoraEntrada ? new Date(ingresosEmp[i].fechaHoraEntrada as string) : null;
        const salida = salidasEmp[j].fechaHoraSalida ? new Date(salidasEmp[j].fechaHoraSalida as string) : null;

        if (entrada && salida && salida >= entrada) {
          totalHoras += (salida.getTime() - entrada.getTime()) / 3600000;

          // Guardar el día (YYYY-MM-DD) como string
          const dia = entrada.toISOString().split('T')[0];
          diasUnicos.add(dia);

          i++;
          j++;
        } else {
          j++;
        }
      }

      // Restar 1.5 horas por cada día trabajado
      const horasARestar = diasUnicos.size * 1.5;
      totalHoras = Math.max(0, totalHoras - horasARestar); // evitar negativos

      return { ...emp, totalHoras: totalHoras.toFixed(2) };
    });
  }

  exportarExcel(): void {
    const empleadosConTiempos = this.empleados.map(emp => ({
      ...emp,
      tiempos: this.ingresos
        .filter(i => i.empleadoId === emp.id)
        .map(i => ({
          fechaHoraEntrada: i.fechaHoraEntrada,
          fechaHoraSalida: this.salidas.find(
            s => s.empleadoId === emp.id &&
                 s.fechaHoraSalida &&
                 i.fechaHoraEntrada &&
                 new Date(s.fechaHoraSalida as string) >= new Date(i.fechaHoraEntrada as string)
          )?.fechaHoraSalida || null
        }))
    }));

    this.excelService.exportarExcel(this.resumenEmpleados, empleadosConTiempos);
  }
}
