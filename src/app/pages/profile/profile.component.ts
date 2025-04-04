import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { NavbarComponent } from "../../navbar/navbar.component";
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  private userService = inject(UserService);

  ngOnInit(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('No se encontró token en localStorage');
      return;
    }

    try {
      const decoded: any = jwtDecode(token);

      const userIdString = decoded.id || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
      const userId = parseInt(userIdString, 10);

      if (isNaN(userId)) {
        return;
      }

      this.userService.getUserById(userId).subscribe({
        next: (data) => {
          this.user = data;
        },
        error: (err) => {
          console.error('Error al cargar el perfil:', err);
        }
      });

    } catch (error) {
      console.error('Error al decodificar el token:', error);
    }
  }
}
