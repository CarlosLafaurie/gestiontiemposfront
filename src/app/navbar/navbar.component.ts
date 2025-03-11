import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  imports: [CommonModule]
})
export class NavbarComponent implements OnInit {
  isAdminFlag: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    // Verifica que el cargo sea "admin" (ignorando mayúsculas)
    this.isAdminFlag = userData && userData.cargo.toLowerCase() === 'admin';
  }

  home(): void {
    this.router.navigate(['/home']);
  }

  panel(): void {
    this.router.navigate(['/panel-control']);
  }

  isAdmin(): boolean {
    return this.isAdminFlag;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
