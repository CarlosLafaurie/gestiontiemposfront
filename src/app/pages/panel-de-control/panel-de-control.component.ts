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
    // Verifica que el usuario tenga el cargo "admin" (ignorando mayúsculas)
    if (!userData || userData.cargo.toLowerCase() !== 'admin') {
      // Si no es administrador, redirige a la página principal
      this.router.navigate(['/home']);
    }
  }

  

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  irAUsuariosAdmin(): void {
    this.router.navigate(['/usuario-admin']);
  }
}
