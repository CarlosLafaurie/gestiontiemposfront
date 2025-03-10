import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EmpleadoService, Empleado } from '../../services/empleado-service.service';
import { CommonModule } from '@angular/common';
import { ListaTiemposComponent } from '../../lista-tiempos/lista-tiempos.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gestion-personal',
  templateUrl: './gestion-personal.component.html',
  styleUrls: ['./gestion-personal.component.css'],
  imports: [FormsModule, CommonModule, ListaTiemposComponent]
})
export class GestionPersonalComponent implements OnInit {
  nombreObra: string = '';
  responsable: string = '';
  empleados: Empleado[] = [];
  empleadosFiltrados: Empleado[] = [];
  empleadosSeleccionados: any[] = [];

  constructor(private route: ActivatedRoute, private EmpleadoService: EmpleadoService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.nombreObra = params.get('nombreObra')?.replace(/-/g, ' ') || '';
    });

    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      const usuarioParseado = JSON.parse(usuario);
      this.responsable = usuarioParseado.nombreCompleto;
    }

    this.obtenerEmpleados();
  }

  obtenerEmpleados() {
    this.EmpleadoService.obtenerEmpleados().subscribe((data) => {
      this.empleados = data.map(emp => ({ ...emp, seleccionado: false }));
      this.filtrarEmpleados();
    });
  }

  filtrarEmpleados() {
    this.empleadosFiltrados = this.empleados.filter(
      empleado => empleado.obra.trim().toLowerCase() === this.nombreObra.trim().toLowerCase() &&
                  empleado.responsable.trim().toLowerCase() === this.responsable.trim().toLowerCase()
    );
  }

  gestionarTiempos() {
    this.empleadosSeleccionados = this.empleadosFiltrados
      .filter(e => e.seleccionado)
      .map(e => ({
        id: e.id,
        cedula: e.cedula,
        nombreCompleto: e.nombreCompleto,
        cargo: e.cargo,
        obra: e.obra,
        responsable: e.responsable
      }));
  
    if (this.empleadosSeleccionados.length === 0) {
      alert("⚠️ Selecciona al menos un empleado.");
      return;
    }
  
    console.log("✅ Empleados seleccionados para lista de tiempos:", this.empleadosSeleccionados);
  }

  enviarSeleccionados() {
    const seleccionados = this.empleadosFiltrados.filter(e => e.seleccionado);
    console.log("Empleados seleccionados:", seleccionados);
    
   
  }
  
}
