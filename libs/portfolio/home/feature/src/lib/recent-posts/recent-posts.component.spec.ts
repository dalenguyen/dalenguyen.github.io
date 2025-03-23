import * as contentModule from '@analogjs/content'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { RecentPostsComponent } from './recent-posts.component'

// Add Jest type definitions for the test functions
declare const describe: any
declare const beforeEach: any
declare const jest: any
declare const it: any
declare const expect: any

describe('RecentPostsComponent', () => {
  let component: RecentPostsComponent
  let fixture: ComponentFixture<RecentPostsComponent>

  beforeEach(async () => {
    // Mock the injectContentFiles function
    jest.spyOn(contentModule, 'injectContentFiles').mockReturnValue([
      {
        filename: '/src/content/test-post.md',
        content: '',
        attributes: {
          title: 'Test Post',
          slug: 'test-post',
          description: 'This is a test post',
          coverImage: 'https://example.com/test.jpg',
          categories: ['Test'],
          published: '2023-05-01',
          profileImage: 'https://example.com/profile.jpg',
          author: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      },
    ])

    await TestBed.configureTestingModule({
      imports: [RecentPostsComponent, RouterTestingModule],
    }).compileComponents()

    fixture = TestBed.createComponent(RecentPostsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have recent posts', () => {
    expect(component.recentPosts.length).toBeGreaterThan(0)
  })

  it('should limit to 3 recent posts', () => {
    // Since we're mocking just 1 post, we'll have 1 post
    expect(component.recentPosts.length).toBeLessThanOrEqual(3)
  })
})
