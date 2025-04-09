import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environments';

export interface Tiempo {
  id?: number;
  empleadoId: number;
  fechaHoraEntrada?: string | null;
  fechaHoraSalida?: string | null;
  comentarios: string;
  permisosEspeciales: string;
  nombreEmpleado?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TiemposService {
  private apiIngresos = `${environment.apiUrl}/IngresosPersonal`;
  private apiSalidas = `${environment.apiUrl}/SalidasPersonal`;

  constructor(private http: HttpClient) {}

  obtenerIngresos(): Observable<Tiempo[]> {
    return this.http.get<Tiempo[]>(this.apiIngresos);
  }

  obtenerIngresoPorEmpleado(empleadoId: number): Observable<Tiempo[]> {
    return this.http.get<Tiempo[]>(`${this.apiIngresos}?empleadoId=${empleadoId}`);
  }

  actualizarIngreso(id: number, tiempo: Tiempo): Observable<void> {
    return this.http.put<void>(`${this.apiIngresos}/${id}`, tiempo);
  }

  eliminarIngreso(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiIngresos}/${id}`);
  }

  obtenerSalidas(): Observable<Tiempo[]> {
    return this.http.get<Tiempo[]>(this.apiSalidas);
  }

  obtenerSalidaPorEmpleado(empleadoId: number): Observable<Tiempo[]> {
    return this.http.get<Tiempo[]>(`${this.apiSalidas}?empleadoId=${empleadoId}`);
  }

  registrarIngreso(tiempo: Tiempo): Observable<any> {
    return this.http.post(`${this.apiIngresos}`, tiempo).pipe(
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }


  registrarSalida(tiempo: Tiempo): Observable<any> {
    return this.http.post(`${this.apiSalidas}`, tiempo).pipe(
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }
}
