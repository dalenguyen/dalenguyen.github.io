import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgFormsComponent } from './ng-forms.component';

describe('NgFormsComponent', () => {
  let component: NgFormsComponent;
  let fixture: ComponentFixture<NgFormsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgFormsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NgFormsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
