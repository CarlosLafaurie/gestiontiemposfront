import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { TiempoAusentismo, AusentismoService } from '../../services/documento-permiso.service';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

@Component({
  selector: 'app-permisos-admin',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FormsModule, BotonRegresarComponent],
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
        (doc.fechaInicio && doc.fechaInicio.toLowerCase().includes(q)) ||
        (doc.fechaFin && doc.fechaFin.toLowerCase().includes(q))
      );
    }
  }

  editar(documento: TiempoAusentismo): void {
    this.documentoEditando = { ...documento };
  }

  guardarCambios(): void {
    if (this.documentoEditando?.id) {
      // Crear un nuevo objeto FormData
      const formData = new FormData();

      // Añadir los datos de TiempoAusentismo al FormData
      formData.append('nombreEmpleado', this.documentoEditando.nombreEmpleado);
      formData.append('comentarios', this.documentoEditando.comentarios);
      if (this.documentoEditando.permisosEspeciales) {
        formData.append('permisosEspeciales', this.documentoEditando.permisosEspeciales);
      }
      formData.append('fechaInicio', this.documentoEditando.fechaInicio);
      formData.append('fechaFin', this.documentoEditando.fechaFin);
      if (this.documentoEditando.rutaDocumento) {
        formData.append('rutaDocumento', this.documentoEditando.rutaDocumento);
      }
      // Si tienes un archivo que enviar, puedes agregarlo de la siguiente forma:
      if (this.documentoEditando.archivo) {
        formData.append('archivo', this.documentoEditando.archivo, this.documentoEditando.archivo.name);
      }

      // Ahora, pasamos el FormData al servicio
      this.ausentismoService.actualizarDocumento(this.documentoEditando.id, formData).subscribe({
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
