import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface Inventario {
  id: number;
  codigo: string;
  herramienta: string;
  numeroSerie: string;
  fechaUltimoMantenimiento: string;
  empresaMantenimiento: string;
  fechaProximoMantenimiento: string;
  observaciones: string;
  ubicacion: string;
  responsable: string;
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

  agregarItem(item: Inventario): Observable<any> {
    return this.http.post(this.apiUrl, item);
  }

  actualizarItem(item: Inventario): Observable<any> {
    return this.http.put(`${this.apiUrl}/${item.id}`, item);
  }

  eliminarItem(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
