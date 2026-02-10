import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentLayoutComponent } from './assessment-layout.component';

describe('AssessmentLayoutComponent', () => {
  let component: AssessmentLayoutComponent;
  let fixture: ComponentFixture<AssessmentLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssessmentLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
