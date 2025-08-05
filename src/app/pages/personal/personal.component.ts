import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

@Component({
  selector: 'app-personal',
  standalone: true,
  imports: [CommonModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './personal.component.html',
  styleUrl: './personal.component.css'
})
export class PersonalComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    if (!userData || userData.rol.toLowerCase() !== 'admin') {
      this.router.navigate(['/home']);
    }
  }

  irAUsuariosAdmin(): void {
    this.router.navigate(['/usuario-admin']).then(success => {
    });
  }

  irAEmpleadosAdmin(): void {
    this.router.navigate(['/empleado-admin']).then(success => {
    });
  }

  irAPermisosAdmin(): void {
    this.router.navigate(['/permisos-admin']).then(success => {
    });
  }
}
