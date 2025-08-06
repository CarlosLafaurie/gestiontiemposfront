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
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ChangeDetectorRef } from '@angular/core';


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
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | '' = '';

  materialActual: Inventario = this.crearNuevoItem();

  usuarios: User[] = [];
  obras: Obra[] = [];
  responsables: User[] = [];

  pageSize = 30;
  currentPage = 1;

  private inventarioService = inject(InventarioService);
  private authService       = inject(AuthService);
  private obraService       = inject(ObraService);
  private userService       = inject(UserService);
  private route             = inject(ActivatedRoute);
  private router            = inject(Router);
  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.log('[InventarioComponent] ngOnInit');
    this.obtenerInventario();
    this.cargarObras();
    this.cargarUsuarios();
    window.addEventListener('resize', () => this.cd.detectChanges());
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

    this.materialesFiltrados.sort((a, b) => {
      const na = Number(a.codigo);
      const nb = Number(b.codigo);
      if (!isNaN(na) && !isNaN(nb)) {
        return na - nb;
      }
      return a.codigo.localeCompare(b.codigo, undefined, { numeric: true });
    });

    this.currentPage = 1;
  }

  get pages(): number[] {
    const total = Math.ceil(this.materialesFiltrados.length / this.pageSize);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  get paginatedPages(): number[] {
  const totalPages = this.pages.length;

  if (window.innerWidth <= 600) {
    const blockSize = 5;
    const currentBlock = Math.floor((this.currentPage - 1) / blockSize);
    const start = currentBlock * blockSize + 1;
    const end = Math.min(start + blockSize - 1, totalPages);

    return this.pages.slice(start - 1, end);
  }

  return this.pages;
}


  setPage(page: number): void {
    if (page < 1 || page > this.pages.length) return;
    this.currentPage = page;
  }

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
      this.mostrarMensaje('Guardado exitosamente', 'success');
      this.obtenerInventario();
      setTimeout(() => {
        this.cerrarFormulario();
      }, 3000);
    },
    error: err => {
      console.error(err);
      this.mostrarMensaje('Error al guardar', 'error');
    }
  });
}

mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
  this.mensaje = mensaje;
  this.tipoMensaje = tipo;
  setTimeout(() => {
    this.mensaje = '';
    this.tipoMensaje = '';
  }, 3000);
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

   exportarExcel(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end   = this.currentPage * this.pageSize;
    const visibles = this.materialesFiltrados.slice(start, end);

    const aoa: any[][] = [];
    aoa.push([
      '#','Código','Herramienta','Marca','Serie','Cantidad',
      'Ubicación','Responsable','Fecha Compra','Proveedor','Garantía'
    ]);

    visibles.forEach((m, idx) => {
      aoa.push([
        idx + 1,
        m.codigo,
        m.herramienta,
        m.marca || '-',
        m.numeroSerie || '-',
        m.cantidad,
        m.ubicacion,
        m.responsable,
        m.fechaCompra ? (new Date(m.fechaCompra)).toLocaleDateString() : '-',
        m.proveedor || '-',
        m.garantia ?? '-'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const nombre = `Inventario_${this.route.snapshot.paramMap.get('nombreObra') || 'General'}.xlsx`;
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), nombre);
  }
}
