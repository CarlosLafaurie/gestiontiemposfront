import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

@Component({
  selector: 'app-proyectos',
imports: [CommonModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './productividad.component.html',
  styleUrl: './productividad.component.css'
})
export class ProductividadComponent {
 private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    if (!userData || userData.rol.toLowerCase() !== 'admin') {
      this.router.navigate(['/home']);
    }
  }

  irAMetricas(): void {
    this.router.navigate(['/metricas']).then(success => {
    });
  }

   irARendimiento(): void {
    this.router.navigate(['/rendimiento/:nombreObra']).then(success => {
    });
  }

   irAVerRendimiento(): void {
    this.router.navigate(['/ver-rendimientos']).then(success => {
    });
  }

   irAContratista(): void {
    this.router.navigate(['/contratista']).then(success => {
    });
  }

}
