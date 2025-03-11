import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios-admin.component.html',
  styleUrls: ['./usuarios-admin.component.css']
})
export class UsuariosAdminComponent implements OnInit {
  // Variable para almacenar la lista de usuarios
  usuarios: any[] = [];

  constructor() { }

  ngOnInit(): void {
    // Aquí puedes inicializar la carga de usuarios, por ejemplo, llamando a un servicio
    // this.cargarUsuarios();
  }

  // Ejemplo de método para editar un usuario
  editarUsuario(usuario: any): void {
    console.log('Editar usuario:', usuario);
    // Aquí iría la lógica para editar el usuario
  }

  // Ejemplo de método para eliminar un usuario
  eliminarUsuario(id: number): void {
    console.log('Eliminar usuario con ID:', id);
    // Aquí iría la lógica para eliminar el usuario
  }
  
  // (Opcional) Método para cargar usuarios
  cargarUsuarios(): void {
    // Llama a un servicio para obtener la lista de usuarios y asignarla a la variable "usuarios"
  }
}
