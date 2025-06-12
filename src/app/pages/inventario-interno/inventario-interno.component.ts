import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './inventario-interno.component.html',
  styleUrls: ['./inventario-interno.component.css']
})
export class InventarioInternoComponent implements OnInit {
  /** Datos */
  registros: InventarioInterno[] = [];
  inventarioPadre: Inventario[] = [];

  /** Para el formulario */
  nombreResponsable = '';
  obraUsuario: string | null = null;
  registroActual: InventarioInterno = this.nuevoRegistro();
  herramientaNombre = '';
  numeroSerie = '';
  cantidad = 0;
  esEdicion = false;
  mostrarFormulario = false;

  /** Búsqueda y paginación */
  searchQuery = '';
  pageSize = 10;
  currentPage = 1;

  /** Empleados para autocomplete */
  empleados: Empleado[] = [];
  usandoInput = '';
  usandoFiltrado: Empleado[] = [];

  /** Servicios */
  private inventarioService = inject(InventarioService);
  private inventarioInternoService = inject(InventarioInternoService);
  private authService = inject(AuthService);
  private empleadoService = inject(EmpleadoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    // 1) Obtén nombreResponsable del token (solo para mostrar en el modal)
    const user = this.authService.getUserData();
    if (user) {
      this.nombreResponsable =
        user['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
        user.name ||
        '';
    }

    // 2) Lee nombreObra de la ruta y carga datos
    this.route.paramMap.subscribe(params => {
      const obraParam = params.get('nombreObra');
      if (obraParam) {
        this.obraUsuario = decodeURIComponent(obraParam);
      }

      this.cargarEmpleados();
      this.cargarRegistrosInternos();
      if (this.obraUsuario) {
        this.cargarInventarioPadre(this.obraUsuario);
      }
    });
  }

  /** Obtiene los registros internos filtrados por obra */
  private cargarRegistrosInternos(): void {
    if (!this.obraUsuario) return;
    this.inventarioInternoService.obtenerPorObra(this.obraUsuario).subscribe({
      next: data => this.registros = data,
      error: err => console.error('Error internos ▶', err)
    });
  }

  /** Obtiene el inventario padre filtrado por obra */
  private cargarInventarioPadre(nombreObra: string): void {
    this.inventarioService.obtenerPorObra(nombreObra).subscribe({
      next: data => {
        this.inventarioPadre = data;
        this.currentPage = 1;
      },
      error: err => console.error('Error padre ▶', err)
    });
  }

  /** Carga lista de empleados para autocomplete */
  private cargarEmpleados(): void {
    this.empleadoService.obtenerEmpleados(1, 1000).subscribe({
      next: data => {
        this.empleados = data;
        this.usandoFiltrado = data;
      },
      error: err => console.error('Error empleados ▶', err)
    });
  }

  filtrarUsando(): void {
    const q = this.usandoInput.toLowerCase();
    this.usandoFiltrado = this.empleados.filter(e =>
      e.nombreCompleto.toLowerCase().includes(q)
    );
  }

  /** Muestra modal de asignación o edición */
  mostrarFormularioAsignacion(fila: FilaMezclada): void {
    this.esEdicion = !!fila.internoId;
    this.registroActual = {
      ...this.nuevoRegistro(),
      id: fila.internoId || 0,
      inventarioId: fila.id,
      obra: this.obraUsuario!,
      responsableObra: this.nombreResponsable,
      usando: fila.usando || '',
      cantidadAsignada: fila.cantidadAsignada || 1,
      observaciones: fila.observaciones || ''
    };
    this.herramientaNombre = fila.herramienta!;
    this.numeroSerie = fila.numeroSerie!;
    this.cantidad = fila.cantidad!;
    this.mostrarFormulario = true;
  }

  /** Guarda o actualiza la asignación */
  guardarAsignacion(): void {
    if (!this.registroActual.inventarioId || !this.registroActual.usando) return;

    const action$ = this.esEdicion
      ? this.inventarioInternoService.actualizarItem(this.registroActual)
      : this.inventarioInternoService.agregarItem(this.registroActual);

    action$.subscribe({
      next: () => {
        this.cargarRegistrosInternos();
        if (this.obraUsuario) this.cargarInventarioPadre(this.obraUsuario);
        this.cerrarModal();
      },
      error: err => console.error('Error guardar ▶', err)
    });
  }

  /** Edita una asignación existente */
  editarAsignacion(fila: FilaMezclada): void {
    if (fila.internoId) this.mostrarFormularioAsignacion(fila);
  }

  /** Elimina una asignación */
  limpiarAsignacion(id: number): void {
    if (!confirm('¿Eliminar asignación?')) return;
    this.inventarioInternoService.eliminarItem(id).subscribe({
      next: () => {
        this.cargarRegistrosInternos();
        if (this.obraUsuario) this.cargarInventarioPadre(this.obraUsuario);
      },
      error: err => console.error('Error limpiar ▶', err)
    });
  }

  /** Fusiona padre + hijos para el template */
  get filasMezcladas(): FilaMezclada[] {
    const filas: FilaMezclada[] = [];
    this.inventarioPaginado.forEach(padre => {
      const hijos = this.registros.filter(h => h.inventarioId === padre.id);
      if (hijos.length) {
        hijos.forEach(hijo => filas.push(this.crearFila(padre, hijo)));
      } else {
        filas.push(this.crearFila(padre, null));
      }
    });
    return filas;
  }

  private crearFila(p: Inventario, h: InventarioInterno | null): FilaMezclada {
    return {
      tipo: 'padre',
      id: p.id,
      internoId: h?.id,
      codigo: p.codigo,
      herramienta: p.herramienta,
      numeroSerie: p.numeroSerie,
      cantidad: p.cantidad,
      ubicacion: p.ubicacion,
      responsable: p.responsable,
      usando: h?.usando || '',
      cantidadAsignada: h?.cantidadAsignada,
      observaciones: h?.observaciones || ''
    };
  }

  /** Paginación local y búsqueda */
  get inventarioPaginado(): Inventario[] {
    const q = this.searchQuery.trim().toLowerCase();
    const lista = this.inventarioPadre.filter(i =>
      i.codigo.toLowerCase().includes(q) ||
      i.herramienta.toLowerCase().includes(q) ||
      (i.numeroSerie || '').toLowerCase().includes(q) ||
      i.ubicacion.toLowerCase().includes(q)
    );
    const start = (this.currentPage - 1) * this.pageSize;
    return lista.slice(start, start + this.pageSize);
  }

  setPage(p: number): void {
    this.currentPage = p;
  }

  get pages(): number[] {
    return Array.from(
      { length: Math.ceil(this.inventarioPadre.length / this.pageSize) },
      (_, i) => i + 1
    );
  }

  trackById(_: number, f: FilaMezclada): any {
    return f.internoId ?? f.id;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private nuevoRegistro(): InventarioInterno {
    return { id: 0, inventarioId: 0, obra: '', responsableObra: '', usando: '', cantidadAsignada: 1, observaciones: '' };
  }

  cerrarModal(): void {
    this.mostrarFormulario = false;
    this.esEdicion = false;
    this.registroActual = this.nuevoRegistro();
  }
}
