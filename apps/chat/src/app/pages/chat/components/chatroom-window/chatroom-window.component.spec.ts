import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatroomWindowComponent } from './chatroom-window.component';

describe('ChatroomWindowComponent', () => {
  let component: ChatroomWindowComponent;
  let fixture: ComponentFixture<ChatroomWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChatroomWindowComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatroomWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
