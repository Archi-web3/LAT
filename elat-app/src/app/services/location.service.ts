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

    // 1. Try Local Cache first
    const cached = localStorage.getItem('elat-locations-cache');
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (Array.isArray(data) && data.length > 0) {
          console.log('Loaded locations from Local Cache');
          this.countries.set(data.sort((a: Country, b: Country) => a.name.localeCompare(b.name)));
          this.loading.set(false);
        }
      } catch (e) {
        console.error('Failed to parse cached locations', e);
      }
    }

    // 2. Fetch from asset (updates cache)
    this.http.get<Country[]>(this.dataUrl).pipe(
      tap(data => {
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
        this.countries.set(sorted);
        localStorage.setItem('elat-locations-cache', JSON.stringify(sorted));
        this.loading.set(false);
      }),
      catchError(err => {
        console.error('Failed to load locations from asset', err);
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
