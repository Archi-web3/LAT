import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { User } from '../auth/auth.service';

import { environment } from '../../../environments/environment';
import { DEFAULT_CONFIG } from '../../models/admin-config.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/users`;
  private configUrl = `${environment.apiUrl}/api/config`;



  users = signal<User[]>([]);
  config = signal<any>(null); // Holds global app config (settings)

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders().set('x-auth-token', token || '')
    };
  }

  // --- Config Methods ---
  getConfig() {
    return this.http.get<any>(this.configUrl).pipe(
      tap(cfg => {
        if (cfg) { // Check if cfg is not null/undefined
          // Merge backend config with default config to ensure new fields (like transversalExpertises) are present
          // If cfg.settings exists use it, otherwise use cfg itself or empty object
          const settings = cfg.settings || cfg;
          const mergedConfig = { ...DEFAULT_CONFIG, ...settings };

          // Ensure nested arrays/objects are also merged if needed, or at least present
          if (!mergedConfig.transversalExpertises) {
            mergedConfig.transversalExpertises = DEFAULT_CONFIG.transversalExpertises;
          }

          this.config.set(mergedConfig);
        } else {
          this.config.set(DEFAULT_CONFIG);
        }
      }),
      catchError(err => {
        console.error('Failed to load config from backend, using default:', err);
        this.config.set(DEFAULT_CONFIG);
        return of(DEFAULT_CONFIG);
      })
    );
  }

  saveConfig(config: any) {
    return this.http.post<any>(this.configUrl, config, this.getHeaders());
  }

  // Import Users (CSV Data as JSON)
  importUsers(users: any[]) {
    return this.http.post<any>(`${this.apiUrl}/import`, users, this.getHeaders()).pipe(
      tap(() => this.getUsers().subscribe()) // Refresh list
    );
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
