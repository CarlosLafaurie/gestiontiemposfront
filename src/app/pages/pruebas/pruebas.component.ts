import { Component, OnInit, inject} from '@angular/core';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pruebas',
  imports: [NavbarComponent, BotonRegresarComponent, CommonModule],
  templateUrl: './pruebas.component.html',
  styleUrl: './pruebas.component.css'
})
export class PruebasComponent {

  private router = inject(Router);

  irAEmpleadosAdmin(): void {
    this.router.navigate(['/empleado-admin']).then(success => {
    });
  }

}
