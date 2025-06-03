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
  @Input() rol: string | null = null;
  @Input() usuario: string | null = null;

  obras: Obra[] = [];
  obrasFiltradas: Obra[] = [];

  constructor(private obraService: ObraService, private router: Router) {}

  ngOnInit(): void {
    console.log('🟢 ListaObrasComponent inicializado.');

    if (!this.usuario || !this.rol) {
      const usuarioData = localStorage.getItem('usuario');
      if (usuarioData) {
        const usuarioObj = JSON.parse(usuarioData);
        this.usuario = usuarioObj.nombreCompleto;
        this.rol = usuarioObj.rol;
      } else {
        console.log('❌ No se encontraron datos de usuario en localStorage.');
      }
    }

    if (this.usuario && this.rol) {
      this.obtenerObras();
    } else {
      console.log('⛔ No hay usuario o rol definido. No se cargarán obras.');
    }
  }

  obtenerObras() {
    console.log('📡 Solicitando lista de obras al servicio...');
    this.obraService.getObras().subscribe({
      next: (data) => {
        console.log('✅ Obras recibidas:', data);
        this.obras = data;
        this.filtrarObras(data);
      },
      error: (err) => {
        console.error('❌ Error al obtener las obras:', err);
      }
    });
  }



  filtrarObras(obras: Obra[]) {
    if (this.rol === 'admin') {
      this.obrasFiltradas = obras;
    } else if (this.rol === 'responsable') {
      this.obrasFiltradas = obras.filter(obra =>
        obra.responsable.trim().toLowerCase() === this.usuario?.trim().toLowerCase() ||
        (obra.responsableSecundario?.trim().toLowerCase() ?? '') === this.usuario?.trim().toLowerCase()
      );
    } else if (this.rol === 'cliente') {
      this.obrasFiltradas = obras.filter(obra =>
        obra.clienteObra.trim().toLowerCase() === this.usuario?.trim().toLowerCase()
      );
    }
  }

  verDetalles(id: number) {
    this.router.navigate(['/obra', id]);
  }

}
