import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatroomListComponent } from './chatroom-list.component';

describe('ChatroomListComponent', () => {
  let component: ChatroomListComponent;
  let fixture: ComponentFixture<ChatroomListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChatroomListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatroomListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
