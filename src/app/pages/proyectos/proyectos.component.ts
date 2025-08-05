import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

@Component({
  selector: 'app-proyectos',
imports: [CommonModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './proyectos.component.html',
  styleUrl: './proyectos.component.css'
})
export class ProyectosComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    if (!userData || userData.rol.toLowerCase() !== 'admin') {
      this.router.navigate(['/home']);
    }
  }

  irAObrasAdmin(): void {
    this.router.navigate(['/obras-admin']).then(success => {
    });
  }

  irAInventarios(): void {
    this.router.navigate(['/inventarios']).then(success => {
    });
  }
}
