import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

import {
  SolicitudService,
  Solicitud,
  SolicitudItem,
  EstadoSolicitud,
} from '../../services/solicitud.service';
import { AuthService } from '../../services/auth.service';
import { InventarioService, Inventario } from '../../services/inventario.service';
import { ObraService } from '../../services/obras.service';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatButtonModule,
    NavbarComponent, BotonRegresarComponent
  ],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.css']
})
export class SolicitudesComponent implements OnInit {
  private auth = inject(AuthService);
  private service = inject(SolicitudService);
  private invService = inject(InventarioService);
  private obraService = inject(ObraService);

  EstadoSolicitud = EstadoSolicitud;

  esAdmin = false;
  esResponsable = false;
  usuarioActual = '';

  solicitudes: Solicitud[] = [];
  filtradas: Solicitud[] = [];
  filtroEstado: EstadoSolicitud | '' = '';

  filtroHerramienta: string = '';
  inventario: Inventario[] = [];
  inventarioFiltrado: Inventario[] = [];
  obras: any[] = [];

  displayedColumns = [
    'herramienta', 'cantidad', 'obra',
    'solicitante', 'fechaSolicitud', 'estado'
  ];

  nueva: Solicitud = {
    solicitante: '',
    obra: '',
    fechaSolicitud: new Date().toISOString(),
    observaciones: '',
    estado: EstadoSolicitud.Pendiente,
    items: []
  };

  itemTemp: SolicitudItem = {
    inventarioId: 0,
    cantidad: 1
  };

  ngOnInit() {
    const ud = this.auth.getUserData() || {};
    this.usuarioActual = ud.nombreCompleto || '';
    const rol = String(ud.rol || '').toLowerCase();
    this.esAdmin = rol === 'admin';
    this.esResponsable = rol === 'responsable';

    if (this.esResponsable && ud.obra) {
      this.nueva.obra = ud.obra;
    }
    if (this.esAdmin) this.displayedColumns.push('acciones');

    this.loadInventario();
    this.loadObras();
    this.cargarSolicitudes();
  }

  loadInventario() {
    this.invService.obtenerInventario().subscribe(list => {
      this.inventario = list;
      this.filtrarHerramientas();
    });
  }

  loadObras() {
    this.obraService.getObras().subscribe(list => {
      this.obras = list;
    });
  }

  filtrarHerramientas() {
    const q = this.filtroHerramienta.trim().toLowerCase();
    this.inventarioFiltrado = this.inventario.filter(it =>
      it.herramienta.toLowerCase().includes(q) ||
      it.ubicacion.toLowerCase().includes(q)
    );
  }

  cargarSolicitudes() {
    this.service.getSolicitudes().subscribe(list => {
      this.solicitudes = list;
      this.aplicarFiltro();
    });
  }

  aplicarFiltro() {
    const arr = this.solicitudes.filter(s =>
      !this.filtroEstado || s.estado === this.filtroEstado
    );
    this.filtradas = this.esAdmin
      ? arr
      : arr.filter(s => s.solicitante === this.usuarioActual);
  }

  agregarItem() {
    if (!this.itemTemp.inventarioId || this.itemTemp.cantidad < 1) {
      alert('Seleccione una herramienta válida y cantidad mayor a 0.');
      return;
    }
    this.nueva.items.push({ ...this.itemTemp });
    this.itemTemp = { inventarioId: 0, cantidad: 1 };
  }

  eliminarItem(index: number) {
    this.nueva.items.splice(index, 1);
  }

  crearSolicitud() {
    if (!this.nueva.obra || this.nueva.items.length === 0) {
      alert('Debe seleccionar una obra y al menos una herramienta.');
      return;
    }
    this.nueva.solicitante = this.usuarioActual;
    this.nueva.fechaSolicitud = new Date().toISOString();
    this.nueva.estado = EstadoSolicitud.Pendiente;
    this.service.crearSolicitud(this.nueva).subscribe(() => {
      this.nueva = { solicitante: '', obra: '', fechaSolicitud: new Date().toISOString(), observaciones: '', estado: EstadoSolicitud.Pendiente, items: [] };
      this.cargarSolicitudes();
    });
  }

  cambiarEstado(s: Solicitud, nuevo: EstadoSolicitud) {
    if (!s.id) return;
    this.service.cambiarEstado(s.id, nuevo).subscribe(() => {
      this.cargarSolicitudes();
    });
  }

  getHerramienta(id: number): string {
    const it = this.inventario.find(x => x.id === id);
    return it ? it.herramienta : '(desconocida)';
  }
}
