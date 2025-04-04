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
  obras: Obra[] = [];
  responsables: any[] = [];
  empleadosFiltrados: Empleado[] = [];
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
    salario: 0
  };

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
    this.empleadoService.obtenerEmpleados().subscribe({
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
        this.responsables = data.filter(user => user.rol && user.rol.toLowerCase() === 'responsable');
      },
      error: (err) => console.error('❌ Error al obtener responsables:', err)
    });
  }

  filtrarEmpleados(): void {
    if (!this.searchQuery) {
      this.empleadosFiltrados = this.empleados;
    } else {
      const q = this.searchQuery.toLowerCase();
      this.empleadosFiltrados = this.empleados.filter(u =>
        (u.nombreCompleto && u.nombreCompleto.toLowerCase().includes(q)) ||
        (u.responsable && u.responsable.toLowerCase().includes(q)) ||
        (u.responsableSecundario && u.responsableSecundario.toLowerCase().includes(q)) ||
        (u.cedula && u.cedula.toLowerCase().includes(q)) ||
        (u.cargo && u.cargo.toLowerCase().includes(q)) ||
        (u.obra && u.obra.toLowerCase().includes(q))
      );
    }
  }

  mostrarFormularioEmpleado(empleado: Empleado | null = null): void {
    this.mostrarFormulario = true;
    this.esEdicion = empleado !== null;
    if (empleado) {
      this.empleadoActual = { ...empleado };
    } else {
      this.empleadoActual = { id: 0, cedula: '', nombreCompleto: '', cargo: '', obra: '', responsable: '', responsableSecundario: '', salario: 0 };
    }
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.empleadoActual = { id: 0, cedula: '', nombreCompleto: '', cargo: '', obra: '', responsable: '', responsableSecundario: '', salario: 0 };
  }

 guardarEmpleado(): void {
    console.log("📌 Intentando guardar empleado...", this.empleadoActual);

    if (
      !this.empleadoActual.cedula ||
      !this.empleadoActual.nombreCompleto ||
      !this.empleadoActual.cargo ||
      !this.empleadoActual.obra ||
      !this.empleadoActual.responsable ||
      this.empleadoActual.salario === undefined || this.empleadoActual.salario === null || this.empleadoActual.salario <= 0
    ) {
      console.error("❌ Todos los campos obligatorios deben estar completos", this.empleadoActual);
      return;
    }

    if (!this.empleadoActual.estado) {
      this.empleadoActual.estado = "Activo";
    }

    if (typeof this.empleadoActual.salario !== "number") {
      this.empleadoActual.salario = Number(this.empleadoActual.salario);
    }

    if (this.esEdicion) {
      console.log("✏️ Modo edición - Actualizando empleado con ID:", this.empleadoActual.id);

      this.empleadoService.actualizarEmpleado(this.empleadoActual.id, this.empleadoActual).subscribe({
        next: () => {
          console.log("✅ Empleado actualizado correctamente:", this.empleadoActual);
          this.cargarEmpleados();
          this.cerrarFormulario();
        },
        error: (error) => {
          console.error("❌ Error al actualizar empleado:", error);
          console.error("📌 Detalles del error:", error.error);
        }
      });
    } else {
      console.log("🆕 Modo creación - Creando nuevo empleado...");

      this.empleadoActual.id = 0;
      console.log("📤 Enviando al backend:", this.empleadoActual);

      this.empleadoService.crearEmpleado(this.empleadoActual).subscribe({
        next: (response) => {
          console.log("✅ Empleado agregado correctamente:", response);
          this.cargarEmpleados();
          this.cerrarFormulario();
        },
        error: (error) => {
          console.error("❌ Error al agregar empleado:", error);
          console.error("📌 Detalles del error:", error.error);
        }
      });
    }
}


  copiarContrasena(usuario: any): void {
    if (usuario.contrasena) {
      navigator.clipboard.writeText(usuario.contrasena)
        .then(() => alert('Contraseña copiada al portapapeles'))
        .catch(err => console.error('❌ Error al copiar la contraseña:', err));
    } else {
      alert('No hay contraseña para copiar');
    }
  }

  eliminarEmpleado(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este empleado?')) {
      this.empleadoService.eliminarEmpleado(id).subscribe({
        next: () => {
          console.log('✅ Empleado eliminado correctamente.');
          this.empleados = this.empleados.filter(emp => emp.id !== id);
          this.filtrarEmpleados();
        },
        error: (err) => {
          console.error('❌ Error al eliminar empleado:', err);
          alert('Error al eliminar empleado. Por favor, inténtalo nuevamente.');
        }
      });
    }
  }
}
