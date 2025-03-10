import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Empleado {
  id: number;
  cedula: string;
  nombreCompleto: string;
  cargo: string;
  obra: string;
  responsable: string;
  seleccionado?: boolean; // ← Agregar esta propiedad opcional
}


@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {
  private apiUrl = 'https://localhost:7280/api/Empleados';

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
