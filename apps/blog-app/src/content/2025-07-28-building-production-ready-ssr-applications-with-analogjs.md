---
title: Building Production-Ready SSR Applications with Analog.js - Lessons from TechLeadPilot
slug: 2025-07-28-building-production-ready-ssr-applications-with-analogjs
description: A comprehensive guide to server-side rendering with Angular's modern meta-framework, featuring real-world examples from a job board application
categories: ['angular', 'analogjs', 'ssr', 'firebase', 'typescript', 'nx']
coverImage: https://dalenguyen.me/assets/images/blog/techleadpilot.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-07-28T15:17:31.359Z
author: Dale Nguyen
---

_A comprehensive guide to server-side rendering with Angular's modern meta-framework, featuring real-world examples from a job board application_

## Introduction

Server-side rendering (SSR) has become essential for modern web applications, offering improved SEO, faster initial page loads, and better user experience. While Angular has supported SSR through Angular Universal for years, Analog.js emerges as a compelling alternative that brings the developer experience of modern meta-frameworks like Next.js to the Angular ecosystem.

In this article, I'll share the lessons learned from building [TechLeadPilot.com](https://techleadpilot.com), a job board platform for senior engineers and more, using Analog.js with GCP backend. We'll explore the challenges, solutions, and best practices discovered during the development of complex features like authentication, real-time data fetching, and a comprehensive favorites system.

## What is Analog.js?

Analog.js is a meta-framework for Angular that provides:

- **File-based routing** similar to Next.js
- **Server-side rendering** out of the box
- **API routes** with full-stack capabilities
- **Static site generation** support
- **Vite-powered** build system for fast development

Unlike traditional Angular applications, Analog.js eliminates much of the configuration complexity while maintaining the power and type safety that Angular developers love.

## Project Architecture Overview

TechLeadPilot is built as an Nx monorepo with the following structure:

```bash
techleadpilot/
├── landing/                    # Analog.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── pages/          # File-based routes
│   │   │   ├── services/       # Business logic services
│   │   │   ├── types/          # TypeScript interfaces
│   │   │   └── utils/          # Utility functions
│   │   └── server/             # Server-side API routes
│   ├── vite.config.ts          # Vite configuration
│   └── project.json            # Nx project configuration
├── firestore.rules             # Firebase security rules
└── nx.json                     # Nx workspace configuration
```

### Key Technologies

- **Frontend**: Analog.js (Angular 20)
- **Backend**: Firebase Functions + Firestore
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Monorepo**: Nx

## Setting Up Analog.js with Firebase

### Initial Configuration

The journey begins with configuring Analog.js to work seamlessly with Firebase. Here's the essential setup:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideClientHydration } from '@angular/platform-browser'
import { provideFileRouter } from '@analogjs/router'
import { provideHttpClient } from '@angular/common/http'
import { provideFirebaseApp, initializeApp } from '@angular/fire/app'
import { provideAuth, getAuth } from '@angular/fire/auth'
import { provideFirestore, getFirestore } from '@angular/fire/firestore'
import { firebaseConfig } from './firebase-config'

