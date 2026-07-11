import { ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { PortfolioComponent } from './portfolio.component'

declare const describe: any
declare const beforeEach: any
declare const it: any
declare const expect: any

describe('PortfolioComponent', () => {
  let component: PortfolioComponent
  let fixture: ComponentFixture<PortfolioComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioComponent, RouterTestingModule],
    }).compileComponents()

    fixture = TestBed.createComponent(PortfolioComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('shows only the 4 featured projects', () => {
    expect(component.featured.length).toBe(4)
    expect(component.featured.every((p) => p.featured)).toBe(true)
  })

  it('links to the full projects page', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[href="/projects"]')
    expect(link).toBeTruthy()
  })
})
