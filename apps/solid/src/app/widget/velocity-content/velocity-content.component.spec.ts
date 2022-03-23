import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VelocityContentComponent } from './velocity-content.component';

describe('VelocityContentComponent', () => {
  let component: VelocityContentComponent;
  let fixture: ComponentFixture<VelocityContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VelocityContentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VelocityContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