export const appConfig: ApplicationConfig = {
  providers: [
    provideFileRouter(),
    provideClientHydration(),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
}
```

### Vite Configuration and SSR Troubleshooting

The most challenging aspect was configuring Vite to handle Firebase packages in SSR mode. Here are the critical configuration points:

```typescript
// Key SSR configuration in vite.config.ts
ssr: {
  noExternal: [
    '@angular/fire/**',
    'firebase/**',
    'tslib',
    /^@firebase\//,
  ],
  external: ['rxjs']
}
```

#### Common SSR Errors We Encountered

**1. tslib Destructuring Error**

- **Error**: `Cannot destructure property '__extends' of 'import_tslib.default'`
- **Solution**: Add `'tslib'` to `noExternal` array

**2. RxJS "exports is not defined"**

- **Error**: `ReferenceError: exports is not defined`
- **Solution**: Move RxJS to `external` array instead of `noExternal`

**3. Firebase Module Resolution**

- **Error**: `Module not found: firebase/auth`
- **Solution**: Use regex pattern `/^@firebase\//` to catch all Firebase submodules

#### Key Configuration Strategy

- **noExternal**: Firebase packages that need Vite transformation
- **external**: RxJS works better with Node.js native handling
- **Module resolution**: Use proper ESM conditions for compatibility

**Key Learning**: Understanding which packages need SSR transformation vs. native Node.js handling is critical for Firebase integration.

## File-Based Routing in Practice

Analog.js uses file-based routing similar to Next.js, which significantly simplifies route management:

```bash
pages/
├── (home).page.ts              # Route: /
├── jobs/
│   ├── (job-list).page.ts      # Route: /jobs
│   ├── [jobId].page.ts         # Route: /jobs/:jobId
│   └── [jobId].server.ts       # Server-side data loading
└── account/
    └── favorites.page.ts       # Route: /account/favorites
```

### Server-Side Data Loading with Analog.js

Analog.js provides a powerful pattern for loading data on the server before rendering, similar to Next.js's `getServerSideProps`. This ensures data is available during SSR, improving SEO and initial page load performance.

#### The Server-Side Loader Pattern

The key is the `.server.ts` file that exports a `load` function:

```typescript
// pages/jobs/[jobId].server.ts
import { PageServerLoad } from '@analogjs/router'
import { getJobById } from '../../../server/services/firestore-jobs.service'

export const load = async ({ params }: PageServerLoad) => {
  const jobId = params?.['jobId']

  // Fetch data server-side before rendering
  const job = jobId ? await getJobById(jobId) : null

  return { job }
}
```

#### Consuming Server Data in Components

The page component receives the server data through the `load` input:

```typescript
// pages/jobs/[jobId].page.ts
export default class JobDetailPageComponent implements OnInit {
  @Input() set load(data: LoadResult<typeof load>) {
    this.data = data
  }

  data!: LoadResult<typeof load>

  ngOnInit(): void {
    // SSR-safe browser API usage
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0)
    }
  }
}
```

#### Key Benefits

1. **SEO-Friendly**: Data is available during server rendering
2. **Type-Safe**: TypeScript infers the exact shape of loaded data
3. **Performance**: No client-side data fetching delays
4. **Error Handling**: Server-side errors can be handled gracefully

#### Error Handling in Server Loaders

```typescript
export const load = async ({ params }: PageServerLoad) => {
  try {
    const jobId = params?.['jobId']
    const job = jobId ? await getJobById(jobId) : null

    return {
      job,
      error: null,
    }
  } catch (error) {
    console.error('Failed to load job:', error)
    return {
      job: null,
      error: 'Failed to load job details',
    }
  }
}
```

**Key Learning**: Server-side data loading provides better SEO and performance but requires careful error handling and SSR-safe component code.

## Firebase Integration Patterns

### Server-Side Firebase Admin

For server-side operations, we use Firebase Admin SDK:

```typescript
// server/services/firebase-admin.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

let app: App
if (!getApps().length) {
  app = initializeApp({
    credential: applicationDefault(),
    projectId: process.env['GOOGLE_CLOUD_PROJECT'],
  })
} else {
  app = getApps()[0]
}

export const db = getFirestore(app)
```

### Client-Side Firebase Services

For client-side operations, we create services that handle authentication and data operations:

```typescript
// Key patterns in favorites.service.ts
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private user$ = user(this.auth)

  addToFavorites(job: Job): Observable<void> {
    return this.user$.pipe(
      switchMap((user) => {
        if (!user) throw new Error('Authentication required')

        const favoritesRef = collection(this.firestore, `users/${user.uid}/favorites`)
        const expireOn = new Date()
        expireOn.setMonth(expireOn.getMonth() + 3) // 3-month expiration

        return from(addDoc(favoritesRef, { ...job, expireOn }))
      }),
    )
  }
}
```

**Key Learning**: Use RxJS `switchMap` for complex async operations and always validate authentication before database operations.

## Type Safety and Data Modeling

### Handling Partial Types from Firestore

One significant challenge was dealing with TypeScript types when Firestore returns partial data:

```typescript
// types/job.types.ts
export interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  requirements: string[]
  benefits: string[]
  skills: string[]
  salary?: {
    min: number
    max: number
    currency: string
  }
  type: 'full-time' | 'part-time' | 'contract'
  experience: 'junior' | 'mid' | 'senior' | 'lead'
  isRemote: boolean
  isUrgent: boolean
  postedDate: string
  link: string
  logo?: string
}

export interface JobFilters {
  search: string
  location: string
  type: string
  experience: string
  isRemote: boolean
  salaryRange: {
    min: number
    max: number
  }
}
```

### Type-Safe Component Input Handling

When building reusable components, we needed to handle both full and partial job objects:

```typescript
// Safe handling of partial data in components
export class JobDetailComponent {
  @Input() job: Job | Partial<Job> | null = null

  get processedJob() {
    if (!this.job) return null

    return {
      ...this.job,
      requirements: Array.isArray(this.job.requirements) ? this.job.requirements : [],
      salary: this.job.salary ?? { min: 0, max: 0, currency: '' },
      company: this.job.company ?? '',
      // ... provide safe defaults for all fields
    }
  }
}
```

**Key Learning**: Create getter methods that safely handle partial data and provide sensible defaults to prevent runtime errors.

## Advanced Component Patterns

### Reusable Components with Context

When extracting the job detail functionality into a reusable component, we needed to handle different contexts (standalone page vs. modal):

```typescript
// Reusable component that adapts to different contexts
@Component({
  selector: 'app-job-detail',
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Back Button (conditional) -->
        <button
          *ngIf="showBackButton"
          (click)="goBack()"
          class="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          {{ backButtonText }}
        </button>

        <!-- Favorite Button (conditional) -->
        <button
          *ngIf="showFavoriteButton && (user$ | async)"
          (click)="toggleFavorite()"
          [disabled]="favoriteLoading"
          [title]="isFavorited ? 'Remove from favorites' : 'Save to favorites (expires after 3 months)'"
          class="p-2 rounded-full hover:bg-gray-100 transition-colors"
          [class.text-red-500]="isFavorited"
          [class.text-gray-400]="!isFavorited"
        >
          <svg class="w-5 h-5" [class.fill-current]="isFavorited" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        <!-- Job content -->
        <div *ngIf="processedJob" class="bg-white rounded-lg shadow-sm border border-gray-200">
          <!-- Job details implementation -->
        </div>
      </div>
    </div>
  `,
})
export class JobDetailComponent implements OnInit {
  @Input() job: Job | Partial<Job> | null = null
  @Input() showBackButton: boolean = true
  @Input() backButtonText: string = 'Back to Jobs'
  @Input() showFavoriteButton: boolean = true

