// panel-de-control.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

@Component({
  selector: 'app-panel-de-control',
  standalone: true,
  imports: [CommonModule, NavbarComponent, BotonRegresarComponent],
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

}
