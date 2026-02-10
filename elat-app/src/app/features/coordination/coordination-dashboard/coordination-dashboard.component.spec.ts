import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoordinationDashboardComponent } from './coordination-dashboard.component';

describe('CoordinationDashboardComponent', () => {
  let component: CoordinationDashboardComponent;
  let fixture: ComponentFixture<CoordinationDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoordinationDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoordinationDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
