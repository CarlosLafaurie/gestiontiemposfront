import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { TiempoAusentismo, AusentismoService } from '../../services/documento-permiso.service';

@Component({
  selector: 'app-permisos-admin',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FormsModule],
  templateUrl: './permisos-admin.component.html',
  styleUrls: ['./permisos-admin.component.css']
})
export class PermisosAdminComponent implements OnInit {
  documentos: TiempoAusentismo[] = [];
  documentosFiltrados: TiempoAusentismo[] = [];
  documentoEditando: TiempoAusentismo | null = null;
  searchQuery: string = '';

  private ausentismoService = inject(AusentismoService);

  ngOnInit(): void {
    this.cargarDocumentos();

  }

  cargarDocumentos(): void {
    this.ausentismoService.getDocumentos().subscribe({
      next: (data) => {
        this.documentos = data;
        this.documentosFiltrados = [...this.documentos];
      },
      error: (err) => {
        console.error("❌ Error al obtener documentos:", err);
      }
    });
  }

  filtrarPermisos(): void {
    if (!this.searchQuery) {
      this.documentosFiltrados = this.documentos;
    } else {
      const q = this.searchQuery.toLowerCase();

      this.documentosFiltrados = this.documentos.filter(doc =>
        (doc.nombreEmpleado && doc.nombreEmpleado.toLowerCase().includes(q)) ||
        (doc.comentarios && doc.comentarios.toLowerCase().includes(q)) ||
        (doc.permisosEspeciales && doc.permisosEspeciales.toLowerCase().includes(q)) ||
        (doc.fechaHoraEntrada && doc.fechaHoraEntrada.toLowerCase().includes(q))
      );
    }
  }

  editar(documento: TiempoAusentismo): void {
    this.documentoEditando = { ...documento };
  }

  guardarCambios(): void {
    if (this.documentoEditando?.id) {
      this.ausentismoService.actualizarDocumento(this.documentoEditando.id, this.documentoEditando).subscribe({
        next: () => {
          this.documentoEditando = null;
          this.cargarDocumentos();
        },
        error: (err) => {
          console.error("❌ Error al guardar cambios:", err);
        }
      });
    }
  }

  cancelarEdicion(): void {
    this.documentoEditando = null;
  }

  eliminar(id: number): void {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      this.ausentismoService.eliminarDocumento(id).subscribe({
        next: () => this.cargarDocumentos(),
        error: (err) => console.error("❌ Error al eliminar documento:", err)
      });
    }
  }

  descargar(documento: TiempoAusentismo): void {
    const ruta = documento.rutaDocumento;
    const fileName = ruta?.split('\\').pop();
    if (fileName) {
      this.ausentismoService.descargarPDF(fileName).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error("❌ Error al descargar PDF:", err);
        }
      });
    }
  }

  ver(documento: TiempoAusentismo): void {
    const ruta = documento.rutaDocumento;
    const fileName = ruta?.split('\\').pop();
    if (fileName) {
      this.ausentismoService.verPDF(fileName).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
        },
        error: (err) => {
          console.error("❌ Error al visualizar PDF:", err);
        }
      });
    }
  }
}