  private favoritesService = inject(FavoritesService)
  private auth = inject(Auth)

  user$ = user(this.auth)
  isFavorited = false
  favoriteLoading = false

  ngOnInit(): void {
    // SSR-safe initialization
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0)
    }

    // Check if job is favorited
    if (this.job?.id && this.showFavoriteButton) {
      this.favoritesService.isJobFavorited(this.job.id).subscribe({
        next: (isFavorited) => {
          this.isFavorited = isFavorited
        },
        error: (error) => {
          console.error('Error checking favorite status:', error)
        },
      })
    }
  }

  toggleFavorite(): void {
    if (!this.job || !this.job.id) return

    this.favoriteLoading = true

    if (this.isFavorited) {
      // Remove from favorites logic
      this.user$
        .pipe(
          switchMap((user) => {
            if (!user) throw new Error('User must be authenticated')
            return this.favoritesService.getFavoriteByJobId(this.job!.id!)
          }),
          switchMap((favorite) => {
            if (!favorite?.favoriteId) throw new Error('Favorite not found')
            return this.user$.pipe(
              switchMap((user) => {
                if (!user) throw new Error('User must be authenticated')
                return this.favoritesService.removeFromFavorites(user.uid, favorite.favoriteId!)
              }),
            )
          }),
        )
        .subscribe({
          next: () => {
            this.isFavorited = false
            this.favoriteLoading = false
          },
          error: (error) => {
            console.error('Error removing favorite:', error)
            this.favoriteLoading = false
          },
        })
    } else {
      // Add to favorites
      const jobForFavorite = this.job as Job
      this.favoritesService.addToFavorites(jobForFavorite).subscribe({
        next: () => {
          this.isFavorited = true
          this.favoriteLoading = false
        },
        error: (error) => {
          console.error('Error adding favorite:', error)
          this.favoriteLoading = false
        },
      })
    }
  }

  goBack(): void {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }
}
```

## UX and Accessibility Enhancements

### Hover Effects and Interactions

Modern web applications require smooth, engaging interactions:

```typescript
// Key accessibility patterns
export class FavoritesPageComponent {
  // Template with hover effects and accessibility
  template: `
    <div 
      (click)="viewJobDetails(favorite)"
      (keydown)="onCardKeydown($event, favorite)"
      tabindex="0"
      role="button"
      [attr.aria-label]="'View details for ' + favorite.title"
      class="hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 
             focus:ring-2 focus:ring-blue-500 transition-all duration-300"
    >
      <!-- Prevent event bubbling on nested buttons -->
      <button (click)="$event.stopPropagation()">Apply Now</button>
    </div>
  `

