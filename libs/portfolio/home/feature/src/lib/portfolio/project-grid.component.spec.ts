import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ProjectGridComponent } from './project-grid.component'
import { PORTFOLIO_ITEMS } from './projects.data'

declare const describe: any
declare const beforeEach: any
declare const it: any
declare const expect: any

describe('ProjectGridComponent', () => {
  let component: ProjectGridComponent
  let fixture: ComponentFixture<ProjectGridComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectGridComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(ProjectGridComponent)
    component = fixture.componentInstance
    component.items = PORTFOLIO_ITEMS.slice(0, 2)
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('renders one card per item', () => {
    const links = fixture.nativeElement.querySelectorAll('a[target="_blank"]')
    expect(links.length).toBe(2)
  })
})
