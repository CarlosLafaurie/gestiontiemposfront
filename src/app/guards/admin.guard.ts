import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const userData = authService.getUserData();
  if (userData && userData.rol.toLowerCase() === 'admin') {
    return true;
  } else {
    router.navigate(['/home']);
    return false;
  }
};
