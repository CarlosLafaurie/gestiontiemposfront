import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { RendimientoService, Rendimiento } from '../../services/rendimiento.service';
import { EmpleadoService } from '../../services/empleado-service.service';
import { ContratistaService, Contratista } from '../../services/contratista.service';
import { ObraService, Obra } from '../../services/obras.service';

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

  destinatarioTipo: string = '';
  actividades: string[] = [];
  unidades: string[] = [];
  empleados: { id: number; nombre: string }[] = [];
  contratistas: { id: number; nombre: string }[] = [];
  obras: Obra[] = [];

  nuevoContratista: Omit<Contratista, 'id'> = {
    nombre: '',
    cedula: '',
    telefono: '',
    obraId: 0
  };
  mostrarModalContratista = false;

  private rendimientoService = inject(RendimientoService);
  private empleadoService = inject(EmpleadoService);
  private contratistaService = inject(ContratistaService);
  private obraService = inject(ObraService);

  ngOnInit(): void {
    this.cargarActividades();
    this.cargarUnidades();
    this.cargarEmpleados();
    this.cargarContratistas();
    this.obtenerObras();
  }

  cargarActividades(): void {
    this.rendimientoService.obtenerActividades().subscribe({
      next: res => this.actividades = res,
      error: () => alert('Error al cargar actividades')
    });
  }

  obtenerObras(): void {
    this.obraService.getObras().subscribe(obras => this.obras = obras);
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

  cargarContratistas(): void {
    this.contratistaService.obtenerTodos().subscribe({
      next: data => {
        this.contratistas = data.map(c => ({ id: c.id, nombre: c.nombre }));
      },
      error: () => alert('Error al cargar contratistas')
    });
  }

  manejarCambioContratista(valor: number): void {
    if (valor === -1) {
      this.abrirModalContratista();
    }
  }

  abrirModalContratista(): void {
    const obraId = Number(localStorage.getItem('obra-id')) || 0;
    this.nuevoContratista = {
      nombre: '',
      cedula: '',
      telefono: '',
      obraId
    };
    this.mostrarModalContratista = true;
  }

  cerrarModalContratista(): void {
    this.mostrarModalContratista = false;
  }

  guardarNuevoContratista(): void {
    const { nombre, cedula, telefono, obraId } = this.nuevoContratista;
    if (!nombre || !cedula || !telefono) {
      alert('Todos los campos del contratista son obligatorios.');
      return;
    }

    this.contratistaService.crear(this.nuevoContratista).subscribe({
      next: (nuevo) => {
        this.contratistas.push({ id: nuevo.id, nombre: nuevo.nombre });
        this.rendimiento.idContratista = nuevo.id;
        this.mostrarModalContratista = false;
      },
      error: () => alert('Error al guardar contratista')
    });
  }

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
    } else {
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
