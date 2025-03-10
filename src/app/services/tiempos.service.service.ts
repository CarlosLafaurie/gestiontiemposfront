import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Tiempo {
  id: number;
  empleadoId: number;
  fechaHoraEntrada: string | null; // Permitir null
  fechaHoraSalida: string | null;  // Permitir null
  comentarios: string;
  permisosEspeciales: string;
  empleado: {
    id: number;
    cedula: string;
    nombreCompleto: string;
    cargo: string;
    obra: string;
    responsable: string;
  };
}


@Injectable({
  providedIn: 'root',
})
export class TiemposService {
  private apiUrl = 'https://localhost:7280/api/tiemposg'; // URL del API

  constructor(private http: HttpClient) {}

  // Obtener todos los registros de tiempos
  getTiempos(): Observable<Tiempo[]> {
    return this.http.get<Tiempo[]>(this.apiUrl);
  }

  // Obtener un tiempo específico por ID de empleado
  getTiempoByEmpleadoId(empleadoId: number): Observable<Tiempo[]> {
    return this.http.get<Tiempo[]>(`${this.apiUrl}?empleadoId=${empleadoId}`);
  }

  // Crear un nuevo registro de tiempo
  createTiempo(tiempo: Tiempo): Observable<Tiempo> {
    return this.http.post<Tiempo>(this.apiUrl, tiempo);
  }

  // Editar un registro de tiempo
  updateTiempo(id: number, tiempo: Tiempo): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, tiempo);
  }

  // Eliminar un registro de tiempo
  deleteTiempo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Crear múltiples registros de tiempos
  guardarTiempos(tiempos: Tiempo[]): Observable<Tiempo[]> {
    return this.http.post<Tiempo[]>(`${this.apiUrl}/bulk`, tiempos);
  }  
}
