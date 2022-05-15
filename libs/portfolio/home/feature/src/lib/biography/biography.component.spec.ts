import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BiographyComponent } from './biography.component';

describe('BiographyComponent', () => {
  let component: BiographyComponent;
  let fixture: ComponentFixture<BiographyComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BiographyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BiographyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
