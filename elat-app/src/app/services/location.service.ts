import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface Base {
  code: string;
  name: string;
  type: string;
}

export interface Country {
  code: string;
  name: string;
  bases: Base[];
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private http = inject(HttpClient);
  private dataUrl = 'assets/data/locations.json';

  // Signals for state
  countries = signal<Country[]>([]);
  loading = signal<boolean>(false);

  constructor() {
    this.loadLocations();
  }

  private loadLocations() {
    this.loading.set(true);
    this.http.get<Country[]>(this.dataUrl).pipe(
      tap(data => {
        this.countries.set(data.sort((a, b) => a.name.localeCompare(b.name)));
        this.loading.set(false);
      }),
      catchError(err => {
        console.error('Failed to load locations', err);
        this.loading.set(false);
        return of([]);
      })
    ).subscribe();
  }

  getBasesForCountry(countryCode: string): Base[] {
    const country = this.countries().find(c => c.code === countryCode);
    return country ? country.bases.sort((a, b) => a.name.localeCompare(b.name)) : [];
  }
}
