---
title: Angular functional router guard and testing with inject()
slug: 2023-04-07-angular-functional-router-guard-and-testing-with-inject
description: In Angular, guards are a fundamental feature that protects routes within an application. Guards check if certain conditions are met before allowing users to access specific routes. Guards can be used for authentication and authorization, role-based access control, feature flag checks, and more.
categories: ['angular', 'tutorial', 'webdev']
coverImage: https://cdn.buttercms.com/EBYGJWB9TOSPLblq2Qma
profileImage: https://d1ts43dypk8bqh.cloudfront.net/v1/avatars/e3c37839-e11d-44f4-97e2-6a9d3ad580fc
published: 2023-04-07
author: Dale Nguyen
---

<img src="https://cdn.buttercms.com/EBYGJWB9TOSPLblq2Qma" alt="Angular functional router guard and testing with inject()" width="100%" height="auto" style="aspect-ratio: 16/9;" />

In Angular, guards are a fundamental feature that protects routes within an application. Guards check if certain conditions are met before allowing users to access specific routes. Guards can be used for authentication and authorization, role-based access control, feature flag checks, and more.

Angular provides several types of guards that can be used for different purposes, such as canActivate, canActivateChild, canDeactivate, and canLoad. These guards are defined as classes that implement specific interfaces provided by the Angular framework. When a guard is added to the canActivate array of a route, it is invoked before allowing the user to navigate to the desired route.

In this example, we have a Dashboard route that requires an admin role to access.

```typescript
// routes.ts
{
  path: 'dashboard',
  loadComponent: () => import('./pages/dashboard.component')
},
```

### Traditional (Class) Router Guard

To prevent non-admin user from accessing this route, we can use a class guard as below.

```typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.authService.isAdmin().pipe(tap((isAdmin) => (!isAdmin ? this.router.navigate(['/login']) : true)))
  }
}
```

Then we can apply the guard to routes.

```typescript
{
  path: 'dashboard',
  canActivate: [AuthGuard],
  loadComponent: () => import('./pages/dashboard.component')
},
```

This old approach works but based on the [Angular survey](https://blog.angular.io/advancements-in-the-angular-router-5d69ec4c032):

> We've received feedback from multiple developers that amounts to developers wanting less boilerplate and more productivity.

Which lead to the evolution of a functional router guard in Angular v14.

> Functional router guards with `inject()` are lightweight, ergonomic, and more composable than class-based guards.

### Functional router guard with inject()

The inject function is a new feature in Angular 14 that helps to inject external dependencies in our functions.

```typescript
const authGuard = () => {
  const authService = inject(AuthService)
  const router = inject(Router)

  if (this.authService.isAdmin()) {
    return true
  }

  return this.router.navigate(['/login'])
}
```

Registering the functional guard function is the same as class-based.

```typescript
// routes.ts
{
  path: 'dashboard',
  canActivate: [authGuard],
  loadComponent: () => import('./pages/dashboard.component')
},
```

### Testing functional guard

Testing guards in Angular is an essential part of the development process to ensure that the guards are working correctly and providing the desired functionality. To be honest, I couldn't find a lot of references in terms of testing inject() inside a functional router guard. Here is an example that works for me. The idea to mock `inject()` inside `@angular/core` package.

```typescript
import { authGuard } from './auth.guard'
import * as angularCore from '@angular/core'

// METHOD 1: Mocking inject()
const isAdminMock = jest.fn()

describe('AuthGuard', () => {
  beforeEach(() => {
    const injectSpy = jest.spyOn(angularCore, 'inject')
    injectSpy.mockImplementation((providerToken: unknown) => {
      if (providerToken === AuthService) {
        return {
          isAdmin: isAdminMock,
        }
      }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return true when user is admin', () => {
    isAdminMock.mockReturnValue(true)
    expect(authGuard()).toBe(true)
  })
})

// METHOD 2: using TestBed
describe('AuthGuard', () => {
  it('should return true', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { isAdmin: () => true },
        },
      ],
    })

    const guard = TestBed.runInInjectionContext(authGuard)
    expect(guard).toBeTruthy()
  })
})
```

I hope that you find this post helpful. If you have any improvements, please leave a comment :)
