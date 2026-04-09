import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {
  private platformId = inject(PLATFORM_ID);
  
  // Reactive signal for online status
  isOnline = signal<boolean>(true);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Set initial state
      this.isOnline.set(navigator.onLine);

      // Listen for changes
      window.addEventListener('online', () => {
        console.log('🌐 App is back online');
        this.isOnline.set(true);
      });

      window.addEventListener('offline', () => {
        console.log('🔌 App is offline');
        this.isOnline.set(false);
      });
    }
  }
}
