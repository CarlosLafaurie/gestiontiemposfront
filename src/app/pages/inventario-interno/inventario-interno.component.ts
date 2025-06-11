import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventarioService, Inventario } from '../../services/inventario.service';
import { InventarioInternoService, InventarioInterno } from '../../services/inventario-interno.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { AuthService } from '../../services/auth.service';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { Empleado, EmpleadoService } from '../../services/empleado-service.service';

interface FilaMezclada {
  tipo: 'padre' | 'hijo';
  id: number;
  internoId?: number;
  codigo?: string;
  herramienta?: string;
  numeroSerie?: string;
  cantidad?: number;
  ubicacion?: string;
  responsable?: string;
  usando?: string;
  cantidadAsignada?: number;
  observaciones?: string;
}

@Component({
  selector: 'app-inventario-interno',
  templateUrl: './inventario-interno.component.html',
  styleUrls: ['./inventario-interno.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BotonRegresarComponent]
})
export class InventarioInternoComponent implements OnInit {
  registros: InventarioInterno[] = [];
  inventarioPadre: Inventario[]    = [];

  get filasMezcladas(): FilaMezclada[] {
    const filas: FilaMezclada[] = [];

    this.inventarioPaginado.forEach(padre => {
      const hijos = this.registros.filter(hijo => hijo.inventarioId === padre.id);

      if (hijos.length > 0) {
        hijos.forEach(hijo => {
          filas.push({
            tipo: 'padre',
            id: padre.id,
            internoId: hijo.id,
            codigo: padre.codigo,
            herramienta: padre.herramienta,
            numeroSerie: padre.numeroSerie,
            cantidad: padre.cantidad,
            ubicacion: padre.ubicacion,
            responsable: padre.responsable,
            usando: hijo.usando,
            cantidadAsignada: hijo.cantidadAsignada,
            observaciones: hijo.observaciones
          });
        });
      } else {
        filas.push({
          tipo: 'padre',
          id: padre.id,
          codigo: padre.codigo,
          herramienta: padre.herramienta,
          numeroSerie: padre.numeroSerie,
          cantidad: padre.cantidad,
          ubicacion: padre.ubicacion,
          responsable: padre.responsable,
          usando: '',
          cantidadAsignada: 0,
          observaciones: ''
        });
      }
    });
    return filas;
  }

  registroActual: InventarioInterno = this.nuevoRegistro();
  herramientaNombre = '';
  numeroSerie       = '';
  cantidad          = 0;
  nombreResponsable  = '';
  searchQuery       = '';
  mostrarFormulario = false;
  esEdicion         = false;

  pageSize    = 10;
  currentPage = 1;

  usuario: any      = null;
  rol: string | null = null;
  obraUsuario: string | null = null;

  empleados: Empleado[] = [];
  usandoInput  = '';
  usandoFiltrado: Empleado[] = [];

  private inventarioService       = inject(InventarioService);
  private inventarioInternoService = inject(InventarioInternoService);
  private router                   = inject(Router);
  private authService              = inject(AuthService);
  private empleadoService          = inject(EmpleadoService);

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    if (!userData) return;

    this.usuario = userData;
    this.rol =
      userData.rol ||
      userData['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      null;
    this.obraUsuario = userData.obra || null;
    this.nombreResponsable =
      userData['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
      userData.name ||
      userData['name'] ||
      '';

    this.cargarEmpleados();
    this.cargarRegistrosInternos(() => {
      this.cargarInventarioPadre(this.nombreResponsable);
    });
  }

  private cargarInventarioPadre(nombreResponsable: string): void {
    this.inventarioService.obtenerPorResponsable(nombreResponsable).subscribe({
      next: (data: Inventario[]) => {
        this.inventarioPadre = data;
        this.currentPage = 1;
      },
      error: err => console.error('Error al obtener inventario padre:', err)
    });
  }

  private cargarRegistrosInternos(callback?: () => void): void {
    if (!this.obraUsuario) return;
    this.inventarioInternoService.obtenerPorObra(this.obraUsuario).subscribe({
      next: (data: InventarioInterno[]) => {
        this.registros = data;
        if (callback) callback();
      },
      error: err => console.error('Error al obtener inventario interno:', err)
    });
  }

  cargarEmpleados() {
    this.empleadoService.obtenerEmpleados(1, 1000).subscribe({
      next: data => {
        this.empleados       = data;
        this.usandoFiltrado  = data;
      },
      error: err => console.error('Error al cargar empleados:', err)
    });
  }

  filtrarUsando() {
    const query = this.usandoInput.toLowerCase();
    this.usandoFiltrado = this.empleados.filter(e =>
      e.nombreCompleto.toLowerCase().includes(query)
    );
  }

  mostrarFormularioAsignacion(item: FilaMezclada): void {
    if (item.tipo !== 'padre') return;

    // Si ya existe internoId, populamos para editar; si no, inicializamos nuevo
    this.registroActual = {
      ...this.nuevoRegistro(),
      id:              item.internoId || 0,
      inventarioId:    item.id,
      obra:            this.obraUsuario || '',
      responsableObra: this.nombreResponsable,
      usando:          item.usando || '',
      cantidadAsignada:item.cantidadAsignada || 1,
      observaciones:   item.observaciones || ''
    };

    this.herramientaNombre = item.herramienta || '';
    this.numeroSerie       = item.numeroSerie || '';
    this.cantidad          = item.cantidad || 0;
    this.esEdicion         = !!item.internoId;
    this.mostrarFormulario = true;
  }

  guardarAsignacion(): void {
    if (
      !this.registroActual.inventarioId ||
      this.registroActual.cantidadAsignada <= 0 ||
      !this.registroActual.usando
    ) {
      console.warn('Faltan datos requeridos para guardar.');
      return;
    }

    if (this.esEdicion && this.registroActual.id) {
      // Actualizar asignación existente
      this.inventarioInternoService.actualizarItem(this.registroActual).subscribe({
        next: () => {
          this.cargarRegistrosInternos(() =>
            this.cargarInventarioPadre(this.nombreResponsable)
          );
          this.cerrarModal();
        },
        error: err => console.error('Error al actualizar asignación:', err)
      });
    } else {
      // Crear nueva asignación
      this.inventarioInternoService.agregarItem(this.registroActual).subscribe({
        next: () => {
          this.cargarRegistrosInternos(() =>
            this.cargarInventarioPadre(this.nombreResponsable)
          );
          this.cerrarModal();
        },
        error: err => console.error('Error al guardar la asignación:', err)
      });
    }
  }

  editarAsignacion(fila: FilaMezclada): void {
    if (!fila.internoId) return;
    const asign = this.registros.find(r => r.id === fila.internoId);
    if (!asign) return;

    this.registroActual = { ...asign };
    this.herramientaNombre = fila.herramienta || '';
    this.numeroSerie       = fila.numeroSerie || '';
    this.cantidad          = fila.cantidad || 0;
    this.esEdicion         = true;
    this.mostrarFormulario = true;
  }

  limpiarAsignacion(internoId: number): void {
    if (!confirm('¿Seguro que deseas eliminar esta asignación?')) return;
    this.inventarioInternoService.eliminarItem(internoId).subscribe({
      next: () => {
        this.cargarRegistrosInternos(() =>
          this.cargarInventarioPadre(this.nombreResponsable)
        );
      },
      error: err => console.error('Error al limpiar asignación:', err)
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

  trackById(index: number, item: FilaMezclada): string {
    return `${item.tipo}-${item.id}`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private nuevoRegistro(): InventarioInterno {
    return {
      id:              0,
      inventarioId:    0,
      obra:            '',
      responsableObra: '',
      usando:          '',
      cantidadAsignada: 1,
      observaciones:   ''
    };
  }

 cerrarModal() {
  this.mostrarFormulario = false;
  this.esEdicion = false;
  this.registroActual = this.nuevoRegistro();
}

}
