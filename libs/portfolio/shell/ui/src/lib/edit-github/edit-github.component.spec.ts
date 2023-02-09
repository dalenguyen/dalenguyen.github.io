import { ComponentFixture, TestBed } from '@angular/core/testing'

import { EditGithubComponent } from './edit-github.component'

describe('EditGithubComponent', () => {
  let component: EditGithubComponent
  let fixture: ComponentFixture<EditGithubComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditGithubComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(EditGithubComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
