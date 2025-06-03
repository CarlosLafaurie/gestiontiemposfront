import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-boton-regresar',
  imports: [],
  templateUrl: './boton-regresar.component.html',
  styleUrl: './boton-regresar.component.css'
})
export class BotonRegresarComponent {
constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
