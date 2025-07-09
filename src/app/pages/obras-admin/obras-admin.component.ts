import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ObraService, Obra } from '../../services/obras.service';
import { UserService } from '../../services/user.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { User } from '../../services/user.service';

@Component({
  selector: 'app-obras-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './obras-admin.component.html',
  styleUrls: ['./obras-admin.component.css']
})
export class ObrasAdminComponent implements OnInit {
  obras: Obra[] = [];
  obrasFiltrados: Obra[] = [];
  responsables: (User | null)[] = [];

  responsablesSecundarios: { id: number | null; nombre: string }[] = [];
  clientes: { id: number | null; nombre: string }[] = [];
  searchQuery: string = '';
  estadoSeleccionado: 'activo' | 'inactivo' | 'todos' = 'activo';

  mostrarFormulario = false;
  esEdicion = false;
  obraActual: Omit<Obra, 'id'> & { id?: number; responsableSecundario?: string } = {
    id: undefined,
    nombreObra: '',
    responsable: null,
    responsableSecundario: 'Sin responsable Secundario',
    clienteObra: 'Sin cliente',
    estado: 'Activo',
    costoObra: 0,
    ubicacion: 'sin definir'
  };

  private obraService = inject(ObraService);
  private userService = inject(UserService);

  ngOnInit(): void {
    this.cargarObrasPorEstado();
    this.cargarResponsables();
    this.cargarClientes();
  }

  cargarObrasPorEstado(): void {
  if (this.estadoSeleccionado.toLowerCase() === 'activo') {
    this.obraService.getObras().subscribe({
      next: (data) => {
        this.obras = data;
        this.filtrarObras();
      },
      error: (err) => console.error('❌ Error al obtener obras activas:', err)
    });
  } else if (this.estadoSeleccionado.toLowerCase() === 'inactivo') {
    this.obraService.getObrasInactivas().subscribe({
      next: (data) => {
        this.obras = data;
        this.filtrarObras();
      },
      error: (err) => console.error('❌ Error al obtener obras inactivas:', err)
    });
  } else {
    this.obraService.getObras().subscribe({
      next: (activas) => {
        this.obraService.getObrasInactivas().subscribe({
          next: (inactivas) => {
            this.obras = [...activas, ...inactivas];
            this.filtrarObras();
          },
          error: (err) => console.error('❌ Error al obtener inactivas:', err)
        });
      },
      error: (err) => console.error('❌ Error al obtener activas:', err)
    });
  }
}


