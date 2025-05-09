import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../navbar/navbar.component';
import { InventarioService, Inventario } from '../../services/inventario.service';
import { AuthService } from '../../services/auth.service';
import { ObraService, Obra } from '../../services/obras.service';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, NavbarComponent]
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
    this.inventarioService.obtenerInventario().subscribe((data) => {
      console.log('[InventarioComponent] obtenerInventario: recibí', data);
      this.materiales = data;
      this.filtrarMateriales();
    }, err => {
      console.error('[InventarioComponent] obtenerInventario ERROR:', err);
    });
  }

  cargarObras(): void {
    console.log('[InventarioComponent] cargarObras: solicitando obras...');
    this.obraService.getObras().subscribe((data) => {
      console.log('[InventarioComponent] cargarObras: recibí', data);
      this.obras = data;
    }, err => {
      console.error('[InventarioComponent] cargarObras ERROR:', err);
    });
  }

  cargarUsuarios(): void {
    console.log('[InventarioComponent] cargarUsuarios: solicitando usuarios...');
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        console.log('[InventarioComponent] cargarUsuarios: recibí', data);
        this.usuarios = data;
        this.responsables = data.filter(u => u.rol === 'responsable');
        console.log('[InventarioComponent] cargarUsuarios: responsables filtrados', this.responsables);
      },
      error: (err) => console.error('[InventarioComponent] cargarUsuarios ERROR:', err)
    });
  }

  filtrarMateriales(): void {
    console.log('[InventarioComponent] filtrarMateriales: query=', this.searchQuery);
    const q = this.searchQuery.trim().toLowerCase();
    this.materialesFiltrados = this.materiales.filter(item =>
      item.codigo.toLowerCase().includes(q) ||
      item.herramienta.toLowerCase().includes(q) ||
      item.numeroSerie.toLowerCase().includes(q) ||
      item.responsable.toLowerCase().includes(q) ||
      item.ubicacion.toLowerCase().includes(q)
    );
    console.log('[InventarioComponent] filtrarMateriales: filtrados=', this.materialesFiltrados);
  }

  mostrarFormularioMaterial(material?: Inventario): void {
    console.log('[InventarioComponent] mostrarFormularioMaterial:', material);
    if (material) {
      this.materialActual = { ...material };
      this.esEdicion = true;
    } else {
      this.materialActual = this.crearNuevoItem();
      this.esEdicion = false;
    }
    console.log('[InventarioComponent] mostrarFormularioMaterial: materialActual=', this.materialActual, 'esEdicion=', this.esEdicion);
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    console.log('[InventarioComponent] cerrarFormulario');
    this.mostrarFormulario = false;
  }

  guardarMaterial(): void {
    console.log('[InventarioComponent] guardarMaterial: esEdicion=', this.esEdicion, 'materialActual=', this.materialActual);
    if (this.esEdicion) {
      this.inventarioService.actualizarItem(this.materialActual).subscribe(() => {
        console.log('[InventarioComponent] guardarMaterial: actualización exitosa');
        this.obtenerInventario();
        this.cerrarFormulario();
      }, err => console.error('[InventarioComponent] guardarMaterial ERROR al actualizar:', err));
    } else {
      this.inventarioService.agregarItem(this.materialActual).subscribe(() => {
        console.log('[InventarioComponent] guardarMaterial: creación exitosa');
        this.obtenerInventario();
        this.cerrarFormulario();
      }, err => console.error('[InventarioComponent] guardarMaterial ERROR al crear:', err));
    }
  }

  eliminarMaterial(id: number): void {
    console.log('[InventarioComponent] eliminarMaterial id=', id);
    if (confirm('¿Estás seguro de que deseas eliminar este material del inventario?')) {
      this.inventarioService.eliminarItem(id).subscribe(() => {
        console.log('[InventarioComponent] eliminarMaterial: eliminación exitosa');
        this.obtenerInventario();
      }, err => console.error('[InventarioComponent] eliminarMaterial ERROR:', err));
    }
  }

  logout(): void {
    console.log('[InventarioComponent] logout');
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private crearNuevoItem(): Inventario {
    const nuevo: Inventario = {
      id: 0,
      codigo: '',
      herramienta: '',
      numeroSerie: '',
      fechaUltimoMantenimiento: '',
      empresaMantenimiento: '',
      fechaProximoMantenimiento: '',
      observaciones: '',
      ubicacion: '',
      responsable: '',
      cantidad: 1
    };
    console.log('[InventarioComponent] crearNuevoItem:', nuevo);
    return nuevo;
  }
}