  onCardKeydown(event: KeyboardEvent, favorite: FavoriteJob): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      this.viewJobDetails(favorite)
    }
  }
}
```

**Key Learning**: Always implement keyboard navigation and proper ARIA attributes for accessibility compliance.

## State Management with Signals

Analog.js applications can leverage Angular's new Signals API for reactive state management:

```typescript
// Using signals for reactive state management
@Component({
  template: `
    <div *ngIf="loading()" class="loading-spinner">Loading...</div>
    <div *ngIf="error()" class="error-message">{{ error() }}</div>
    <div *ngIf="!loading() && favorites().length === 0" class="empty-state">No favorites yet</div>
    <div *ngIf="favorites().length > 0" class="favorites-grid">
      <!-- Favorites content -->
    </div>
  `,
})
export class FavoritesPageComponent implements OnInit {
  private favoritesService = inject(FavoritesService)
  private auth = inject(Auth)

  // Reactive signals
  favorites = signal<FavoriteJob[]>([])
  loading = signal<boolean>(true)
  error = signal<string | null>(null)
  selectedJob = signal<FavoriteJob | null>(null)

  user$ = user(this.auth)

  ngOnInit(): void {
    this.user$.subscribe((user) => {
      if (user) {
        this.loadFavorites()
      } else {
        this.loading.set(false)
      }
    })
  }

  private loadFavorites(): void {
    this.loading.set(true)
    this.error.set(null)

    this.favoritesService.getUserFavorites().subscribe({
      next: (favorites) => {
        this.favorites.set(favorites)
        this.loading.set(false)
      },
      error: (error) => {
        console.error('Error loading favorites:', error)
        this.error.set('Failed to load favorites')
        this.loading.set(false)
      },
    })
  }

  // Type-safe conversion for component input
  get selectedJobForDisplay(): Job | null {
    const job = this.selectedJob()
    if (!job) return null

    // Convert FavoriteJob to Job by omitting the extra fields
    const { favoriteId, expireOn, addedOn, ...jobData } = job
    return jobData as Job
  }
}
```

## Performance Optimization

### Lazy Loading and Code Splitting

Analog.js automatically handles code splitting for routes, but we can optimize further:

```typescript
// Lazy loading components
const JobCardComponent = lazy(() => import('../job-card/job-card.component'))
const JobFiltersComponent = lazy(() => import('../job-filters/job-filters.component'))

