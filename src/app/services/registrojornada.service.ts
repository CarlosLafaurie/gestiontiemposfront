import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environments';
import { Observable } from 'rxjs';

export interface ResumenEmpleado {
  fecha: string;
  horaEntrada: string;
  horaSalida: string;
  nombreCompleto: string;
  horasTrabajadas: number;
  horasDiurnas: number;
  horasNocturnas: number;
  horasExtrasDiurnas: number;
  horasExtrasNocturnas: number;
  trabajoDomingo: boolean;
  trabajoFestivo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RegistroJornadaService {
  private apiUrl = `${environment.apiUrl}/RegistroJornada`;

  constructor(private http: HttpClient) {}

  obtenerResumenHoras(
    usarFestivos: boolean = false,
    fechaInicio?: string,
    fechaFin?: string,
  ): Observable<ResumenEmpleado[]> {
    let params = new HttpParams();
    if (usarFestivos) {
      params = params.set('usarFestivos', 'true');
    }
    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }


    return this.http.get<ResumenEmpleado[]>(`${this.apiUrl}/resumenhoras`, { params });
  }
}
