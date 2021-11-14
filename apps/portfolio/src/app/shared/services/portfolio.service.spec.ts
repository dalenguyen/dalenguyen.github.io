import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { PortfolioService } from './portfolio.service'

describe('PortfolioService', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [HttpClientTestingModule] }))

  it('should be created', () => {
    const service: PortfolioService = TestBed.get(PortfolioService)
    expect(service).toBeTruthy()
  })
})
