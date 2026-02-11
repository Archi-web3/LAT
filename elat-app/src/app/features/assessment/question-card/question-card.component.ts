import { Component, Input, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AssessmentQuestion, AssessmentOption } from '../../../models/assessment.model';
import { AssessmentService } from '../../../services/assessment.service';
import { CloudinaryService } from '../../../services/cloudinary.service';
import { LocalizePipe } from '../../../core/i18n/localize.pipe';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AdminService } from '../../../core/admin/admin.service';

@Component({
  selector: 'app-question-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatRadioModule,
    MatSliderModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    LocalizePipe,
    TranslatePipe
  ],
  template: `
    <mat-card class="question-card" [ngClass]="getStatusClass()">
      <mat-card-header>
        <mat-card-title>{{ question | localize:'text' }}</mat-card-title>
        <mat-card-subtitle *ngIf="question.category">{{ question | localize:'category' }}</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="verification-text" *ngIf="question.verification">
          <strong>Verification:</strong> {{ question | localize:'verification' }}
        </div>

        <div class="tags" *ngIf="question.transversalTags.length > 0">
          <mat-chip-set>
            <mat-chip *ngFor="let tag of question.transversalTags" class="tag-chip">
                {{ getExpertiseLabel(tag) }}
            </mat-chip>
          </mat-chip-set>
        </div>

        <div class="answer-section">
            <mat-radio-group [ngModel]="answer()" (ngModelChange)="selectOption($event)" class="radio-group" [disabled]="readonly">
                @for (opt of question.options; track opt.value) {
                    <mat-radio-button [value]="opt.value" [style.color]="opt.color">
                        {{ opt | localize:'label' }}
                    </mat-radio-button>
                }
            </mat-radio-group>
        </div>

        <!-- Evidence Section -->
         <div class="evidence-section">
            <h3>{{ 'QUESTION_CARD.EVIDENCE_TITLE' | translate }}</h3>
            
            <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ 'QUESTION_CARD.LINK_LABEL' | translate }}</mat-label>
                <input matInput [ngModel]="proofLink()" (ngModelChange)="updateLink($event)" placeholder="https://..." [disabled]="readonly">
                <mat-icon matSuffix>link</mat-icon>
            </mat-form-field>

            <div class="photo-upload">
                <button mat-stroked-button color="primary" (click)="fileInput.click()" [disabled]="readonly || isUploading()">
                    <mat-icon>camera_alt</mat-icon> 
                    {{ (proofPhoto() ? 'QUESTION_CARD.CHANGE_PHOTO' : 'QUESTION_CARD.ADD_PHOTO') | translate }}
                </button>
                <input #fileInput type="file" accept="image/*" (change)="onPhotoSelected($event)" style="display: none;">
                
                <span *ngIf="isUploading()" class="uploading-text">{{ 'QUESTION_CARD.UPLOADING' | translate }}</span>
            </div>
            
            <mat-progress-bar *ngIf="isUploading()" mode="indeterminate"></mat-progress-bar>

            <!-- Photo Preview -->
            <div *ngIf="proofPhoto()" class="photo-preview">
                <img [src]="proofPhoto()" alt="Proof">
                <button mat-icon-button color="warn" (click)="removePhoto()" [disabled]="readonly" class="remove-btn">
                    <mat-icon>delete</mat-icon>
                </button>
            </div>
         </div>

        <mat-form-field appearance="outline" class="comment-field">
          <mat-label>{{ 'QUESTION_CARD.COMMENTS_LABEL' | translate }}</mat-label>
          <textarea matInput [ngModel]="comment()" (ngModelChange)="updateComment($event)" [placeholder]="'QUESTION_CARD.COMMENTS_PLACEHOLDER' | translate" rows="2" [disabled]="readonly"></textarea>
        </mat-form-field>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .question-card {
      margin-bottom: 24px;
      border-left: 6px solid #ccc;
      transition: border-color 0.3s;
    }
    .question-card.status-high { border-left-color: #4caf50; }
    .question-card.status-med { border-left-color: #ff9800; }
    .question-card.status-low { border-left-color: #f44336; }
    .question-card.status-na { border-left-color: #9e9e9e; }

    .verification-text {
      font-style: italic;
      color: #555;
      margin: 12px 0;
      background: #e3f2fd;
      padding: 12px;
      border-radius: 4px;
      border-left: 4px solid #2196f3;
    }
    .tags { margin-bottom: 16px; }
    .answer-section {
      margin-top: 16px;
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
    }
    .radio-group { display: flex; flex-direction: column; gap: 12px; }
    
    .evidence-section {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #eee;
    }
    .full-width { width: 100%; }
    
    .photo-upload { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .photo-preview { 
        position: relative; 
        display: inline-block; 
        margin-top: 10px; 
        border: 1px solid #ccc;
        border-radius: 4px;
        overflow: hidden;
    }
    .photo-preview img { max-height: 150px; display: block; }
    .remove-btn { 
        position: absolute; 
        top: 0; 
        right: 0; 
        background: rgba(255,255,255,0.8); 
    }

    .comment-field { width: 100%; margin-top: 16px; }
  `]
})
export class QuestionCardComponent {
  @Input({ required: true }) question!: AssessmentQuestion;
  @Input() readonly: boolean = false;

