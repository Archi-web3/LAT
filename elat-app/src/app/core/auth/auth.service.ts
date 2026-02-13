import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface User {
  id: string;
  name: string;
  role: string;
  assignedCountry?: string;
  assignedBase?: string;
  assignedCountries?: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Determine API URL based on environment
  private apiUrl = `${environment.apiUrl}/api/auth`;

  // Signals for reactive UI
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor() {
    this.checkToken();
  }

  // Load user from local storage on startup
  private checkToken() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      this.currentUser.set(JSON.parse(user));
      this.isAuthenticated.set(true);
    }
  }

  login(credentials: any) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        this.setSession(res);
      })
    );
  }

  register(data: any) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(res => {
        this.setSession(res);
      })
    );
  }

  // Change Password
  changePassword(data: any) {
    const token = localStorage.getItem('token');
    return this.http.put<{ msg: string }>(`${this.apiUrl}/profile`, data, {
      headers: { 'x-auth-token': token || '' }
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  private setSession(authResult: AuthResponse) {
    localStorage.setItem('token', authResult.token);
    localStorage.setItem('user', JSON.stringify(authResult.user));
    this.currentUser.set(authResult.user);
    this.isAuthenticated.set(true);
    this.router.navigate(['/assessment/list']);
  }
}
