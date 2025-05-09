import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface TiempoAusentismo {
  id?: number;
  nombreEmpleado: string;
  comentarios: string;
  permisosEspeciales?: string;
  fechaInicio: string;
  fechaFin: string;
  rutaDocumento?: string;
  archivo?: File | null;
}

@Injectable({
  providedIn: 'root'
})
export class AusentismoService {
  private apiUrl = `${environment.apiUrl}/DocumentoPermiso`;

  constructor(private http: HttpClient) {}

  subirDocumentoAusentismo(formData: FormData): Observable<TiempoAusentismo> {
    return this.http.post<TiempoAusentismo>(`${this.apiUrl}/SubirDocumento`, formData);
  }

  getDocumentos(): Observable<TiempoAusentismo[]> {
    return this.http.get<TiempoAusentismo[]>(this.apiUrl);
  }

  getDocumento(id: number): Observable<TiempoAusentismo> {
    return this.http.get<TiempoAusentismo>(`${this.apiUrl}/${id}`);
  }

  actualizarDocumento(id: number, data: FormData): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data);
  }

  eliminarDocumento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  verPDF(fileName: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/Pdf/ver/${fileName}`, { responseType: 'blob' });
  }

  descargarPDF(fileName: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/Pdf/descargar/${fileName}`, { responseType: 'blob' });
  }
}
