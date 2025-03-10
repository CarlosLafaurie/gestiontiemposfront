import { Component, OnInit, Input } from '@angular/core';
import { ObraService, Obra } from '../services/obras.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lista-obras',
  standalone: true,
  templateUrl: './lista-obras.component.html',
  styleUrls: ['./lista-obras.component.css'],
  imports: [CommonModule]
})
export class ListaObrasComponent implements OnInit {
  @Input() cargo: string | null = null;
  @Input() usuario: string | null = null; 

  obras: Obra[] = [];
  obrasFiltradas: Obra[] = [];

  constructor(private obraService: ObraService, private router: Router) {}

  ngOnInit(): void {
    if (!this.usuario || !this.cargo) {
      const usuarioData = localStorage.getItem('usuario'); 
      if (usuarioData) {
        const usuarioObj = JSON.parse(usuarioData); 
        this.usuario = usuarioObj.nombreCompleto;
        this.cargo = usuarioObj.cargo; 
      }
    }

    console.log("Recibido en ListaObrasComponent - Cargo:", this.cargo, "Usuario:", this.usuario);

    if (this.usuario && this.cargo) {
      this.obtenerObras();
    }
  }

  obtenerObras() {
    this.obraService.getObras().subscribe((data) => {
      this.obras = data;
      this.filtrarObras(data);
    });
  }
 
  filtrarObras(obras: Obra[]) {
    console.log("Usuario:", this.usuario, "Cargo:", this.cargo);
    console.log("Obras sin filtrar:", obras);
  
    if (this.cargo === 'admin') {
      this.obrasFiltradas = obras; 
    } else if (this.cargo === 'responsable') {
      this.obrasFiltradas = obras.filter(obra => {
        console.log(`Comparando responsable: '${obra.responsable.trim().toLowerCase()}' con usuario: '${this.usuario?.trim().toLowerCase()}'`);
        return obra.responsable.trim().toLowerCase() === this.usuario?.trim().toLowerCase();
      });
    } else if (this.cargo === 'cliente') {
      this.obrasFiltradas = obras.filter(obra => {
        console.log(`Comparando clienteObra: '${obra.clienteObra.trim().toLowerCase()}' con usuario: '${this.usuario?.trim().toLowerCase()}'`);
        return obra.clienteObra.trim().toLowerCase() === this.usuario?.trim().toLowerCase();
      });
    }
  
    console.log("Obras filtradas:", this.obrasFiltradas);
  }
  

  verDetalles(id: number) {
    this.router.navigate(['/obra', id]);
  }

  eliminarObra(id: number) {
    if (confirm('¿Estás seguro de que quieres eliminar esta obra?')) {
      this.obraService.deleteObra(id).subscribe(() => {
        this.obtenerObras();
      });
    }
  }
}
