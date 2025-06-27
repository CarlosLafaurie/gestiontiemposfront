import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export enum EstadoSolicitud {
  Pendiente  = 'Pendiente',
  Aprobada   = 'Aprobada',
  Rechazada  = 'Rechazada',
  Comprado   = 'Comprado',
}

export interface SolicitudItem {
  inventarioId: number;
  cantidad: number;
}

export interface Solicitud {
  id?: number;
  solicitante: string;
  obra: string;
  fechaSolicitud: string;
  observaciones?: string;
  estado?: EstadoSolicitud;
  items: SolicitudItem[];
}

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Solicitud`;

  // Obtener todas las solicitudes
  getSolicitudes(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(this.apiUrl);
  }

  // Crear una solicitud
  crearSolicitud(sol: Solicitud): Observable<Solicitud> {
    // No enviar ID ni estado explícitamente si no es necesario
    const payload = {
      solicitante: sol.solicitante,
      obra: sol.obra,
      fechaSolicitud: sol.fechaSolicitud,
      observaciones: sol.observaciones,
      items: sol.items.map(item => ({
        inventarioId: item.inventarioId,
        cantidad: item.cantidad
      }))
    };
    return this.http.post<Solicitud>(this.apiUrl, payload);
  }

  // Cambiar estado
  cambiarEstado(id: number, nuevoEstado: EstadoSolicitud): Observable<void> {
    const params = new HttpParams().set('nuevoEstado', nuevoEstado);
    return this.http.patch<void>(
      `${this.apiUrl}/${id}/estado`,
      {},
      { params }
    );
  }
}
