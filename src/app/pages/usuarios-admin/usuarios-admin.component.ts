import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ObraService, Obra } from '../../services/obras.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './usuarios-admin.component.html',
  styleUrls: ['./usuarios-admin.component.css']
})
export class UsuariosAdminComponent implements OnInit {
  usuarios: any[] = [];
  usuariosFiltrados: any[] = [];
  obras: Obra[] = [];
  searchQuery: string = '';
  mostrarFormulario: boolean = false;
  esEdicion: boolean = false;
  usuarioActual: any = {
    id: 0,
    cedula: '',
    nombreCompleto: '',
    cargo: '',
    obraId: null,
    rol: '',
    estado: 'activo',
    contrasena: ''
  };

  private userService = inject(UserService);
  private obraService = inject(ObraService);

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarObras();
  }

  cargarUsuarios(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => { this.usuarios = data;
         this.filtrarUsuarios();
      },
      error: (err) => console.error('❌ Error al obtener usuarios:', err)
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

  filtrarUsuarios(): void {
    if (!this.searchQuery) {
      this.usuariosFiltrados = this.usuarios;
    } else {
      const q = this.searchQuery.toLowerCase();
      this.usuariosFiltrados = this.usuarios.filter(u =>
        (u.nombreCompleto && u.nombreCompleto.toLowerCase().includes(q)) ||
        (u.rol && u.rol.toLowerCase().includes(q)) ||
        (u.cedula && u.cedula.toLowerCase().includes(q)) ||
        (u.cargo && u.cargo.toLowerCase().includes(q)) ||
        (u.obra && u.obra.toLowerCase().includes(q))
      );
    }
  }

  mostrarFormularioUsuario(usuario: any = null): void {
    this.mostrarFormulario = true;
    this.esEdicion = usuario !== null;

    if (usuario) {
      const obraEncontrada = this.obras.find((obra) => obra.nombreObra === usuario.obra);
      this.usuarioActual = {
        ...usuario,
        obraId: obraEncontrada ? obraEncontrada.id : null
      };
    } else {
      this.usuarioActual = { id: 0, cedula: '', nombreCompleto: '', cargo: '', obraId: null, rol: '', estado: 'activo', contrasena: '' };
    }
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.usuarioActual = { id: 0, cedula: '', nombreCompleto: '', cargo: '', obraId: null, rol: '', estado: 'activo', contrasena: '' };
  }

  guardarUsuario(): void {
    if (
      !this.usuarioActual.cedula ||
      !this.usuarioActual.nombreCompleto ||
      !this.usuarioActual.cargo ||
      !this.usuarioActual.obraId ||
      !this.usuarioActual.rol ||
      !this.usuarioActual.contrasena
    ) {
      console.error('❌ Todos los campos son obligatorios');
      return;
    }

    const obraSeleccionada = this.obras.find((obra) => obra.id === Number(this.usuarioActual.obraId));
    if (!obraSeleccionada) {
      console.error('❌ La obra seleccionada no se encontró.');
      return;
    }

    const usuarioParaEnviar = {
      id: this.esEdicion ? this.usuarioActual.id : 0,
      cedula: this.usuarioActual.cedula,
      nombreCompleto: this.usuarioActual.nombreCompleto,
      cargo: this.usuarioActual.cargo,
      obra: obraSeleccionada.nombreObra,
      rol: this.usuarioActual.rol,
      contrasenaHash: this.usuarioActual.contrasena,
      estado: this.usuarioActual.estado || 'activo'
    };

    if (this.esEdicion) {
      this.userService.updateUser(usuarioParaEnviar.id, usuarioParaEnviar).subscribe({
        next: () => {
          console.log('✅ Usuario actualizado correctamente');
          this.cargarUsuarios();
          this.mostrarFormulario = false;
        },
        error: (error) => {
          console.error('❌ Error al actualizar usuario:', error);
        }
      });
    } else {
      this.userService.createUser(usuarioParaEnviar).subscribe({
        next: () => {
          console.log('✅ Usuario agregado correctamente');
          this.cargarUsuarios();
          this.mostrarFormulario = false;
        },
        error: (error) => {
          console.error('❌ Error al agregar usuario:', error);
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

  eliminarUsuario(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          console.log('✅ Usuario eliminado correctamente.');
          this.usuarios = this.usuarios.filter(user => user.id !== id);
          this.filtrarUsuarios();
        },
        error: (err) => {
          console.error('❌ Error al eliminar usuario:', err);
          alert('Error al eliminar usuario. Por favor, inténtalo nuevamente.');
        }
      });
    }
  }
}
