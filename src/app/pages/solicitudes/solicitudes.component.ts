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

  this.loadObras();
  this.loadInventarioYDespuesSolicitudes();
}

loadInventarioYDespuesSolicitudes() {
  this.invService.obtenerInventario().subscribe(list => {
    this.inventario = list;
    this.filtrarHerramientas();
    this.cargarSolicitudes();
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
    console.log('📥 Solicitudes recibidas desde el backend:', list);

    this.solicitudes = list;

    // Verificamos que cada solicitud tenga items válidos
    list.forEach((s, i) => {
      console.log(`🔍 Solicitud [${i}] - Solicitante: ${s.solicitante}, Obra: ${s.obra}`);
      console.log(`🧾 Items:`, s.items);

      s.items.forEach((item, j) => {
        console.log(`   ➤ Item [${j}]: inventarioId=${item.inventarioId}, cantidad=${item.cantidad}`);
      });
    });

    this.aplicarFiltro();
  });
}

  aplicarFiltro() {
    const arr = this.solicitudes
      .filter(s => !this.filtroEstado || s.estado === this.filtroEstado)
      .sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime());

    this.filtradas = this.esAdmin
      ? arr
      : arr.filter(s => s.solicitante === this.usuarioActual);
  }


 agregarItem() {
  const existe = this.nueva.items.some(item => item.inventarioId === this.itemTemp.inventarioId);
  if (existe) {
    alert('Ya se agregó esta herramienta.');
    return;
  }
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
  this.service.crearSolicitud(this.nueva).subscribe({
    next: () => {
      this.nueva = {
        solicitante: '',
        obra: '',
        fechaSolicitud: new Date().toISOString(),
        observaciones: '',
        estado: EstadoSolicitud.Pendiente,
        items: []
      };
        this.cargarSolicitudes();
      },
      error: err => {
        console.error('❌ Error al crear solicitud:', err);
      }
    });
  }


  cambiarEstado(s: Solicitud, nuevo: EstadoSolicitud) {
    if (!s.id) return;
    this.service.cambiarEstado(s.id, nuevo).subscribe(() => {
      this.cargarSolicitudes();
    });
  }

 getHerramienta(id: number | string, mostrarCodigo = false): string {
    const it = this.inventario.find(x => x.id === Number(id));
    if (!it) return '(desconocida)';
    return mostrarCodigo ? `${it.codigo} - ${it.herramienta}` : it.herramienta;
  }


}
