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
  codigo?: string;
  herramienta?: string;
  numeroSerie?: string;
  cantidad?: number;
  ubicacion?: string;
  responsable?: string;
  usando?: string;
  cantidadAsignada?: number;   // falta
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
  registrosFiltrados: InventarioInterno[] = [];
  inventarioPadre: Inventario[] = [];

  // --- Agregado: calculamos filas mezcladas padre + hijo ---
  get filasMezcladas(): FilaMezclada[] {
    const filas: FilaMezclada[] = [];
    this.inventarioPadre.forEach(padre => {
      // Agregar fila padre
      filas.push({
        tipo: 'padre',
        id: padre.id,
        codigo: padre.codigo,
        herramienta: padre.herramienta,
        numeroSerie: padre.numeroSerie,
        cantidad: padre.cantidad,
        ubicacion: padre.ubicacion,
        responsable: padre.responsable
      });

      // Buscar hijos de este padre
      const hijos = this.registros.filter(hijo => hijo.inventarioId === padre.id);

      // Agregar filas hijo con indentación lógica
      hijos.forEach(hijo => {
        filas.push({
          tipo: 'hijo',
          id: hijo.id,
          usando: hijo.usando,
          cantidadAsignada: hijo.cantidadAsignada,
          observaciones: hijo.observaciones
        });
      });
    });
    return filas;
  }
  // -----------------------------------------------------------

  registroActual: InventarioInterno = this.nuevoRegistro();

  herramientaNombre: string = '';
  numeroSerie: string = '';
  marca: string = '';
  cantidad: number = 0;
  unidades: string = '';

  searchQuery: string = '';
  mostrarFormulario: boolean = false;
  esEdicion: boolean = false;

  pageSize: number = 10;
  currentPage: number = 1;

  usuario: any = null;
  rol: string | null = null;
  obraUsuario: string | null = null;

  empleados: Empleado[] = [];
  usandoInput: string = '';
  usandoFiltrado: Empleado[] = [];

  private inventarioService = inject(InventarioService);
  private inventarioInternoService = inject(InventarioInternoService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private empleadoService = inject(EmpleadoService);

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    if (!userData) return;

    this.usuario = userData;
    this.rol =
      userData.rol ||
      userData['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      null;

    this.obraUsuario = userData.obra || null;

    const nombreResponsable =
      userData['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '';

    this.cargarInventarioPadre(nombreResponsable);
    this.cargarRegistrosInternos();

    this.cargarEmpleados();
  }

  private cargarInventarioPadre(nombreResponsable: string): void {
    this.inventarioService.obtenerPorResponsable(nombreResponsable).subscribe({
      next: (data: Inventario[]) => {
        this.inventarioPadre = data;
        this.currentPage = 1; // Reiniciar página al cargar datos
      },
      error: (err: unknown) => {
        console.error('Error al obtener inventario padre:', err);
      }
    });
  }

  private cargarRegistrosInternos(): void {
    if (!this.obraUsuario) return;
    this.inventarioInternoService.obtenerPorObra(this.obraUsuario).subscribe({
      next: (data: InventarioInterno[]) => {
        this.registros = data;
        this.registrosFiltrados = [...data];
      },
      error: (err: unknown) => {
        console.error('Error al obtener inventario interno:', err);
      }
    });
  }

  cargarEmpleados() {
    this.empleadoService.obtenerEmpleados(1, 1000).subscribe({
      next: (data: Empleado[]) => {
        this.empleados = data;
        this.usandoFiltrado = data;
      },
      error: (err) => console.error('Error al cargar empleados:', err)
    });
  }

  filtrarUsando() {
    const query = this.usandoInput.toLowerCase();
    this.usandoFiltrado = this.empleados.filter(e =>
      e.nombreCompleto.toLowerCase().includes(query)
    );
  }

  seleccionarUsando(empleado: Empleado) {
    this.usandoInput = empleado.nombreCompleto;
    this.registroActual.usando = empleado.nombreCompleto;
    this.usandoFiltrado = [];
  }

  mostrarFormularioAsignacion(item: FilaMezclada): void {
    if (item.tipo !== 'padre') {
      return;
    }

    this.registroActual = {
      ...this.nuevoRegistro(),
      inventarioId: item.id,
      obra: this.obraUsuario || '',
      responsableObra: this.usuario?.nombre || '',
      usando: '',
      cantidadAsignada: 1,
      observaciones: ''
    };

    this.usandoInput = '';

    this.herramientaNombre = item.herramienta || '';
    this.numeroSerie = item.numeroSerie || '';
    this.cantidad = item.cantidad || 0;

    this.mostrarFormulario = true;
    this.esEdicion = false;
  }


  guardarAsignacion(): void {
    if (!this.registroActual) return;

    if (this.registroActual.cantidadAsignada > this.cantidad) {
      alert('La cantidad asignada no puede ser mayor a la cantidad disponible.');
      return;
    }

    this.inventarioInternoService.agregarItem(this.registroActual).subscribe({
      next: () => {
        this.cargarRegistrosInternos();
        this.mostrarFormulario = false;
      },
      error: (err: unknown) => {
        console.error('Error al guardar asignación:', err);
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

  trackById(index: number, item: FilaMezclada): number {
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
      observaciones: ''
    };
  }
}
