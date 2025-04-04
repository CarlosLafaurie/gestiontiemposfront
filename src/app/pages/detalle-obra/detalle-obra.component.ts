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
    console.log('🟢 Inicializando DetalleObraComponent');

    const userData = this.authService.getUserData();
    console.log('👤 Datos del usuario autenticado:', userData);

    if (userData) {
      this.cargo = userData.cargo || null;
      this.usuario = userData.nombreCompleto || null;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    console.log(`📌 ID de obra obtenida de la URL: ${id}`);

    if (!isNaN(id)) {
      this.obraService.getObra(id).subscribe({
        next: (data) => {
          console.log('✅ Obra recibida en DetalleObraComponent:', data);
          this.obra = data;
        },
        error: (err) => {
          console.error('❌ Error al obtener la obra:', err);
        }
      });
    } else {
      console.error('❌ ID de obra inválido:', this.route.snapshot.paramMap.get('id'));
    }
  }

  volver() {
    console.log('🔙 Volviendo a la pantalla principal');
    this.router.navigate(['/home']);
  }

  irAGestionPersonal() {
    if (this.obra && this.obra.nombreObra) {
      const nombreObraUrl = this.obra.nombreObra.replace(/\s+/g, '-');
      console.log(`🔄 Redirigiendo a gestión de ingresos de: ${nombreObraUrl}`);
      this.router.navigate(['/gestionIngresos', nombreObraUrl]);
    } else {
      console.warn('⚠️ No se puede redirigir porque no hay obra cargada.');
    }
  }
}
