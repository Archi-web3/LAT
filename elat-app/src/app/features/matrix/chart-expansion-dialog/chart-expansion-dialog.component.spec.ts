import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartExpansionDialogComponent } from './chart-expansion-dialog.component';

describe('ChartExpansionDialogComponent', () => {
  let component: ChartExpansionDialogComponent;
  let fixture: ComponentFixture<ChartExpansionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartExpansionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartExpansionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
