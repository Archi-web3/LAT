import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';
import { AssessmentService } from '../../../services/assessment.service';
import { LocationService, Base } from '../../../services/location.service';

@Component({
  selector: 'app-assessment-init',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' }
  ],
  templateUrl: './assessment-init.component.html',
  styleUrl: './assessment-init.component.scss'
})
export class AssessmentInitComponent {
  authService = inject(AuthService);
  assessmentService = inject(AssessmentService);
  locationService = inject(LocationService);
  router = inject(Router);

  // Form State
  country = signal('');
  base = signal('');
  date = signal(new Date());
  evaluationMonth = signal(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Available Options
  availableCountries = this.locationService.countries;
  availableBases = computed(() => {
    return this.locationService.getBasesForCountry(this.country());
  });

  constructor() {
    // Use effect to init from role once locations are loaded or user is ready
    effect(() => {
      if (this.authService.currentUser() && this.locationService.countries().length > 0) {
        this.initFromRole();
      }
    }, { allowSignalWrites: true });
  }

  initFromRole() {
    const user = this.authService.currentUser();
    if (!user) return;

    if (user.role === 'USER') {
      // Locked
      this.country.set(user.assignedCountry || '');
      this.base.set(user.assignedBase || '');
    } else if ((user?.role || '').includes('COORDINATOR')) {
      // Locked Country, Open Base
      this.country.set(user.assignedCountry || ((user as any).assignedCountries?.[0] || ''));
    }
  }

  onCountryChange(newCountryCode: string) {
    this.country.set(newCountryCode);
    this.base.set(''); // Reset base when country changes
  }

  canEditCountry(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'SUPER_ADMIN';
  }

  canEditBase(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'SUPER_ADMIN' || (user?.role || '').includes('COORDINATOR');
  }

  contextMessage(): string {
    const user = this.authService.currentUser();
    if (user?.role === 'SUPER_ADMIN') return 'Mode Super Admin: Vous pouvez définir tout le contexte.';
    if ((user?.role || '').includes('COORDINATOR')) return 'Mode Coordinateur: Pays fixe, Base libre.';
    if (user?.role === 'USER') return 'Mode Utilisateur Base: Contexte prédéfini.';
    return '';
  }

  isValid() {
    return this.country() && this.base() && this.date() && this.evaluationMonth();
  }

  resetForm() {
    this.initFromRole();
    this.date.set(new Date());
  }

  startAssessment() {
    const ctx = {
      country: this.country(),
      base: this.base(),
      date: this.date().toISOString(),
      evaluationMonth: this.evaluationMonth()
    };

    // Check if assessment already exists for this Context
    // Use optional chaining just in case
    const existing = this.assessmentService.getAllSavedAssessments().find(a =>
      a.context &&
      a.context.country === ctx.country &&
      a.context.base === ctx.base &&
      a.context.evaluationMonth === ctx.evaluationMonth
    );

    if (existing) {
      if (confirm(`Une évaluation existe déjà pour ${ctx.base} (${ctx.evaluationMonth}). Statut: ${existing.status || 'DRAFT'}.\nVoulez-vous l'ouvrir ?`)) {
        // Resume existing
        if (existing.context) {
          this.assessmentService.initializeAssessment(existing.context);
          this.navigateToSection();
        } else {
          console.error('Snapshot exists but context is missing', existing);
        }
      }
      // If Cancel, do nothing
    } else {
      // Start New
      this.assessmentService.initializeAssessment(ctx);
      this.navigateToSection();
    }
  }

  private navigateToSection() {
    const sections = this.assessmentService.sections();
    if (sections.length > 0) {
      this.router.navigate(['/assessment', sections[0].id]);
    }
  }
}
