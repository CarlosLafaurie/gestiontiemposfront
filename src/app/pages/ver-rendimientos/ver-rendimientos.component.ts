import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { RendimientoService, ResumenRendimiento } from '../../services/rendimiento.service';
import { ObraService, Obra } from '../../services/obras.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ver-rendimientos',
  templateUrl: './ver-rendimientos.component.html',
  styleUrls: ['./ver-rendimientos.component.css'],
  standalone: true,
  imports: [NavbarComponent, BotonRegresarComponent, CommonModule, FormsModule],
})
export class VerRendimientosComponent implements OnInit {
  resumenRendimientos: (ResumenRendimiento & { mostrar: boolean; nombreObra?: string })[] = [];
  todosLosRendimientos: (ResumenRendimiento & { mostrar: boolean; nombreObra?: string })[] = [];
  obras: Obra[] = [];
  searchQuery: string = '';
  loading = true;

  constructor(
    private rendimientoService: RendimientoService,
    private obraService: ObraService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.obraService.getObras().subscribe({
      next: (obras) => {
        this.obras = obras;
        this.rendimientoService.obtenerResumenPorEmpleado().subscribe({
          next: (resumen) => {
            const rendimientosConObras = (resumen ?? []).map((emp) => {
              const obra = this.obras.find((o) => o.id === emp.obraId);
              return {
                ...emp,
                actividades: emp.actividades ?? [],
                mostrar: false,
                nombreObra: obra?.nombreObra ?? 'Obra no asignada',
              };
            });

            this.todosLosRendimientos = rendimientosConObras;
            this.resumenRendimientos = rendimientosConObras;
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          },
        });
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  filtrarRendimientos(): void {
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) {
      this.resumenRendimientos = this.todosLosRendimientos;
      return;
    }

    this.resumenRendimientos = this.todosLosRendimientos.filter(
      (emp) =>
        (emp.nombreEmpleado?.toLowerCase() ?? '').includes(query) ||
        (emp.nombreObra?.toLowerCase() ?? '').includes(query)
    );
  }

  toggleActividades(empId: number): void {
    const emp = this.resumenRendimientos.find((e) => e.idEmpleado === empId);
    if (emp) {
      emp.mostrar = !emp.mostrar;
    }
  }
}
