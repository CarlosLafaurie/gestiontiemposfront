import { Component } from '@angular/core';
import { APP_VERSION } from '../../environments/version';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
version = APP_VERSION;
}
