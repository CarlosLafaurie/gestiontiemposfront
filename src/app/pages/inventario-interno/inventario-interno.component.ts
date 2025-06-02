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
    if (userData) {
      this.usuario = userData;
      this.rol = userData.rol || null;
      this.obraUsuario = userData.obra || null;
      this.cargarInventarioPadre();
    }
  }

  cargarInventarioPadre(): void {
    const callback = {
      next: (data: Inventario[]) => {
        this.inventarioPadre = data;
        this.cargarRegistros(); // ← después de tener padre
      },
      error: (err: unknown) => { console.error('[Inventario Padre] Error al obtener inventario:', err);
     }

    };

    if (this.rol === 'responsable' && this.usuario?.nombre) {
      this.inventarioService.obtenerPorResponsable(this.usuario.nombre).subscribe(callback);
    } else {
      this.inventarioService.obtenerInventario().subscribe(callback);
    }
  }

  cargarRegistros(): void {
    this.inventarioInternoService.obtenerTodos().subscribe({
      next: (data: InventarioInterno[]) => {
        // Filtrar registros cuyo inventarioId esté en inventarioPadre
        const idsPadre = this.inventarioPadre.map(p => p.id);
        this.registros = data.filter(r => idsPadre.includes(r.inventarioId));
        this.filtrarAsignaciones();
      },
      error: err => console.error('[Inventario Interno] Error al cargar:', err)
    });
  }

  filtrarAsignaciones(): void {
    const q = this.searchQuery.trim().toLowerCase();
    let filtrados = this.registros;

    if (this.rol === 'responsable' && this.obraUsuario) {
      filtrados = filtrados.filter(r => r.obra.toLowerCase() === this.obraUsuario!.toLowerCase());
    }

    this.registrosFiltrados = filtrados.filter(r =>
      r.obra.toLowerCase().includes(q) ||
      r.responsableObra.toLowerCase().includes(q) ||
      r.usando?.toLowerCase().includes(q) ||
      r.observaciones?.toLowerCase().includes(q) ||
      r.equipo?.nombre?.toLowerCase().includes(q) ||
      r.equipo?.marca?.toLowerCase().includes(q)
    );

    this.currentPage = 1;
  }

  mostrarFormularioRegistro(registro?: InventarioInterno): void {
    if (registro) {
      if (this.rol === 'responsable' && registro.obra !== this.obraUsuario) {
        alert('No tienes permiso para editar este registro.');
        return;
      }
      this.registroActual = { ...registro };
      this.esEdicion = true;
    } else {
      this.registroActual = this.nuevoRegistro();
      if (this.rol === 'responsable') {
        this.registroActual.obra = this.obraUsuario || '';
        this.registroActual.responsableObra = this.usuario?.nombre || '';
      }
      this.esEdicion = false;
    }

    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
  }

  guardarRegistro(): void {
    if (!this.registroActual.obra || !this.registroActual.responsableObra || !this.registroActual.equipo.nombre) {
      alert('Por favor, completa todos los campos requeridos.');
      return;
    }

    if (this.rol === 'responsable' && this.registroActual.obra !== this.obraUsuario) {
      alert('No puedes guardar un registro para una obra diferente.');
      return;
    }

    // Establecer relación con inventario padre (por obra)
    const padreRelacionado = this.inventarioPadre.find(p => p.ubicacion.toLowerCase() === this.registroActual.obra.toLowerCase());
    if (!padreRelacionado) {
      alert('No se encontró un inventario padre relacionado con la obra.');
      return;
    }

    this.registroActual.inventarioId = padreRelacionado.id;

    const obs = this.esEdicion
      ? this.inventarioInternoService.actualizarItem(this.registroActual)
      : this.inventarioInternoService.agregarItem(this.registroActual);

    obs.subscribe({
      next: () => {
        this.cargarRegistros();
        this.cerrarFormulario();
      },
      error: err => console.error('[guardarRegistro] Error:', err)
    });
  }

  eliminarRegistro(id: number): void {
    if (!confirm('¿Eliminar este registro?')) return;

    this.inventarioInternoService.eliminarItem(id).subscribe({
      next: () => this.cargarRegistros(),
      error: err => console.error('[eliminarRegistro] Error:', err)
    });
  }

  logout(): void {
    this.router.navigate(['/login']);
  }

  setPage(page: number): void {
    if (page < 1 || page > this.pages.length) return;
    this.currentPage = page;
  }

  get pages(): number[] {
    const total = Math.ceil(this.registrosFiltrados.length / this.pageSize);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  trackById(_: number, item: InventarioInterno): number {
    return item.id;
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