  cargarResponsables(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        const listaResponsables = data
          .filter(user => user.rol && user.rol.toLowerCase() === 'responsable')
          .map(user => ({
            id: user.id,
            nombre: user.nombreCompleto || 'Nombre no disponible'
          }));
      this.responsables = [null, ...data
        .filter(user => user.rol?.toLowerCase() === 'responsable')
      ];
        this.responsablesSecundarios = [{ id: null, nombre: 'Sin responsable Secundario' }, ...listaResponsables];
      },
      error: (err) => console.error('❌ Error al obtener responsables:', err)
    });
  }

  cargarClientes(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        const listaClientes = data.filter(user => user.rol && user.rol.toLowerCase() === 'cliente')
          .map(user => ({
            id: user.id,
            nombre: user.nombreCompleto || 'Nombre no disponible'
          }));
        this.clientes = [{ id: null, nombre: 'Sin cliente' }, ...listaClientes];
        if (!this.obraActual.clienteObra) {
          this.obraActual.clienteObra = 'Sin cliente';
        }
      },
      error: (err) => console.error('❌ Error al obtener clientes:', err)
    });
  }

 filtrarObras(): void {
  const q = this.searchQuery.toLowerCase();
    this.obrasFiltrados = this.obras.filter(u => {
      const coincideBusqueda =
        (!this.searchQuery ||
          (u.nombreObra && u.nombreObra.toLowerCase().includes(q)) ||
          (u.responsable?.nombreCompleto?.toLowerCase().includes(q)) ||
          (u.responsableSecundario && u.responsableSecundario.toLowerCase().includes(q)) ||
          (u.clienteObra && u.clienteObra.toLowerCase().includes(q)));
      const coincideEstado =
        this.estadoSeleccionado === 'todos' ||
        (u.estado?.toLowerCase() === this.estadoSeleccionado.toLowerCase());

      return coincideBusqueda && coincideEstado;
    });
  }

  eliminarObra(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta obra?')) {
      this.obraService.deleteObra(id).subscribe({
        next: () => {
          console.log(`Obra eliminada`);
          this.obras = this.obras.filter(obra => obra.id !== id);
          this.filtrarObras();
        },
        error: (err) => console.error('❌ Error al eliminar obra:', err)
      });
    }
  }

  mostrarFormularioObra(obra: Obra | null = null): void {
    this.mostrarFormulario = true;
    this.esEdicion = !!obra;

    if (obra) {
      this.obraActual = {
        ...obra,
        responsable: obra.responsable ?? null,
        responsableSecundario: obra.responsableSecundario || 'Sin responsable Secundario',
        clienteObra: obra.clienteObra || 'Sin cliente'
      };
    } else {
      this.obraActual = {
        id: undefined,
        nombreObra: '',
        responsable: null, // ✅
        responsableSecundario: 'Sin responsable Secundario',
        clienteObra: 'Sin cliente',
        estado: 'Activo',
        costoObra: 0,
        ubicacion: 'sin definir'
      };
    }
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.obraActual = {
      id: undefined,
      nombreObra: '',
      responsable: null, // ✅
      responsableSecundario: 'Sin responsable Secundario',
      clienteObra: 'Sin cliente',
      estado: 'Activo',
      costoObra: 0,
      ubicacion: 'sin definir'
    };
  }

  cargarObrasInactivas(): void {
    this.obraService.getObrasInactivas().subscribe({
      next: (data) => {
        this.obras = data;
        this.filtrarObras();
      },
      error: (err) => console.error('❌ Error al obtener obras inactivas:', err)
    });
  }

  guardarObra(): void {
    if (!this.obraActual.nombreObra) {
      console.error('❌ El nombre de la obra es obligatorio');
      return;
    }

    this.obraActual.estado = this.obraActual.estado || "Activo";

    if (this.obraActual.costoObra < 0) {
      console.error('❌ El costo de la obra no puede ser negativo');
      return;
    }

    if (this.esEdicion) {
      const obraAEnviar: Obra = {
        id: this.obraActual.id ?? 0,
        nombreObra: this.obraActual.nombreObra,
        responsable: this.obraActual.responsable,
        clienteObra: this.obraActual.clienteObra,
        estado: this.obraActual.estado,
        costoObra: this.obraActual.costoObra,
        ubicacion: this.obraActual.ubicacion,
        responsableSecundario: this.obraActual.responsableSecundario
      };
      (obraAEnviar as any).responsableSecundario = this.obraActual.responsableSecundario;
      this.obraService.editObra(obraAEnviar.id, obraAEnviar).subscribe({
        next: () => {
          console.log('✅ Obra actualizada correctamente');
          this.cargarObrasPorEstado();
          this.cerrarFormulario();
        },
        error: (error) => {
          console.error('❌ Error al actualizar obra:', error);
          alert('Hubo un error al actualizar la obra. Intenta nuevamente.');
        }
      });
    } else {
      const obraNueva: Omit<Obra, 'id'> = {
        nombreObra: this.obraActual.nombreObra,
        responsable: this.obraActual.responsable,
        clienteObra: this.obraActual.clienteObra,
        estado: "activo",
        costoObra: this.obraActual.costoObra,
        ubicacion: this.obraActual.ubicacion,
        responsableSecundario: this.obraActual.responsableSecundario
      };
      (obraNueva as any).responsableSecundario = this.obraActual.responsableSecundario;
      this.obraService.createObra(obraNueva).subscribe({
        next: () => {
          console.log('✅ Obra agregada correctamente');
          this.cargarObrasPorEstado ();
          this.cerrarFormulario();
        },
        error: (error) => {
          console.error('❌ Error al agregar obra:', error);
          alert('Hubo un error al agregar la obra. Intenta nuevamente.');
        }
      });
    }
  }
}
