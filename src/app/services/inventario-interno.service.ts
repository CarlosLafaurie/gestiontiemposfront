import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface InventarioInterno {
  id: number;
  inventarioId: number;
  obra: string;
  responsableObra: string;
  usando: string;
  cantidadAsignada: number;
  observaciones: string;
  equipo: {
    nombre: string;
    numeroSerie: string;
    marca: string;
    cantidad: number;
    unidades: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class InventarioInternoService {
  private apiUrl = `${environment.apiUrl}/InventarioInterno`;

  constructor(private http: HttpClient) {}

  obtenerTodos(): Observable<InventarioInterno[]> {
    return this.http.get<InventarioInterno[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<InventarioInterno> {
    return this.http.get<InventarioInterno>(`${this.apiUrl}/${id}`);
  }

  obtenerPorObra(obra: string): Observable<InventarioInterno[]> {
    return this.http.get<InventarioInterno[]>(`${this.apiUrl}/obra/${obra}`);
  }

  agregarItem(item: InventarioInterno): Observable<InventarioInterno> {
    return this.http.post<InventarioInterno>(this.apiUrl, item);
  }

  actualizarItem(item: InventarioInterno): Observable<InventarioInterno> {
    return this.http.put<InventarioInterno>(`${this.apiUrl}/${item.id}`, item);
  }

  eliminarItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
