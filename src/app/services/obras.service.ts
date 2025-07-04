import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environments';

export interface Obra {
  id: number;
  nombreObra: string;
  responsable: string;
  responsableSecundario?: string;
  clienteObra: string;
  estado?: string;
  costoObra: number;
  ubicacion: string;
}


@Injectable({
  providedIn: 'root',
})
export class ObraService {
  private apiUrl = `${environment.apiUrl}/Obras`;

  private http = inject(HttpClient);

  getObras(): Observable<Obra[]> {
    return this.http.get<Obra[]>(this.apiUrl).pipe( );
  }

  getObra(id: number): Observable<Obra> {
    return this.http.get<Obra>(`${this.apiUrl}/${id}`);
  }

  getObrasInactivas(): Observable<Obra[]> {
  return this.http.get<Obra[]>(`${this.apiUrl}/inactivas`);
}

 createObra(obra: Omit<Obra, 'id'>): Observable<Obra> {
    return this.http.post<Obra>(this.apiUrl, obra);
  }

  editObra(id: number, obra: Obra): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, obra);
  }

  deleteObra(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