  assessmentService = inject(AssessmentService);
  cloudinaryService = inject(CloudinaryService);
  adminService = inject(AdminService);
  translationService = inject(TranslationService);

  // Signals for current values
  answer = computed(() => this.assessmentService.answers()[this.question.id]);
  comment = computed(() => this.assessmentService.comments()[this.question.id] || '');
  proofLink = computed(() => this.assessmentService.proofLinks()[this.question.id] || '');
  proofPhoto = computed(() => this.assessmentService.proofPhotos()[this.question.id] || '');

  // Local state for upload indicator
  isUploading = signal(false);

  getStatusClass() {
    const val = this.answer();
    if (val === undefined || val === null) return '';
    if (val < 0) return 'status-na';
    if (val >= 0.8) return 'status-high';
    if (val >= 0.5) return 'status-med';
    return 'status-low';
  }

  selectOption(value: number) {
    if (this.readonly) return;
    if (this.answer() === value) {
      this.assessmentService.setAnswer(this.question.id, null as any);
    } else {
      this.assessmentService.setAnswer(this.question.id, value);
    }
  }

  updateComment(value: string) {
    this.assessmentService.setComment(this.question.id, value);
  }

  updateLink(value: string) {
    this.assessmentService.setProofLink(this.question.id, value);
  }

  async onPhotoSelected(event: any) {
    if (this.readonly) return;
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading.set(true);

    try {
      const resizedBlob = await this.resizeImage(file);

      // Convert to Base64 for Instant Proof
      const reader = new FileReader();
      reader.readAsDataURL(resizedBlob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        this.assessmentService.setProofPhoto(this.question.id, base64data);

        if (navigator.onLine) {
          this.uploadToCloudinary(resizedBlob);
        } else {
          this.isUploading.set(false);
        }
      };
    } catch (err) {
      console.error('Photo processing error', err);
      this.isUploading.set(false);
    }
  }

  uploadToCloudinary(blob: Blob) {
    const file = new File([blob], 'proof.jpg', { type: 'image/jpeg' });
    this.cloudinaryService.uploadPhoto(file).subscribe({
      next: (url) => {
        console.log('Uploaded to Cloudinary:', url);
        this.assessmentService.setProofPhoto(this.question.id, url);
        this.isUploading.set(false);
      },
      error: (err) => {
        console.error('Upload failed, keeping Base64', err);
        this.isUploading.set(false);
      }
    });
  }

  removePhoto() {
    if (this.readonly) return;
    this.assessmentService.setProofPhoto(this.question.id, '');
  }

  resizeImage(file: File): Promise<Blob> {

    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e: any) => img.src = e.target.result;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxWidth = 800;
        const scale = maxWidth / img.width;

        if (scale < 1) {
          canvas.width = maxWidth;
          canvas.height = img.height * scale;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject('Canvas error');
        }, 'image/jpeg', 0.7);
      };
      img.onerror = reject;
    });
  }

  getExpertiseLabel(tag: string): string {
    const config = this.adminService.config();

    // Safety check: if config not loaded yet, return tag
    if (!config || !config.transversalExpertises) return tag;

    // Find expertise by ID or Label FR (backward compatibility)
    const expertise = config.transversalExpertises.find((e: any) => e.label_fr === tag || e.id === tag);

    if (!expertise) return tag;

    const lang = this.translationService.currentLang();
    return lang === 'FR' ? expertise.label_fr : (expertise.label_en || expertise.label_fr);
  }
}
