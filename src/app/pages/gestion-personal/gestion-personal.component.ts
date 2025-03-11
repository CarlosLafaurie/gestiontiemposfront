import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { EmpleadoService, Empleado } from '../../services/empleado-service.service';
import { CommonModule } from '@angular/common';
import { ListaTiemposComponent } from '../../lista-tiempos/lista-tiempos.component';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from "../../navbar/navbar.component";

@Component({
  selector: 'app-gestion-personal',
  templateUrl: './gestion-personal.component.html',
  styleUrls: ['./gestion-personal.component.css'],
  imports: [FormsModule, CommonModule, ListaTiemposComponent, NavbarComponent]
})
export class GestionPersonalComponent implements OnInit {
  nombreObra: string = '';
  responsable: string = '';
  empleados: Empleado[] = [];
  empleadosFiltrados: Empleado[] = [];
  empleadosSeleccionados: any[] = []; // Se almacenarán { id, nombre }

  constructor(
    private route: ActivatedRoute,
    private empleadoService: EmpleadoService,
    private authService: AuthService,
     private router: Router
  ) {}

  ngOnInit(): void {
    // Recupera el nombre de la obra de la URL
    this.route.paramMap.subscribe(params => {
      this.nombreObra = params.get('nombreObra')?.replace(/-/g, ' ') || '';
    });

    // Recupera el nombre del responsable desde localStorage
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      const usuarioParseado = JSON.parse(usuario);
      this.responsable = usuarioParseado.nombreCompleto;
    }

    this.obtenerEmpleados();
  }

  obtenerEmpleados() {
    this.empleadoService.obtenerEmpleados().subscribe((data) => {
      // Agrega la propiedad "seleccionado" a cada empleado para el checkbox
      this.empleados = data.map(emp => ({ ...emp, seleccionado: false }));
      this.filtrarEmpleados();
    });
  }

  filtrarEmpleados() {
    // Filtra los empleados según la obra y el responsable
    this.empleadosFiltrados = this.empleados.filter(
      empleado =>
        empleado.obra.trim().toLowerCase() === this.nombreObra.trim().toLowerCase() &&
        empleado.responsable.trim().toLowerCase() === this.responsable.trim().toLowerCase()
    );
  }

  gestionarTiempos() {
    // Actualiza automáticamente el arreglo de empleados seleccionados cada vez que se marque un checkbox.
    this.empleadosSeleccionados = this.empleadosFiltrados
      .filter(e => e.seleccionado)
      .map(e => ({
        id: e.id,
        nombre: e.nombreCompleto
      }));

    console.log("✅ Empleados seleccionados para lista de tiempos:", this.empleadosSeleccionados);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']); 
  }
}
