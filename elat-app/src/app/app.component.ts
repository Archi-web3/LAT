import { Component, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../environments/environment';
import { InactivityService } from './core/auth/inactivity.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatSnackBarModule],
  template: `
    <router-outlet></router-outlet>
    <div class="version-info" *ngIf="showVersion">
      v{{ appVersion }}
    </div>
  `,
  styles: [`
    .version-info {
      position: fixed;
      bottom: 4px;
      right: 4px;
      background: rgba(0,0,0,0.5);
      color: white;
      padding: 2px 6px;
      font-size: 10px;
      border-radius: 4px;
      z-index: 9999;
      pointer-events: none;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'elat-app';
  appVersion = environment.appVersion;
  showVersion = true;

  private updates = inject(SwUpdate);
  private snackBar = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);
  private inactivityService = inject(InactivityService);

  constructor() { }

  ngOnInit() {
    // Start inactivity monitoring
    if (isPlatformBrowser(this.platformId)) {
        this.inactivityService.startMonitoring();
    }

    if (isPlatformBrowser(this.platformId) && this.updates.isEnabled) {
      this.updates.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(() => {
          this.promptUpdate();
        });
    }
  }

  private promptUpdate() {
    const snack = this.snackBar.open(
      'New version available!',
      'Reload',
      { duration: 0 } // 0 = infinite duration until clicked
    );

    snack.onAction().subscribe(() => {
      this.updates.activateUpdate().then(() => document.location.reload());
    });
  }
}
