import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [ReactiveFormsModule, CommonModule],
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      cedula: ['', [Validators.required]],
      contrasena: ['', [Validators.required]],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {

        if (response?.token) {
          this.authService.saveToken(response.token);
          console.log("Token guardado correctamente.");
          this.router.navigate(['/home']);
        } else {
          console.error("Error: No se recibió token en la respuesta.");
          alert('Error en la autenticación. Intenta nuevamente.');
        }
      },
      error: (err) => {
        console.error('Error en login:', err);
        alert('Credenciales incorrectas');
      },
    });
  }
}
