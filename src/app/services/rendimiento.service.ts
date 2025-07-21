import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface Rendimiento {
  id: number;
  idEmpleado: number;
  actividad: string;
  dias: number;
  unidad: string;
  cantidad: number;
  fecha: string;
  observaciones: string;
  idContratista: number;
}

@Injectable({
  providedIn: 'root'
})
export class RendimientoService {
  private baseUrl = `${environment.apiUrl}/Rendimiento`;

  constructor(private http: HttpClient) {}

  obtenerTodos(page: number = 1, pageSize: number = 20): Observable<Rendimiento[]> {
    return this.http.get<Rendimiento[]>(`${this.baseUrl}?page=${page}&pageSize=${pageSize}`);
  }

  obtenerPorId(id: number): Observable<Rendimiento> {
    return this.http.get<Rendimiento>(`${this.baseUrl}/${id}`);
  }

  crear(rendimiento: Rendimiento): Observable<Rendimiento> {
    return this.http.post<Rendimiento>(this.baseUrl, rendimiento);
  }

  actualizar(id: number, rendimiento: Rendimiento): Observable<Rendimiento> {
    return this.http.put<Rendimiento>(`${this.baseUrl}/${id}`, rendimiento);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  obtenerActividades(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/actividades`);
  }

  obtenerUnidades(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/unidades`);
  }
}
