import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpleadoService, Empleado } from '../../services/empleado-service.service';
import { ObraService, Obra } from '../../services/obras.service';
import { UserService } from '../../services/user.service';
import { NavbarComponent } from '../../navbar/navbar.component';

@Component({
  selector: 'app-empleados-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './empleados-admin.component.html',
  styleUrls: ['./empleados-admin.component.css']
})
export class EmpleadosAdminComponent implements OnInit {
  empleados: Empleado[] = [];
  empleadosFiltrados: Empleado[] = [];
  obras: Obra[] = [];
  responsables: any[] = [];
  searchQuery: string = '';

  mostrarFormulario = false;
  esEdicion = false;
  empleadoActual: Empleado = {
    id: 0,
    cedula: '',
    nombreCompleto: '',
    cargo: '',
    obra: '',
    responsable: '',
    responsableSecundario: '',
    estado: 'Activo',
    salario: 0,
    telefono: '',
    numeroCuenta: '',
  };

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 1;

  private empleadoService = inject(EmpleadoService);
  private obraService = inject(ObraService);
  private userService = inject(UserService);

  constructor() {}

  ngOnInit(): void {
    this.cargarEmpleados();
    this.cargarObras();
    this.cargarResponsables();
  }

  cargarEmpleados(): void {
    this.empleadoService.obtenerEmpleados(1, 1000).subscribe({
      next: (data) => {
        this.empleados = data;
        this.filtrarEmpleados();
      },
      error: (err) => console.error('❌ Error al obtener empleados:', err)
    });
  }

  cargarObras(): void {
    this.obraService.getObras().subscribe({
      next: (data) => {
        this.obras = data;
      },
      error: (err) => console.error('❌ Error al obtener obras:', err)
    });
  }

  cargarResponsables(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.responsables = data.filter(user => user.rol?.toLowerCase() === 'responsable');
      },
      error: (err) => console.error('❌ Error al obtener responsables:', err)
    });
  }

  filtrarEmpleados(): void {
    const q = this.searchQuery.toLowerCase();
    this.empleadosFiltrados = this.empleados.filter(u =>
      u.nombreCompleto?.toLowerCase().includes(q) ||
      u.responsable?.toLowerCase().includes(q) ||
      u.responsableSecundario?.toLowerCase().includes(q) ||
      u.cedula?.toLowerCase().includes(q) ||
      u.cargo?.toLowerCase().includes(q) ||
      u.telefono?.toLowerCase().includes(q) ||
      u.numeroCuenta?.toLowerCase().includes(q) ||
      u.obra?.toLowerCase().includes(q)
    );

    this.totalPaginas = Math.ceil(this.empleadosFiltrados.length / this.itemsPorPagina);
    this.paginaActual = 1;
  }

  get empleadosPaginados(): Empleado[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.empleadosFiltrados.slice(inicio, fin);
  }


  cambiarPagina(delta: number): void {
    this.paginaActual += delta;
    if (this.paginaActual < 1) this.paginaActual = 1;
    if (this.paginaActual > this.totalPaginas) this.paginaActual = this.totalPaginas;
  }

  mostrarFormularioEmpleado(empleado: Empleado | null = null): void {
    this.mostrarFormulario = true;
    this.esEdicion = !!empleado;
    this.empleadoActual = empleado ? { ...empleado } : {
      id: 0, cedula: '', nombreCompleto: '', cargo: '', obra: '', responsable: '',
      responsableSecundario: '', salario: 0, telefono: '', numeroCuenta: '', estado: 'Activo'
    };
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.empleadoActual = {
      id: 0, cedula: '', nombreCompleto: '', cargo: '', obra: '', responsable: '',
      responsableSecundario: '', salario: 0, telefono: '', numeroCuenta: '', estado: 'Activo'
    };
  }

  guardarEmpleado(): void {
    if (!this.empleadoActual.cedula || !this.empleadoActual.nombreCompleto || !this.empleadoActual.cargo ||
        !this.empleadoActual.obra || !this.empleadoActual.responsable || !this.empleadoActual.responsableSecundario ||
        !this.empleadoActual.telefono || !this.empleadoActual.numeroCuenta || this.empleadoActual.salario <= 0) {
      alert('Completa todos los campos requeridos.');
      return;
    }

    if (this.esEdicion) {
      this.empleadoService.actualizarEmpleado(this.empleadoActual.id, this.empleadoActual).subscribe({
        next: () => {
          this.cargarEmpleados();
          this.cerrarFormulario();
        },
        error: err => console.error('Error al actualizar:', err)
      });
    } else {
      this.empleadoActual.id = 0;
      this.empleadoService.crearEmpleado(this.empleadoActual).subscribe({
        next: () => {
          this.cargarEmpleados();
          this.cerrarFormulario();
        },
        error: err => console.error('Error al crear:', err)
      });
    }
  }

  eliminarEmpleado(id: number): void {
    if (confirm('¿Deseas eliminar este empleado?')) {
      this.empleadoService.eliminarEmpleado(id).subscribe({
        next: () => {
          this.cargarEmpleados();
        },
        error: err => console.error('Error al eliminar:', err)
      });
    }
  }
}
