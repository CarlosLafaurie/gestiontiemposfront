import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  obtenerResumenHoras(usarFestivos: boolean = false): Observable<ResumenEmpleado[]> {
    const url = usarFestivos
      ? `${this.apiUrl}/resumenhoras?usarFestivos=true`
      : `${this.apiUrl}/resumenhoras`;
    return this.http.get<ResumenEmpleado[]>(url);
  }
}
