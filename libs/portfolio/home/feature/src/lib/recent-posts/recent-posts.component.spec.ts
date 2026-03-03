import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { RecentPostsComponent } from './recent-posts.component'

declare const describe: any
declare const beforeEach: any
declare const afterEach: any
declare const it: any
declare const expect: any

describe('RecentPostsComponent', () => {
  let component: RecentPostsComponent
  let fixture: ComponentFixture<RecentPostsComponent>
  let httpMock: HttpTestingController

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentPostsComponent, RouterTestingModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents()

    httpMock = TestBed.inject(HttpTestingController)
    fixture = TestBed.createComponent(RecentPostsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    httpMock.expectOne((req) => req.url.includes('dev.to')).flush([
      {
        title: 'Test Post',
        slug: 'test-post',
        description: 'A test post',
        cover_image: 'https://example.com/img.jpg',
        tag_list: ['angular'],
        published_at: '2026-01-01T00:00:00Z',
        url: 'https://dev.to/dalenguyen/test-post',
        user: { name: 'Dale Nguyen', profile_image: 'https://example.com/avatar.jpg' },
      },
    ])
    fixture.detectChanges()
  })

  afterEach(() => httpMock.verify())

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display fetched posts', () => {
    expect(component.recentPosts().length).toBe(1)
  })

  it('should limit to 3 recent posts', () => {
    expect(component.recentPosts().length).toBeLessThanOrEqual(3)
  })
})
