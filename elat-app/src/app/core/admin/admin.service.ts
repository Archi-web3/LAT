import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { User } from '../auth/auth.service';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/users`;
  private configUrl = `${environment.apiUrl}/api/config`;

  users = signal<User[]>([]);

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders().set('x-auth-token', token || '')
    };
  }

  // --- Config Methods ---
  getConfig() {
    return this.http.get<any>(this.configUrl);
  }

  saveConfig(config: any) {
    return this.http.post<any>(this.configUrl, config, this.getHeaders());
  }


  getUsers() {
    return this.http.get<User[]>(this.apiUrl, this.getHeaders()).pipe(
      tap(users => this.users.set(users))
    );
  }

  createUser(userData: any) {
    return this.http.post<User>(this.apiUrl, userData, this.getHeaders()).pipe(
      tap(() => this.getUsers().subscribe()) // Refresh list
    );
  }

  updateUser(id: string, userData: any) {
    return this.http.put<User>(`${this.apiUrl}/${id}`, userData, this.getHeaders()).pipe(
      tap(() => this.getUsers().subscribe())
    );
  }

  deleteUser(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders()).pipe(
      tap(() => {
        this.users.update(users => users.filter(u => u.id !== id));
      })
    );
  }
}
