import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoginResponse } from '../types/login-response.type';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private loginUrl = '/api/usuarios/login'; 
  
  constructor(private httpClient: HttpClient) { }

  login(name: string, password: string) {
    return this.httpClient.post<LoginResponse>(this.loginUrl, { Cedula: name, Contrasena: password }).pipe(
      tap((value) => {
        sessionStorage.setItem("auth-token", value.token);
        sessionStorage.setItem("user-name", value.name);
      })
    );
  }

  getToken(): string | null {
    return sessionStorage.getItem("auth-token");
  }

  isAuthenticated(): boolean {
    return !!this.getToken();  
  }

  logout(): void {
    sessionStorage.removeItem("auth-token");
    sessionStorage.removeItem("user-name");
  }
}
