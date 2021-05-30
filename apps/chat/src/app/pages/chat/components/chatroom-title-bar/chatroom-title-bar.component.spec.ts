import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatroomTitleBarComponent } from './chatroom-title-bar.component';

describe('ChatroomTitleBarComponent', () => {
  let component: ChatroomTitleBarComponent;
  let fixture: ComponentFixture<ChatroomTitleBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChatroomTitleBarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatroomTitleBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
