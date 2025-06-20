import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export enum EstadoSolicitud {
  Pendiente  = 'Pendiente',
  Aprobada   = 'Aprobada',
  Rechazada  = 'Rechazada',
  Comprado  = 'Comprado',
}

export interface Solicitud {
  id?: number;
  inventarioId: number;
  solicitante: string;
  obra: string;
  cantidad: number;
  fechaSolicitud: string;
  observaciones?: string;
  estado: EstadoSolicitud;
}

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Solicitud`;

  getSolicitudes(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(this.apiUrl);
  }

  crearSolicitud(sol: Solicitud): Observable<Solicitud> {
    const payload: Solicitud = {
      ...sol,
      estado: sol.estado ?? EstadoSolicitud.Pendiente
    };
    return this.http.post<Solicitud>(this.apiUrl, payload);
  }

  cambiarEstado(id: number, nuevoEstado: EstadoSolicitud): Observable<void> {
    const params = new HttpParams().set('nuevoEstado', nuevoEstado);
    return this.http.patch<void>(
      `${this.apiUrl}/${id}/estado`,
      {},
      { params }
    );
  }
}
