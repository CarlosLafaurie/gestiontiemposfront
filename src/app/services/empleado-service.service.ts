import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface Empleado {
  id: number;
  cedula: string;
  nombreCompleto: string;
  cargo: string;
  obra: string;
  responsable: string;
  responsableSecundario?: string;
  salario: number;
  estado?: string;
  seleccionado?: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {
  private apiUrl = `${environment.apiUrl}/Empleados`;

  constructor(private http: HttpClient) {}

  obtenerEmpleados(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(this.apiUrl);
  }

  obtenerEmpleadosPorObraYResponsable(obra: string, responsable: string): Observable<Empleado[]> {
    return new Observable(observer => {
      this.obtenerEmpleados().subscribe(empleados => {
        const filtrados = empleados.filter(emp =>
          emp.obra.trim().toLowerCase() === obra.trim().toLowerCase() &&
          emp.responsable.trim().toLowerCase() === responsable.trim().toLowerCase()
        );
        observer.next(filtrados);
        observer.complete();
      });
    });
  }

  crearEmpleado(empleado: Empleado): Observable<Empleado> {
    return this.http.post<Empleado>(this.apiUrl, empleado);
  }

  actualizarEmpleado(id: number, empleado: Empleado): Observable<Empleado> {
    return this.http.put<Empleado>(`${this.apiUrl}/${id}`, empleado);
  }

  eliminarEmpleado(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
