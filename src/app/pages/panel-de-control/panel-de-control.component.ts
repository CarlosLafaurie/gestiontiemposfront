// panel-de-control.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../navbar/navbar.component';

@Component({
  selector: 'app-panel-de-control',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './panel-de-control.component.html',
  styleUrls: ['./panel-de-control.component.css']
})
export class PanelDeControlComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    if (!userData || userData.rol.toLowerCase() !== 'admin') {
      this.router.navigate(['/home']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  irAUsuariosAdmin(): void {
    this.router.navigate(['/usuario-admin']).then(success => {
    });
  }

  irAEmpleadosAdmin(): void {
    this.router.navigate(['/empleado-admin']).then(success => {
    });
  }

  irAObrasAdmin(): void {
    this.router.navigate(['/obras-admin']).then(success => {
    });
  }

  irATiemposAdmin(): void {
    this.router.navigate(['/tiempos-admin']).then(success => {
    });
  }

  irAPermisosAdmin(): void {
    this.router.navigate(['/permisos-admin']).then(success => {
    });
  }

  irAMovimientos(): void {
    this.router.navigate(['/movimientos']).then(success => {
    });
  }

  irAInventarios(): void {
    this.router.navigate(['/inventarios']).then(success => {
    });
  }

  irAIngresos(): void {
    this.router.navigate(['/gestionIngresos/:nombreObra']).then(success => {
    });
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