// Using dynamic imports for heavy features
async loadFavoritesFeature() {
  const { FavoritesService } = await import('../../services/favorites.service')
  return FavoritesService
}
```

### Efficient Data Fetching

```typescript
// server/services/firestore-jobs.service.ts
export async function getAllJobs({
  limit = 10,
  filters = {} as Partial<JobFilters>,
  sort = { field: 'postedDate', direction: 'desc' as 'asc' | 'desc' },
  cursor = undefined,
} = {}) {
  const baseCollection = db.collection('jobs')
  let filteredQuery = baseCollection as FirebaseFirestore.Query

  // Apply filters efficiently
  if (filters.type) {
    filteredQuery = filteredQuery.where('type', '==', filters.type)
  }
  if (filters.experience) {
    filteredQuery = filteredQuery.where('experience', '==', filters.experience)
  }
  if (filters.isRemote) {
    filteredQuery = filteredQuery.where('isRemote', '==', filters.isRemote)
  }

  // Pagination with cursors
  filteredQuery = filteredQuery.orderBy(sort.field, sort.direction)

  if (cursor) {
    const cursorDate = new Date(cursor)
    if (!isNaN(cursorDate.getTime())) {
      filteredQuery = filteredQuery.startAfter(cursorDate)
    }
  }

  const snapshot = await filteredQuery.limit(limit).get()
  let jobs = snapshot.docs.map((doc) => convertJobTimestamps({ id: doc.id, ...doc.data() }))

  // Client-side filtering for complex queries
  if (filters.search && typeof filters.search === 'string' && filters.search.trim() !== '') {
    const searchTerm = filters.search.trim().toLowerCase()
    jobs = jobs.filter((job) => {
      return (
        (job.title && job.title.toLowerCase().includes(searchTerm)) ||
        (job.company && job.company.toLowerCase().includes(searchTerm)) ||
        (job.description && job.description.toLowerCase().includes(searchTerm))
      )
    })
  }

  const newCursor = jobs.length > 0 ? jobs[jobs.length - 1].postedDate : null
  return { jobs, cursor: newCursor }
}
```

## Security Best Practices

### Firebase Security Rules

Implementing proper security is crucial for user data protection:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    function isAdmin() {
      return request.auth != null &&
             resource.data.admins != null &&
             request.auth.uid in resource.data.admins;
    }

    // Jobs collection - public read, admin write
    match /jobs/{jobId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // User-specific favorites
    match /users/{userId} {
      allow read, write: if isOwner(userId);

      match /favorites/{favoriteId} {
        allow read, write: if isOwner(userId) || isAdmin();
      }
    }
  }
}
```

### Input Validation and Sanitization

```typescript
// services/favorites.service.ts
addToFavorites(job: Job): Observable<void> {
  return this.user$.pipe(
    switchMap((user) => {
      if (!user) {
        throw new Error('User must be authenticated to add favorites')
      }

      // Validate job data before saving
      if (!job.id || !job.title || !job.company) {
        throw new Error('Invalid job data')
      }

      // Sanitize and validate expiration date
      const expireOn = new Date()
      expireOn.setMonth(expireOn.getMonth() + 3)

      if (expireOn <= new Date()) {
        throw new Error('Invalid expiration date')
      }

      const favoritesRef = collection(this.firestore, `users/${user.uid}/favorites`)

      const favoriteJob: Omit<FavoriteJob, 'favoriteId'> = {
        ...job,
        expireOn: Timestamp.fromDate(expireOn),
        addedOn: Timestamp.fromDate(new Date())
      }

      return from(addDoc(favoritesRef, favoriteJob))
    }),
    map(() => void 0)
  )
}
```

## Testing Strategies

### Component Testing with SSR

Testing SSR components requires special consideration for browser APIs:

