import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { PostService } from './post.service'

describe('PostService', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [HttpClientTestingModule] }))

  it('should be created', () => {
    const service: PostService = TestBed.get(PostService)
    expect(service).toBeTruthy()
  })
})
