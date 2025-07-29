import { Component, OnInit } from '@angular/core';
import { Contratista, ContratistaService } from '../../services/contratista.service';

@Component({
  selector: 'app-contratista',
  templateUrl: './contratista.component.html',
  styleUrls: ['./contratista.component.css']
})
export class ContratistaComponent implements OnInit {
  contratistas: Contratista[] = [];
  contratistasFiltrados: Contratista[] = [];
  contratistaActual: Contratista = this.inicializarContratista();
  mostrarFormulario = false;
  esEdicion = false;
  searchQuery = '';

  constructor(private contratistaService: ContratistaService) {}

  ngOnInit() {
    this.obtenerContratistas();
  }

  inicializarContratista(): Contratista {
    return {
      id: 0,
      nombre: '',
      cedula: '',
      telefono: '',
      obraId: 0
    };
  }

  obtenerContratistas() {
    this.contratistaService.obtenerTodos().subscribe((data) => {
      this.contratistas = data;
      this.filtrarContratistas();
    });
  }

  filtrarContratistas() {
    const query = this.searchQuery.toLowerCase();
    this.contratistasFiltrados = this.contratistas.filter(c =>
      c.nombre.toLowerCase().includes(query) ||
      c.cedula.includes(query) ||
      c.telefono.includes(query)
    );
  }

  mostrarFormularioContratista(contratista?: Contratista) {
    this.mostrarFormulario = true;
    if (contratista) {
      this.contratistaActual = { ...contratista };
      this.esEdicion = true;
    } else {
      this.contratistaActual = this.inicializarContratista();
      this.esEdicion = false;
    }
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.contratistaActual = this.inicializarContratista();
  }

  guardarContratista() {
    if (this.esEdicion) {
      this.contratistaService.actualizar(this.contratistaActual.id, this.contratistaActual).subscribe(() => {
        this.obtenerContratistas();
        this.cerrarFormulario();
      });
    } else {
      this.contratistaService.crear(this.contratistaActual).subscribe(() => {
        this.obtenerContratistas();
        this.cerrarFormulario();
      });
    }
  }

  eliminarContratista(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este contratista?')) {
      this.contratistaService.eliminar(id).subscribe(() => {
        this.obtenerContratistas();
      });
    }
  }
}
