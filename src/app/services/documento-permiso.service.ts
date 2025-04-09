import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface TiempoAusentismo {
  id?: number;
  nombreEmpleado: string;
  comentarios: string;
  permisosEspeciales?: string;
  fechaHoraEntrada: string;
  rutaDocumento?: string;
  archivo?: File | null;
}

@Injectable({
  providedIn: 'root'
})
export class AusentismoService {
  private apiUrl = `${environment.apiUrl}/DocumentoPermiso`;

  constructor(private http: HttpClient) {}

  subirDocumentoAusentismo(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/SubirDocumento`, formData);
  }

  getDocumentos(): Observable<TiempoAusentismo[]> {
    return this.http.get<TiempoAusentismo[]>(this.apiUrl);
  }

  getDocumento(id: number): Observable<TiempoAusentismo> {
    return this.http.get<TiempoAusentismo>(`${this.apiUrl}/${id}`);
  }

  actualizarDocumento(id: number, data: TiempoAusentismo): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  eliminarDocumento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  verPDF(fileName: string): Observable<Blob> {
    const url = `${environment.apiUrl}/Pdf/ver/${fileName}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  descargarPDF(fileName: string): Observable<Blob> {
    const url = `${environment.apiUrl}/Pdf/descargar/${fileName}`;
    return this.http.get(url, { responseType: 'blob' });
  }
}
