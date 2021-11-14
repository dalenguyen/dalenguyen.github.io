import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { PortfolioComponent } from './portfolio.component'

describe('PortfolioComponent', () => {
  let component: PortfolioComponent
  let fixture: ComponentFixture<PortfolioComponent>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [PortfolioComponent],
        imports: [HttpClientTestingModule],
      }).compileComponents()
    }),
  )

  beforeEach(() => {
    fixture = TestBed.createComponent(PortfolioComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