```typescript
// job-detail.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { JobDetailComponent } from './job-detail.component'
import { FavoritesService } from '../../services/favorites.service'
import { Auth } from '@angular/fire/auth'
import { of } from 'rxjs'

describe('JobDetailComponent', () => {
  let component: JobDetailComponent
  let fixture: ComponentFixture<JobDetailComponent>
  let mockFavoritesService: jasmine.SpyObj<FavoritesService>
  let mockAuth: jasmine.SpyObj<Auth>

  beforeEach(async () => {
    // Mock services
    const favoritesServiceSpy = jasmine.createSpyObj('FavoritesService', [
      'isJobFavorited',
      'addToFavorites',
      'removeFromFavorites',
    ])
    const authSpy = jasmine.createSpyObj('Auth', ['currentUser'])

    await TestBed.configureTestingModule({
      imports: [JobDetailComponent],
      providers: [
        { provide: FavoritesService, useValue: favoritesServiceSpy },
        { provide: Auth, useValue: authSpy },
      ],
    }).compileComponents()

    mockFavoritesService = TestBed.inject(FavoritesService) as jasmine.SpyObj<FavoritesService>
    mockAuth = TestBed.inject(Auth) as jasmine.SpyObj<Auth>
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(JobDetailComponent)
    component = fixture.componentInstance

    // Mock window object for SSR testing
    Object.defineProperty(window, 'scrollTo', {
      value: jasmine.createSpy('scrollTo'),
      writable: true,
    })
  })

  it('should handle empty job gracefully', () => {
    component.job = null
    fixture.detectChanges()

    expect(component.processedJob).toBeNull()
  })

  it('should check if job is favorited on init', () => {
    const mockJob = {
      id: 'test-job-id',
      title: 'Test Job',
      company: 'Test Company',
      // ... other job properties
    }

    component.job = mockJob
    component.showFavoriteButton = true
    mockFavoritesService.isJobFavorited.and.returnValue(of(true))

    component.ngOnInit()

    expect(mockFavoritesService.isJobFavorited).toHaveBeenCalledWith('test-job-id')
    expect(component.isFavorited).toBe(true)
  })
})
```

### Service Testing

```typescript
// favorites.service.spec.ts
import { TestBed } from '@angular/core/testing'
import { FavoritesService } from './favorites.service'
import { Firestore } from '@angular/fire/firestore'
import { Auth } from '@angular/fire/auth'
import { of } from 'rxjs'

describe('FavoritesService', () => {
  let service: FavoritesService
  let mockFirestore: jasmine.SpyObj<Firestore>
  let mockAuth: jasmine.SpyObj<Auth>

  beforeEach(() => {
    const firestoreSpy = jasmine.createSpyObj('Firestore', ['collection', 'doc'])
    const authSpy = jasmine.createSpyObj('Auth', ['currentUser'])

    TestBed.configureTestingModule({
      providers: [
        { provide: Firestore, useValue: firestoreSpy },
        { provide: Auth, useValue: authSpy },
      ],
    })

    service = TestBed.inject(FavoritesService)
    mockFirestore = TestBed.inject(Firestore) as jasmine.SpyObj<Firestore>
    mockAuth = TestBed.inject(Auth) as jasmine.SpyObj<Auth>
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should throw error when user is not authenticated', (done) => {
    // Mock unauthenticated user
    spyOnProperty(service, 'user$', 'get').and.returnValue(of(null))

    const mockJob = {
      id: 'test-job',
      title: 'Test Job',
      // ... other properties
    }

    service.addToFavorites(mockJob as any).subscribe({
      error: (error) => {
        expect(error.message).toBe('User must be authenticated to add favorites')
        done()
      },
    })
  })
})
```

## Deployment and Production Considerations

### Build Optimization

```json
// project.json
{
  "targets": {
    "build": {
      "executor": "@analogjs/platform:vite",
      "options": {
        "configFile": "landing/vite.config.ts",
        "main": "landing/src/main.ts",
        "outputPath": "dist/landing/client",
        "tsConfig": "landing/tsconfig.app.json"
      },
      "configurations": {
        "production": {
          "sourcemap": false,
          "mode": "production"
        }
      }
    }
  }
}
```

