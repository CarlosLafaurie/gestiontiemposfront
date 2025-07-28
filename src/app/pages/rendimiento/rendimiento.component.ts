import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { RendimientoService, Rendimiento } from '../../services/rendimiento.service';
import { EmpleadoService } from '../../services/empleado-service.service';
// import { ContratistaService } from '../../services/contratista.service'; // ← comentado

@Component({
  selector: 'app-rendimiento',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent,
    BotonRegresarComponent
  ],
  templateUrl: './rendimiento.component.html',
  styleUrls: ['./rendimiento.component.css']
})
export class RendimientoComponent implements OnInit {
  rendimiento: Rendimiento = {
    id: 0,
    idEmpleado: 0,
    actividad: '',
    dias: 0,
    unidad: '',
    cantidad: 0,
    observaciones: '',
    idContratista: 0,
    obraId: 0
  };

  destinatarioTipo: string = ''; // 'empleado' o 'contratista'
  actividades: string[] = [];
  unidades: string[] = [];
  empleados: { id: number; nombre: string }[] = [];
  contratistas: { id: number; nombre: string }[] = [];

  private rendimientoService = inject(RendimientoService);
  private empleadoService = inject(EmpleadoService);
  // private contratistaService = inject(ContratistaService); // ← comentado

  ngOnInit(): void {
    this.cargarActividades();
    this.cargarUnidades();
    this.cargarEmpleados();
    // this.cargarContratistas(); // ← comentado
  }

  cargarActividades(): void {
    this.rendimientoService.obtenerActividades().subscribe({
      next: res => this.actividades = res,
      error: () => alert('Error al cargar actividades')
    });
  }

  cargarUnidades(): void {
    this.rendimientoService.obtenerUnidades().subscribe({
      next: res => this.unidades = res,
      error: () => alert('Error al cargar unidades')
    });
  }

  cargarEmpleados(): void {
    this.empleadoService.obtenerEmpleados(1, 150).subscribe({
      next: data => {
        this.empleados = data.map(e => ({ id: e.id, nombre: e.nombreCompleto }));
      },
      error: () => alert('Error al cargar empleados')
    });
  }

  // cargarContratistas(): void {
  //   this.contratistaService.obtenerContratistas().subscribe({
  //     next: data => {
  //       this.contratistas = data.map(c => ({ id: c.id, nombre: c.nombre }));
  //     },
  //     error: () => alert('Error al cargar contratistas')
  //   });
  // }

guardarRendimiento(): void {
  if (!this.rendimiento.actividad || !this.rendimiento.unidad) {
    alert('Debe seleccionar una actividad y unidad.');
    return;
  }

  if (this.destinatarioTipo === 'empleado' && !this.rendimiento.idEmpleado) {
    alert('Debe seleccionar un empleado.');
    return;
  }

  if (this.destinatarioTipo === 'contratista' && !this.rendimiento.idContratista) {
    alert('Debe seleccionar un contratista.');
    return;
  }

  if (this.destinatarioTipo === 'empleado') {
    this.rendimiento.idContratista = 0;
  } else if (this.destinatarioTipo === 'contratista') {
    this.rendimiento.idEmpleado = 0;
  }

  const obraIdStr = localStorage.getItem('obra-id');
  if (!obraIdStr) {
    alert('No se encontró la obra actual. Reingrese sesión.');
    return;
  }

  this.rendimiento.obraId = parseInt(obraIdStr, 10);

  this.rendimientoService.crear(this.rendimiento).subscribe({
    next: () => {
      alert('Rendimiento guardado con éxito');
      this.resetFormulario();
    },
    error: () => alert('Error al guardar rendimiento')
  });
}

  private resetFormulario(): void {
    this.rendimiento = {
      id: 0,
      idEmpleado: 0,
      actividad: '',
      dias: 0,
      unidad: '',
      cantidad: 0,
      observaciones: '',
      idContratista: 0,
      obraId: 0
    };
    this.destinatarioTipo = '';
  }
}
