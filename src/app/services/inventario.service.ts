// src/app/services/inventario.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface Inventario {
  id: number;
  codigo: string;
  herramienta: string;
  numeroSerie: string;
  fechaUltimoMantenimiento: string | null;
  fechaProximoMantenimiento: string | null;
  empresaMantenimiento: string;
  fechaCompra: string | null;
  proveedor: string;
  garantia: number;
  observaciones: string;
  ubicacion: string;
  responsable: string;
  estado: string;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private apiUrl = `${environment.apiUrl}/Inventario`;

  constructor(private http: HttpClient) {}

  obtenerInventario(): Observable<Inventario[]> {
    return this.http.get<Inventario[]>(this.apiUrl);
  }

  agregarItem(item: Inventario): Observable<Inventario> {
    return this.http.post<Inventario>(this.apiUrl, item);
  }

  actualizarItem(item: Inventario): Observable<Inventario> {
    return this.http.put<Inventario>(`${this.apiUrl}/${item.id}`, item);
  }

  eliminarItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

 obtenerPorResponsable(nombreResponsable: string): Observable<Inventario[]> {
  return this.http.get<Inventario[]>(`${this.apiUrl}/por-responsable/${encodeURIComponent(nombreResponsable)}`);
}
}
