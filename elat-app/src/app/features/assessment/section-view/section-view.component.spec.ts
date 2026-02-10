import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionViewComponent } from './section-view.component';

describe('SectionViewComponent', () => {
  let component: SectionViewComponent;
  let fixture: ComponentFixture<SectionViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SectionViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
