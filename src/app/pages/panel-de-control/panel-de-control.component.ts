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

  irAPersonal(): void {
    this.router.navigate(['/personal']).then(success => {
    });
  }

  irAProyectos(): void {
    this.router.navigate(['/proyectos']).then(success => {
    });
  }

  irAHorarios(): void {
    this.router.navigate(['/horario']).then(success => {
    });
  }

  irAProductividad(): void {
    this.router.navigate(['/productividad']).then(success => {
    });
  }

}
