import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatrixViewComponent } from './matrix-view.component';

describe('MatrixViewComponent', () => {
  let component: MatrixViewComponent;
  let fixture: ComponentFixture<MatrixViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatrixViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatrixViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
