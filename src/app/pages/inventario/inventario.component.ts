import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../navbar/navbar.component';
import { InventarioService, Inventario } from '../../services/inventario.service';
import { AuthService } from '../../services/auth.service';
import { ObraService, Obra } from '../../services/obras.service';
import { UserService, User } from '../../services/user.service';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, NavbarComponent, BotonRegresarComponent]
})
export class InventarioComponent implements OnInit {
  materiales: Inventario[] = [];
  materialesFiltrados: Inventario[] = [];
  searchQuery: string = '';

  mostrarFormulario: boolean = false;
  esEdicion: boolean = false;

  materialActual: Inventario = this.crearNuevoItem();

  usuarios: User[] = [];
  obras: Obra[] = [];
  responsables: User[] = [];

  // *** PAGINACIÓN ***
  pageSize = 30;
  currentPage = 1;

  private inventarioService = inject(InventarioService);
  private authService       = inject(AuthService);
  private obraService       = inject(ObraService);
  private userService       = inject(UserService);
  private route             = inject(ActivatedRoute);
  private router            = inject(Router);

  ngOnInit(): void {
    console.log('[InventarioComponent] ngOnInit');
    this.obtenerInventario();
    this.cargarObras();
    this.cargarUsuarios();
  }

  obtenerInventario(): void {
    console.log('[InventarioComponent] obtenerInventario: solicitando lista...');
    this.inventarioService.obtenerInventario().subscribe({
      next: data => {
        console.log('[InventarioComponent] recibí', data);
        this.materiales = data;
        this.filtrarMateriales();
      },
      error: err => console.error(err)
    });
  }

  cargarObras(): void {
    this.obraService.getObras().subscribe({
      next: data => this.obras = data,
      error: err => console.error(err)
    });
  }

  cargarUsuarios(): void {
    this.userService.getAllUsers().subscribe({
      next: data => this.responsables = data.filter(u => u.rol === 'responsable'),
      error: err => console.error(err)
    });
  }

  filtrarMateriales(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.materialesFiltrados = this.materiales.filter(item =>
      item.codigo.toLowerCase().includes(q) ||
      item.herramienta.toLowerCase().includes(q) ||
      item.marca.toLowerCase().includes(q) ||
      (item.numeroSerie || '').toLowerCase().includes(q) ||
      item.responsable.toLowerCase().includes(q) ||
      item.ubicacion.toLowerCase().includes(q) ||
      item.estado.toLowerCase().includes(q)
    );

    // Ordenar por código ascendente (numérico o alfanumérico)
    this.materialesFiltrados.sort((a, b) => {
      const na = Number(a.codigo);
      const nb = Number(b.codigo);
      if (!isNaN(na) && !isNaN(nb)) {
        return na - nb;
      }
      return a.codigo.localeCompare(b.codigo, undefined, { numeric: true });
    });

    // Al filtrar, volvemos a la página 1
    this.currentPage = 1;
  }

  // getter para el array de páginas
  get pages(): number[] {
    const total = Math.ceil(this.materialesFiltrados.length / this.pageSize);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  // cambia de página, con límites
  setPage(page: number): void {
    if (page < 1 || page > this.pages.length) return;
    this.currentPage = page;
  }

  // trackBy para optimizar renderizado
  trackById(_: number, item: Inventario): number {
    return item.id;
  }

  mostrarFormularioMaterial(material?: Inventario): void {
    if (material) {
      this.materialActual = { ...material };
      this.esEdicion = true;
    } else {
      this.materialActual = this.crearNuevoItem();
      this.esEdicion = false;
    }
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    console.log('[InventarioComponent] cerrarFormulario');
    this.mostrarFormulario = false;
  }

  guardarMaterial(): void {
    console.log('[InventarioComponent] guardarMaterial:', this.materialActual);
    const obs = this.esEdicion
      ? this.inventarioService.actualizarItem(this.materialActual)
      : this.inventarioService.agregarItem(this.materialActual);

    obs.subscribe({
      next: () => {
        this.obtenerInventario();
        this.cerrarFormulario();
      },
      error: err => console.error(err)
    });
  }

  eliminarMaterial(id: number): void {
    if (!confirm('¿Eliminar material?')) return;
    this.inventarioService.eliminarItem(id).subscribe({
      next: () => this.obtenerInventario(),
      error: err => console.error(err)
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private crearNuevoItem(): Inventario {
    return {
      id: 0,
      codigo: '',
      herramienta: '',
      numeroSerie: '',
      marca: '',
      fechaUltimoMantenimiento: null,
      fechaProximoMantenimiento: null,
      empresaMantenimiento: '',
      fechaCompra: null,
      proveedor: '',
      garantia: 0,
      observaciones: '',
      ubicacion: '',
      responsable: '',
      estado: 'Activo',
      cantidad: 1
    };
  }

  irAInventarioInterno(nombreObra: string): void {
    console.log('Obra original:', nombreObra);
    const nombreSanitizado = encodeURIComponent(nombreObra);
    console.log('Obra sanitizada para URL:', nombreSanitizado);

    this.router.navigate(['/inventario-interno', nombreSanitizado]).then(success => {
      console.log('Navegación exitosa:', success);
    });
  }
}
