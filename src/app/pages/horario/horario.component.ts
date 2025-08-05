import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

@Component({
  selector: 'app-horario',
  imports: [CommonModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './horario.component.html',
  styleUrls: ['./horario.component.css']
})
export class HorarioComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    if (!userData || userData.rol.toLowerCase() !== 'admin') {
      this.router.navigate(['/home']);
    }
  }

  irAIngresos(): void {
    this.router.navigate(['/gestionIngresos/:nombreObra']).then(success => {
    });
  }

  irATiemposAdmin(): void {
    this.router.navigate(['/tiempos-admin']).then(success => {
    });
  }
}
