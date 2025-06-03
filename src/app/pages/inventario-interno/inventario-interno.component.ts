import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventarioService, Inventario } from '../../services/inventario.service';
import { InventarioInternoService, InventarioInterno } from '../../services/inventario-interno.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-inventario-interno',
  templateUrl: './inventario-interno.component.html',
  styleUrls: ['./inventario-interno.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent]
})
export class InventarioInternoComponent implements OnInit {
  registros: InventarioInterno[] = [];
  registrosFiltrados: InventarioInterno[] = [];
  inventarioPadre: Inventario[] = [];

  registroActual: InventarioInterno = this.nuevoRegistro();

  searchQuery: string = '';
  mostrarFormulario: boolean = false;
  esEdicion: boolean = false;

  pageSize: number = 10;
  currentPage: number = 1;

  usuario: any = null;
  rol: string | null = null;
  obraUsuario: string | null = null;

  private inventarioService = inject(InventarioService);
  private inventarioInternoService = inject(InventarioInternoService);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    if (!userData) return;

    // Guardamos todos los datos del usuario decodificado del token
    this.usuario = userData;

    // Extraemos el rol, obra y nombre del responsable
    this.rol =
      userData.rol ||
      userData['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      null;

    this.obraUsuario = userData.obra || null;

    const nombreResponsable =
      userData['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '';

    this.cargarInventarioPadre(nombreResponsable);
  }

  private cargarInventarioPadre(nombreResponsable: string): void {
    console.log(
      '[Inventario Padre] Solicitando inventario filtrado por responsable:',
      nombreResponsable
    );

    this.inventarioService.obtenerPorResponsable(nombreResponsable).subscribe({
      next: (data: Inventario[]) => {
        console.log('[Inventario Padre] Datos obtenidos (filtrados):', data);
        this.inventarioPadre = data;
        this.currentPage = 1;
      },
      error: (err: unknown) => {
        console.error('[Inventario Padre] Error al obtener inventario filtrado:', err);
      }
    });
  }

  get inventarioPaginado(): Inventario[] {
    const q = this.searchQuery.trim().toLowerCase();
    const filtrados = this.inventarioPadre.filter(item =>
      item.codigo.toLowerCase().includes(q) ||
      item.herramienta.toLowerCase().includes(q) ||
      (item.numeroSerie || '').toLowerCase().includes(q) ||
      item.ubicacion.toLowerCase().includes(q) ||
      item.responsable.toLowerCase().includes(q)
    );
    const start = (this.currentPage - 1) * this.pageSize;
    return filtrados.slice(start, start + this.pageSize);
  }

  setPage(page: number): void {
    if (page < 1 || page > this.pages.length) return;
    this.currentPage = page;
  }

  get pages(): number[] {
    const q = this.searchQuery.trim().toLowerCase();
    const totalItems = this.inventarioPadre.filter(item =>
      item.codigo.toLowerCase().includes(q) ||
      item.herramienta.toLowerCase().includes(q) ||
      (item.numeroSerie || '').toLowerCase().includes(q) ||
      item.ubicacion.toLowerCase().includes(q) ||
      item.responsable.toLowerCase().includes(q)
    ).length;
    const totalPages = Math.ceil(totalItems / this.pageSize);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  trackById(_: number, item: Inventario): number {
    return item.id;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private nuevoRegistro(): InventarioInterno {
    return {
      id: 0,
      inventarioId: 0,
      obra: '',
      responsableObra: '',
      usando: '',
      cantidadAsignada: 1,
      observaciones: '',
      equipo: {
        nombre: '',
        numeroSerie: '',
        marca: '',
        cantidad: 0,
        unidades: ''
      }
    };
  }
}
