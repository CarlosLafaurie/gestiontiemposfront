import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { Obra } from '../../services/obras.service';
import { ObraService } from '../../services/obras.service';

@Component({
  selector: 'app-inventarios',
  imports: [CommonModule, NavbarComponent, BotonRegresarComponent],
  standalone: true,
  templateUrl: './inventarios.component.html',
  styleUrl: './inventarios.component.css'
})
export class InventariosComponent {
 private authService = inject(AuthService);
  private router = inject(Router);

 obras: Obra[] = [];
  obrasFiltradas: Obra[] = [];

  constructor(private obraService: ObraService) {}

  ngOnInit(): void {
    this.obtenerObras();
  }

  irAInventarioPadre(): void {
    this.router.navigate(['/inventario']).then(success => {
    });
  }


    obtenerObras(): void {
    this.obraService.getObras().subscribe({
      next: (data) => {
        this.obras = data;
        this.obrasFiltradas = data; // todas las obras, sin filtros
      },
      error: (err) => {
        console.error('Error al obtener las obras:', err);
      }
    });
  }

  irAInventarioInterno(nombreObra: string): void {
    const nombreSanitizado = encodeURIComponent(nombreObra);
    this.router.navigate(['/inventario-interno', nombreSanitizado]);
  }
}