### Environment Configuration

```typescript
// Environment-specific configuration
export const environment = {
  production: process.env['NODE_ENV'] === 'production',
  firebase: {
    projectId: process.env['FIREBASE_PROJECT_ID'],
    appId: process.env['FIREBASE_APP_ID'],
    // ... other config
  },
  api: {
    baseUrl: process.env['API_BASE_URL'] || 'http://localhost:4200',
  },
}
```

## Common Pitfalls and Solutions

### 1. Hydration Mismatch

**Problem**: Server-rendered content doesn't match client-side rendering.

**Solution**: Ensure consistent data and avoid browser-specific logic in templates.

```typescript
// Use NgZone and afterNextRender for browser-specific code
import { afterNextRender } from '@angular/core'

@Component({...})
export class MyComponent {
  constructor() {
    afterNextRender(() => {
      // Browser-only code here
      this.initializeClientOnlyFeatures()
    })
  }
}
```

### 2. Firebase Auth State Persistence

**Problem**: Authentication state is lost on page refresh in SSR.

**Solution**: Handle authentication state properly with observables.

```typescript
@Component({...})
export class AuthComponent implements OnInit {
  user$ = user(this.auth)
  isLoading = true

  ngOnInit() {
    this.user$.subscribe(user => {
      this.isLoading = false
      // Handle user state
    })
  }
}
```

### 3. Memory Leaks with Subscriptions

**Problem**: Observable subscriptions not cleaned up properly.

**Solution**: Use takeUntilDestroyed operator (Angular 16+).

```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

@Component({...})
export class MyComponent {
  private destroyRef = inject(DestroyRef)

  ngOnInit() {
    this.dataService.getData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        // Handle data
      })
  }
}
```

## Future Roadmap and Improvements

Based on our experience building TechLeadPilot, here are some areas for future enhancement:

### 1. Performance Optimizations

- Implement service worker for offline functionality
- Add image optimization and lazy loading
- Implement progressive loading for large datasets

### 2. User Experience Enhancements

- Add real-time notifications
- Implement advanced search with filters
- Create personalized job recommendations

### 3. Technical Improvements

- Migrate to Angular's new control flow syntax
- Implement comprehensive error boundaries
- Add monitoring and analytics

## Conclusion

Building a production-ready SSR application with Analog.js has been an enlightening experience. The framework successfully bridges the gap between Angular's robust architecture and the developer experience of modern meta-frameworks.

### Key Takeaways:

1. **SSR-First Approach**: Always consider server-side rendering implications when writing components and services.

2. **Type Safety**: Leverage TypeScript's type system extensively, especially when dealing with partial data from APIs.

3. **Firebase Integration**: Requires careful configuration for SSR environments, but provides powerful real-time capabilities.

4. **Performance Matters**: Implement proper loading states, pagination, and caching strategies from the beginning.

5. **Accessibility**: Don't treat accessibility as an afterthought - implement it from the start.

6. **Testing Strategy**: SSR applications require special testing considerations, particularly around browser API usage.

Analog.js has proven to be a mature and capable framework for building complex, production-ready applications. While there are challenges specific to SSR and Firebase integration, the benefits of improved SEO, faster initial page loads, and better user experience make it a compelling choice for Angular developers.

The combination of Analog.js's developer experience with Angular's enterprise-grade features creates a powerful platform for building modern web applications. As the framework continues to evolve, we can expect even better integration with the Angular ecosystem and improved developer tooling.

Whether you're building a simple blog or a complex application like TechLeadPilot, Analog.js provides the foundation needed to create fast, scalable, and maintainable SSR applications with Angular.

---

_This article is based on real-world experience building [TechLeadPilot](https://techleadpilot.com).com, a job board platform for senior engineers and more._
