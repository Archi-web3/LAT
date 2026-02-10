import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentInitComponent } from './assessment-init.component';

describe('AssessmentInitComponent', () => {
  let component: AssessmentInitComponent;
  let fixture: ComponentFixture<AssessmentInitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentInitComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssessmentInitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
