import { Injectable, inject, NgZone } from '@angular/core';
import { AuthService } from './auth.service';
import { fromEvent, merge, Subject, timer } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InactivityService {
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);

  // Default timeout: 60 minutes
  private readonly TIMEOUT_MS = 60 * 60 * 1000;
  
  private stop$ = new Subject<void>();

  constructor() {}

  /**
   * Starts monitoring user activity.
   * Only monitors if the user is authenticated.
   */
  startMonitoring() {
    this.stopMonitoring();

    // Activities we monitor to reset the timer
    const activityEvents$ = merge(
      fromEvent(window, 'mousemove'),
      fromEvent(window, 'mousedown'),
      fromEvent(window, 'keypress'),
      fromEvent(window, 'touchstart'),
      fromEvent(window, 'scroll')
    );

    // Run outside Angular zone for performance (avoids triggering change detection on every move)
    this.ngZone.runOutsideAngular(() => {
      activityEvents$.pipe(
        // Each activity resets the timer
        switchMap(() => timer(this.TIMEOUT_MS)),
        takeUntil(this.stop$)
      ).subscribe(() => {
        // Run back in Angular zone to perform the logout
        this.ngZone.run(() => {
          if (this.authService.isAuthenticated()) {
            console.log(`[SESSION] User inactive for ${this.TIMEOUT_MS / 1000 / 60}m. Auto-logout triggered.`);
            this.authService.logout();
          }
        });
      });
    });
  }

  stopMonitoring() {
    this.stop$.next();
  }
}
