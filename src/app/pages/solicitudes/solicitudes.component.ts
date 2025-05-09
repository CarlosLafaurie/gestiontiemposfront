import { Component, OnInit, inject } from '@angular/core';
import { CommonModule  } from '@angular/common';
import { FormsModule   } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule} from '@angular/material/button';
import { NavbarComponent } from '../../navbar/navbar.component';

import {
  SolicitudService,
  Solicitud,
  EstadoSolicitud
} from '../../services/solicitud.service';
import { AuthService       } from '../../services/auth.service';
import { InventarioService, Inventario } from '../../services/inventario.service';
import { ObraService, Obra }  from '../../services/obras.service';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatButtonModule,
    NavbarComponent
  ],
  templateUrl: './solicitudes.component.html',
  styleUrls:   ['./solicitudes.component.css']
})
export class SolicitudesComponent implements OnInit {
  private auth       = inject(AuthService);
  private service    = inject(SolicitudService);
  private invService = inject(InventarioService);
  private obraService= inject(ObraService);

  EstadoSolicitud = EstadoSolicitud; 

  esAdmin = false;
  esResponsable = false;
  usuarioActual = '';

  solicitudes: Solicitud[] = [];
  filtradas:   Solicitud[] = [];
  filtroEstado: EstadoSolicitud | '' = '';

  displayedColumns = [
    'herramienta','cantidad','obra',
    'solicitante','fechaSolicitud','estado'
  ];

  nueva: Solicitud = {
    inventarioId:   0,
    cantidad:       1,
    solicitante:    '',
    obra:           '',
    fechaSolicitud: new Date().toISOString(),
    observaciones:  '',
    estado:         EstadoSolicitud.Pendiente
  };

  inventario: Inventario[] = [];
  obras: Obra[] = [];

  ngOnInit() {
    const ud  = this.auth.getUserData() || {};
    this.usuarioActual = ud.nombreCompleto || '';
    const rol = String(ud.rol || '').toLowerCase();
    this.esAdmin       = rol === 'admin';
    this.esResponsable = rol === 'responsable';
    if (this.esAdmin) this.displayedColumns.push('acciones');

    this.invService.obtenerInventario().subscribe(list => this.inventario = list);
    this.obraService.getObras().subscribe(list => this.obras = list);
    this.cargarSolicitudes();
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

  crearSolicitud() {
    if (!this.nueva.inventarioId || !this.nueva.obra) {
      return alert('Complete los campos obligatorios');
    }
    this.nueva.solicitante    = this.usuarioActual;
    this.nueva.fechaSolicitud = new Date().toISOString();
    this.nueva.estado         = EstadoSolicitud.Pendiente;

    this.service.crearSolicitud(this.nueva)
      .subscribe(() => {
        this.nueva = {
          inventarioId:   0,
          cantidad:       1,
          solicitante:    '',
          obra:           '',
          fechaSolicitud: new Date().toISOString(),
          observaciones:  '',
          estado:         EstadoSolicitud.Pendiente
        };
        this.cargarSolicitudes();
      });
  }

  cambiarEstado(s: Solicitud, nuevo: EstadoSolicitud) {
    if (!s.id) { return; }

    this.service.cambiarEstado(s.id, nuevo)
      .subscribe({
        next: () => {
          console.log(`✔️ Estado de solicitud ${s.id} cambiado a ${nuevo}`);
          this.cargarSolicitudes();
        },
        error: (err) => {
          console.error(`❌ Error cambiando estado de ${s.id}:`, err);
          if (err.error) {
            console.error('Detalle del error:', err.error);
            alert(`No se pudo actualizar: ${err.error}`);
          } else {
            alert('No se pudo actualizar el estado.');
          }
        }
      });
  }

  getHerramienta(id: number): string {
    const it = this.inventario.find(x => x.id === id);
    return it ? it.herramienta : '';
  }
}
