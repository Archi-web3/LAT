import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionDashboardComponent } from './action-dashboard.component';

describe('ActionDashboardComponent', () => {
  let component: ActionDashboardComponent;
  let fixture: ComponentFixture<ActionDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActionDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
