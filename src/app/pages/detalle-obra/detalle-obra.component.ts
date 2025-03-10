import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ObraService, Obra } from '../../services/obras.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../navbar/navbar.component';

@Component({
  selector: 'app-detalle-obra',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './detalle-obra.component.html',
  styleUrls: ['./detalle-obra.component.css']
})
export class DetalleObraComponent {
  obra: Obra | null = null;
  cargo: string | null = null;
  usuario: string | null = null;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private obraService = inject(ObraService);
  private authService = inject(AuthService);

  constructor() {
    const userData = this.authService.getUserData();
    if (userData) {
      this.cargo = userData.cargo || null;
      this.usuario = userData.nombreCompleto || null;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!isNaN(id)) {
      this.obraService.getObra(id).subscribe((data) => this.obra = data);
    }
  }

  volver() {
    this.router.navigate(['/home']);
  }

  irAGestionPersonal() {
  if (this.obra && this.obra.nombreObra) {
    const nombreObraUrl = this.obra.nombreObra.replace(/\s+/g, '-');
    this.router.navigate(['/gestionIngresos', nombreObraUrl]);
  }
}

  
}
