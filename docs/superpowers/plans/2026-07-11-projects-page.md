# Projects Page + Featured Home Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/projects` page listing all 8 projects, show only 3 featured projects (Xoài, CodeMagpie, LogiChat) on the home page with a "View all projects →" link, and route the "Digital Portfolio" nav item to the new page.

**Architecture:** One data module (`projects.data.ts`) is the single source of truth. A reusable `ProjectGridComponent` renders a card grid from an `items` input. The home `PortfolioComponent` passes the 3 featured items; the new `/projects` route passes all 8. Nav routes to `/projects`; the route is prerendered.

**Tech Stack:** Angular (standalone components), AnalogJS (file-based routes + prerender), Tailwind CSS, Nx, Jest (lib unit tests), chrome-devtools MCP (screenshots).

## Global Constraints

- **Branch first.** Current branch is `dev`, the production branch (merges deploy live to dalenguyen.me). Do all work on a feature branch: `git checkout -b feat/projects-page`.
- **Data lib:** all project data + components live in `libs/portfolio/home/feature`; project name for tests is `portfolio-home-feature`. No new Nx lib.
- **Public API:** anything the app route imports must be re-exported from `libs/portfolio/home/feature/src/index.ts` and reachable via `@dalenguyen/portfolio/home/feature`.
- **Asset path:** images live in `libs/portfolio/shared/assets/images/home/` and are served at `/assets/images/home/…` (`publicDir: '../../libs/portfolio/shared'`). Reference them in data as `assets/images/home/<name>.png` (no leading slash, matching existing entries).
- **Reveal directive:** cards use `RevealDirective` from `@dalenguyen/portfolio/shell/ui`.
- **Prerender:** every Vercel-served route MUST be listed in `prerender.routes` in `apps/blog-app/vite.config.ts` or it 404s on the static build.
- **Exact copy** for the two new projects is fixed in Task 1 — copy verbatim.
- **Verify against the Vercel preview**, not the apex, per `apps/blog-app/CLAUDE.md`.

---

### Task 1: Project data module (single source of truth)

**Files:**
- Create: `libs/portfolio/home/feature/src/lib/portfolio/projects.data.ts`
- Create: `libs/portfolio/home/feature/src/lib/portfolio/projects.data.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface PortfolioItem { id: number; title: string; description: string; imageUrl: string; technologies: { name: string; icon: string }[]; projectUrl: string; featured?: boolean }`
  - `const PORTFOLIO_ITEMS: PortfolioItem[]` — 8 items, exactly 3 with `featured: true` (ids 1,2,3), ordered featured-first.

- [ ] **Step 1: Write the failing test**

Create `libs/portfolio/home/feature/src/lib/portfolio/projects.data.spec.ts`:

```ts
import { PORTFOLIO_ITEMS } from './projects.data'

declare const describe: any
declare const it: any
declare const expect: any

describe('PORTFOLIO_ITEMS', () => {
  it('lists all 8 projects', () => {
    expect(PORTFOLIO_ITEMS.length).toBe(8)
  })

  it('marks exactly 3 as featured', () => {
    expect(PORTFOLIO_ITEMS.filter((p) => p.featured).length).toBe(3)
  })

  it('features Xoài, CodeMagpie and LogiChat', () => {
    const featuredUrls = PORTFOLIO_ITEMS.filter((p) => p.featured).map((p) => p.projectUrl)
    expect(featuredUrls).toEqual([
      'https://heyxoai.com',
      'https://codemagpie.com',
      'https://logichat.io',
    ])
  })

  it('gives every item the required fields', () => {
    for (const p of PORTFOLIO_ITEMS) {
      expect(typeof p.title).toBe('string')
      expect(typeof p.description).toBe('string')
      expect(p.imageUrl).toMatch(/^assets\/images\//)
      expect(p.projectUrl).toMatch(/^https:\/\//)
      expect(Array.isArray(p.technologies)).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test portfolio-home-feature -t "PORTFOLIO_ITEMS"`
Expected: FAIL — cannot find module `./projects.data`.

- [ ] **Step 3: Write the data module**

Create `libs/portfolio/home/feature/src/lib/portfolio/projects.data.ts`:

```ts
export interface PortfolioItem {
  id: number
  title: string
  description: string
  imageUrl: string
  technologies: { name: string; icon: string }[]
  projectUrl: string
  featured?: boolean
}

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: 1,
    title: 'Xoài (Voice Assistant for Apple Watch)',
    description:
      "Your second brain on your wrist. Tap your Apple Watch, ask out loud, and Xoài speaks back a live, web-grounded answer — hands-free, eyes-free. A native watchOS assistant that captures the small questions you'd otherwise let go.",
    imageUrl: 'assets/images/home/xoai.png',
    technologies: [
      { name: 'watchOS', icon: 'watch' },
      { name: 'SwiftUI', icon: 'code' },
      { name: 'Gemini', icon: 'psychology' },
      { name: 'Google Search', icon: 'search' },
      { name: 'Sign in with Apple', icon: 'lock' },
    ],
    projectUrl: 'https://heyxoai.com',
    featured: true,
  },
  {
    id: 2,
    title: 'CodeMagpie (AI Coding Agent)',
    description:
      'A GitHub App that writes code and reviews PRs when you @mention it. Reviewer, implementer, and resolver agents share one model-agnostic backend built on the Claude Agent SDK.',
    imageUrl: 'assets/images/home/codemagpie.png',
    technologies: [
      { name: 'Claude Agent SDK', icon: 'psychology' },
      { name: 'GitHub App', icon: 'code' },
      { name: 'TypeScript', icon: 'code' },
      { name: 'Node.js', icon: 'api' },
      { name: 'Model-agnostic LLM', icon: 'psychology' },
    ],
    projectUrl: 'https://codemagpie.com',
    featured: true,
  },
  {
    id: 3,
    title: 'LogiChat (AI Chatbot)',
    description: 'Automate your customer support with the next generation natural language processing technology',
    imageUrl: 'assets/images/home/logichat.png',
    technologies: [
      { name: 'Nx', icon: 'layers' },
      { name: 'Express', icon: 'api' },
      { name: 'Angular', icon: 'code' },
      { name: 'GCP', icon: 'cloud' },
      { name: 'Firebase', icon: 'cloud' },
      { name: 'Stripe', icon: 'payments' },
      { name: 'CloudFlare', icon: 'security' },
      { name: 'OpenAI', icon: 'psychology' },
      { name: 'Resend', icon: 'email' },
    ],
    projectUrl: 'https://logichat.io',
    featured: true,
  },
  {
    id: 4,
    title: 'DailyMastery (Learning Platform)',
    description:
      'A comprehensive learning platform designed to help users master new skills through daily practice and structured learning paths. Built with modern web technologies to provide an engaging and effective learning experience.',
    imageUrl: 'assets/images/home/dailymastery.png',
    technologies: [
      { name: 'Next.js', icon: 'code' },
      { name: 'Nx', icon: 'layers' },
      { name: 'Firebase', icon: 'cloud' },
      { name: 'TailwindCSS', icon: 'style' },
      { name: 'GCP', icon: 'cloud' },
    ],
    projectUrl: 'https://dailymastery.io',
  },
  {
    id: 5,
    title: 'TechLeadPilot (Leadership Simulator)',
    description:
      'A leadership simulator that puts you in realistic Tech Lead scenarios before you actually have to face them. Practice soft skills like navigating office politics, motivating team members, and making decisions under pressure.',
    imageUrl: 'assets/images/blog/techleadpilot-simulator.png',
    technologies: [
      { name: 'Angular', icon: 'code' },
      { name: 'Analog.js', icon: 'code' },
      { name: 'Firebase', icon: 'cloud' },
      { name: 'Vertex AI', icon: 'psychology' },
      { name: 'Firestore', icon: 'storage' },
      { name: 'Node.js', icon: 'api' },
    ],
    projectUrl: 'https://techleadpilot.com',
  },
  {
    id: 6,
    title: 'Techcater (E-Commerce Platform)',
    description:
      'A WordPress plugin marketplace offering premium extensions on a subscription model with automated license management and seamless updates.',
    imageUrl: 'assets/images/home/techcater.png',
    technologies: [
      { name: 'Angular', icon: 'code' },
      { name: 'Firebase', icon: 'cloud' },
      { name: 'Stripe', icon: 'payments' },
      { name: 'GCP', icon: 'cloud' },
      { name: 'PrimeNG', icon: 'dashboard' },
      { name: 'TailwindCSS', icon: 'style' },
      { name: 'Amplitude', icon: 'analytics' },
    ],
    projectUrl: 'https://techcater.com',
  },
  {
    id: 7,
    title: 'PDFun (Open Source PDF Services)',
    description: 'A collection of open source services for PDF processing, Password removal, PDF AI chat, and more.',
    imageUrl: 'assets/images/home/pdfun.png',
    technologies: [
      { name: 'Nx', icon: 'layers' },
      { name: 'Analog', icon: 'code' },
      { name: 'GCP', icon: 'cloud' },
      { name: 'Firebase', icon: 'cloud' },
      { name: 'OpenAI', icon: 'psychology' },
      { name: 'OpenScript', icon: 'code' },
    ],
    projectUrl: 'https://pdfun.xyz',
  },
  {
    id: 8,
    title: 'SafePlate (AI Meal Planner)',
    description:
      'Generate personalized meals that avoid allergens and incorporate your favorite ingredients, promoting a healthy lifestyle with our advanced AI technology. Eat safely, live confidently.',
    imageUrl: 'assets/images/home/safeplate.png',
    technologies: [
      { name: 'Ionic', icon: 'phone_iphone' },
      { name: 'Vertex AI', icon: 'psychology' },
      { name: 'GCP', icon: 'cloud' },
      { name: 'NestJS', icon: 'code' },
    ],
    projectUrl: 'https://safeplate.ai',
  },
]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx nx test portfolio-home-feature -t "PORTFOLIO_ITEMS"`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add libs/portfolio/home/feature/src/lib/portfolio/projects.data.ts \
        libs/portfolio/home/feature/src/lib/portfolio/projects.data.spec.ts
git commit -m "feat(portfolio): extract project data + add Xoài and CodeMagpie"
```

---

### Task 2: Reusable `ProjectGridComponent`

**Files:**
- Create: `libs/portfolio/home/feature/src/lib/portfolio/project-grid.component.ts`
- Create: `libs/portfolio/home/feature/src/lib/portfolio/project-grid.component.spec.ts`

**Interfaces:**
- Consumes: `PortfolioItem` from `./projects.data` (Task 1).
- Produces: `ProjectGridComponent`, `selector: 'dalenguyen-project-grid'`, `@Input({ required: true }) items: PortfolioItem[]`. Renders one card per item (image, title link, description, tech pills). Card markup is the block currently in `portfolio.component.ts`.

- [ ] **Step 1: Write the failing test**

Create `libs/portfolio/home/feature/src/lib/portfolio/project-grid.component.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test portfolio-home-feature -t "ProjectGridComponent"`
Expected: FAIL — cannot find module `./project-grid.component`.

- [ ] **Step 3: Write the component**

Create `libs/portfolio/home/feature/src/lib/portfolio/project-grid.component.ts` (card markup lifted verbatim from the existing `portfolio.component.ts`, now iterating `items`):

```ts
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { RevealDirective } from '@dalenguyen/portfolio/shell/ui'
import { PortfolioItem } from './projects.data'

@Component({
  selector: 'dalenguyen-project-grid',
  standalone: true,
  imports: [RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      @for (project of items; track project.id) {
        <div
          dalReveal
          class="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-glow"
        >
          <div class="relative h-48 overflow-hidden">
            <img
              [src]="project.imageUrl"
              [alt]="project.title"
              loading="lazy"
              class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent"></div>
          </div>
          <div class="flex flex-grow flex-col p-6">
            <h3 class="text-xl font-semibold text-fg">
              <a
                [href]="project.projectUrl"
                target="_blank"
                rel="noopener"
                class="transition-colors duration-300 after:absolute after:inset-0 hover:text-accent"
              >
                {{ project.title }}
              </a>
            </h3>
            <p class="mt-2 flex-grow leading-relaxed text-fg-muted">{{ project.description }}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              @for (tech of project.technologies; track tech.name) {
                <span class="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-fg-muted">
                  {{ tech.name }}
                </span>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProjectGridComponent {
  @Input({ required: true }) items: PortfolioItem[] = []
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx nx test portfolio-home-feature -t "ProjectGridComponent"`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add libs/portfolio/home/feature/src/lib/portfolio/project-grid.component.ts \
        libs/portfolio/home/feature/src/lib/portfolio/project-grid.component.spec.ts
git commit -m "feat(portfolio): add reusable ProjectGridComponent"
```

---

### Task 3: Home `PortfolioComponent` → featured 3 + "View all" link

**Files:**
- Modify: `libs/portfolio/home/feature/src/lib/portfolio/portfolio.component.ts`
- Modify: `libs/portfolio/home/feature/src/lib/portfolio/portfolio.component.spec.ts`

**Interfaces:**
- Consumes: `ProjectGridComponent`, `PORTFOLIO_ITEMS` (Tasks 1–2); `RouterLink` from `@angular/router`.
- Produces: `PortfolioComponent` renders the `#portfolio` section header, `<dalenguyen-project-grid [items]="featured">`, and a `routerLink="/projects"` "View all projects →" link. `featured: PortfolioItem[]` = the 3 flagged items.

- [ ] **Step 1: Update the spec to lock featured behavior**

Replace `libs/portfolio/home/feature/src/lib/portfolio/portfolio.component.spec.ts` with:

```ts
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

  it('shows only the 3 featured projects', () => {
    expect(component.featured.length).toBe(3)
    expect(component.featured.every((p) => p.featured)).toBe(true)
  })

  it('links to the full projects page', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[href="/projects"]')
    expect(link).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test portfolio-home-feature -t "PortfolioComponent"`
Expected: FAIL — `component.featured` is undefined / no `a[href="/projects"]`.

- [ ] **Step 3: Rewrite the component**

Replace `libs/portfolio/home/feature/src/lib/portfolio/portfolio.component.ts` with:

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ProjectGridComponent } from './project-grid.component'
import { PORTFOLIO_ITEMS, PortfolioItem } from './projects.data'

@Component({
  selector: 'dalenguyen-portfolio',
  standalone: true,
  imports: [ProjectGridComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="portfolio" class="py-16 sm:py-20 bg-surface/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-fg">Project Gallery</h2>
          <p class="mt-3 text-lg text-fg-muted max-w-2xl mx-auto">
            I create user-centered digital experiences that blend innovative technology with strategic design, focusing
            on intuitive interfaces that drive engagement and deliver measurable business outcomes.
          </p>
        </header>

        <dalenguyen-project-grid [items]="featured" />

        <div class="mt-12 text-center">
          <a
            routerLink="/projects"
            class="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-fg transition duration-300 hover:border-accent hover:text-accent hover:shadow-glow"
          >
            View all projects
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  `,
})
export class PortfolioComponent {
  featured: PortfolioItem[] = PORTFOLIO_ITEMS.filter((p) => p.featured)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx nx test portfolio-home-feature -t "PortfolioComponent"`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add libs/portfolio/home/feature/src/lib/portfolio/portfolio.component.ts \
        libs/portfolio/home/feature/src/lib/portfolio/portfolio.component.spec.ts
git commit -m "feat(portfolio): home shows 3 featured projects + View all link"
```

---

### Task 4: Export grid + data from the lib public API

**Files:**
- Modify: `libs/portfolio/home/feature/src/index.ts`

**Interfaces:**
- Consumes: Tasks 1–2.
- Produces: `@dalenguyen/portfolio/home/feature` re-exports `ProjectGridComponent`, `PORTFOLIO_ITEMS`, `PortfolioItem` (in addition to the existing `HomeComponent`).

- [ ] **Step 1: Edit the barrel**

Replace `libs/portfolio/home/feature/src/index.ts` contents with:

```ts
export * from './lib/home.component'
export * from './lib/portfolio/project-grid.component'
export * from './lib/portfolio/projects.data'
```

- [ ] **Step 2: Verify the lib still compiles/tests green**

Run: `npx nx test portfolio-home-feature`
Expected: PASS (all specs in the lib).

- [ ] **Step 3: Commit**

```bash
git add libs/portfolio/home/feature/src/index.ts
git commit -m "chore(portfolio): export ProjectGridComponent and project data"
```

---

### Task 5: `/projects` route (all 8)

**Files:**
- Create: `apps/blog-app/src/app/routes/projects.ts`

**Interfaces:**
- Consumes: `ProjectGridComponent`, `PORTFOLIO_ITEMS` from `@dalenguyen/portfolio/home/feature` (Task 4).
- Produces: default-exported standalone page component for the `/projects` file-based route + `routeMeta`.

- [ ] **Step 1: Create the route (pattern mirrors `resume.ts`)**

Create `apps/blog-app/src/app/routes/projects.ts`:

```ts
import { RouteMeta } from '@analogjs/router'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { PORTFOLIO_ITEMS, ProjectGridComponent } from '@dalenguyen/portfolio/home/feature'

export const routeMeta: RouteMeta = {
  title: 'Projects | Dale Nguyen',
  meta: [
    {
      name: 'description',
      content:
        'Projects by Dale Nguyen — AI agents, developer tools, and web products, from a watchOS voice assistant to a GitHub coding agent.',
    },
    { name: 'og:title', content: 'Projects | Dale Nguyen' },
    {
      name: 'og:description',
      content: 'A gallery of projects Dale Nguyen has built — AI agents, developer tools, and web products.',
    },
    { name: 'og:url', content: 'https://dalenguyen.me/projects' },
    { name: 'type', content: 'website' },
  ],
}

@Component({
  standalone: true,
  imports: [ProjectGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-h-screen bg-bg py-16 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <header class="text-center mb-12">
          <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-fg">Projects</h1>
          <p class="mt-3 text-lg text-fg-muted max-w-2xl mx-auto">
            A gallery of things I've built — AI agents, developer tools, and web products.
          </p>
        </header>

        <dalenguyen-project-grid [items]="projects" />
      </div>
    </section>
  `,
})
export default class ProjectsPageComponent {
  projects = PORTFOLIO_ITEMS
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/blog-app/src/app/routes/projects.ts
git commit -m "feat(blog-app): add /projects page listing all projects"
```

> Route renders only after Task 6 (prerender) or via the dev server; verified end-to-end in Task 8.

---

### Task 6: Prerender `/projects`

**Files:**
- Modify: `apps/blog-app/vite.config.ts` (the `prerender.routes` array, currently `'/', '/blog', '/learn', '/bucket-list', '/resume'`)

**Interfaces:**
- Consumes: Task 5 route.
- Produces: `/projects` in the static route set (served by Vercel + prerendered on Cloud Run).

- [ ] **Step 1: Add the route**

In `apps/blog-app/vite.config.ts`, inside `routes: async () => [ … ]`, add `'/projects'` after `'/resume',`:

```ts
                  '/',
                  '/blog',
                  '/learn',
                  '/bucket-list',
                  '/resume',
                  '/projects',
```

- [ ] **Step 2: Commit**

```bash
git add apps/blog-app/vite.config.ts
git commit -m "feat(blog-app): prerender /projects route"
```

---

### Task 7: Route the "Digital Portfolio" nav item to `/projects`

**Files:**
- Modify: `libs/portfolio/shell/ui/src/lib/nav/nav.component.html` (the `portfolio` `<li>`, ~lines 78–97)

**Interfaces:**
- Consumes: `navigateTo` / `isActive` already defined on `NavComponent` (no TS change).
- Produces: clicking "Digital Portfolio" navigates to `/projects`; the item is active on that route.

- [ ] **Step 1: Edit the nav item**

In `libs/portfolio/shell/ui/src/lib/nav/nav.component.html`, on the `<li>` whose inner div id is `portfolio-link`, change the two bindings:

- `[ngClass]="isActive('portfolio')"` → `[ngClass]="isActive('projects')"`
- `(click)="scroll('portfolio')"` → `(click)="navigateTo('projects')"`

Leave the icon, the `id="portfolio-link"` div, and the "Digital Portfolio" label unchanged.

- [ ] **Step 2: Verify shell lib still passes**

Run: `npx nx test portfolio-shell-ui`
Expected: PASS (nav spec only asserts creation).

- [ ] **Step 3: Commit**

```bash
git add libs/portfolio/shell/ui/src/lib/nav/nav.component.html
git commit -m "feat(nav): route Digital Portfolio to /projects page"
```

---

### Task 8: Screenshots for Xoài and CodeMagpie

**Files:**
- Create: `libs/portfolio/shared/assets/images/home/xoai.png`
- Create: `libs/portfolio/shared/assets/images/home/codemagpie.png`

**Interfaces:**
- Consumes: the `imageUrl` paths declared in Task 1.
- Produces: the two card images, served at `/assets/images/home/{xoai,codemagpie}.png`.

- [ ] **Step 1: Capture heyxoai.com hero**

Using chrome-devtools MCP: open `https://heyxoai.com`, set a desktop viewport (e.g. 1280×800), then screenshot the hero region and save to `libs/portfolio/shared/assets/images/home/xoai.png`. Prefer a landscape crop (cards show a `h-48` band via `object-cover`).

- [ ] **Step 2: Capture codemagpie.com hero**

Open `https://codemagpie.com` and save a hero screenshot to `libs/portfolio/shared/assets/images/home/codemagpie.png` the same way.

- [ ] **Step 3: Sanity-check the files exist and are non-trivial**

Run: `ls -l libs/portfolio/shared/assets/images/home/xoai.png libs/portfolio/shared/assets/images/home/codemagpie.png`
Expected: both present, each more than a few KB.

- [ ] **Step 4: Commit**

```bash
git add libs/portfolio/shared/assets/images/home/xoai.png \
        libs/portfolio/shared/assets/images/home/codemagpie.png
git commit -m "feat(portfolio): add Xoài and CodeMagpie project screenshots"
```

---

### Task 9: Build + verify end-to-end

**Files:** none (verification only).

- [ ] **Step 1: Lib tests green**

Run: `npx nx test portfolio-home-feature`
Expected: PASS.

- [ ] **Step 2: Production build succeeds (prerenders `/projects`)**

Run: `npx nx build blog-app`
Expected: build completes; `/projects` appears in prerendered output. Confirm:
Run: `ls dist/apps/blog-app/analog/public/projects/index.html 2>/dev/null || ls .vercel/output/static/projects/index.html 2>/dev/null`
Expected: an `index.html` for `/projects` exists in at least one output root.

- [ ] **Step 3: Open a PR and verify the Vercel preview** (per `apps/blog-app/CLAUDE.md` — the preview URL, NOT the apex)

```bash
git push -u origin feat/projects-page
gh pr create --base dev --title "feat: projects page + featured home section" \
  --body "Adds /projects (all 8 projects), trims home to 3 featured (Xoài, CodeMagpie, LogiChat) with a View all link, and routes the Digital Portfolio nav item to /projects."
```

On the Vercel preview URL from the PR thread, confirm:
- `/` — the Project Gallery shows exactly **3** cards; "View all projects →" navigates to `/projects`.
- `/projects` — **8** cards; the Xoài and CodeMagpie images render (no broken images).
- The "Digital Portfolio" nav item routes to `/projects` and shows active there.
- No console errors.

- [ ] **Step 4: Merge** (only after preview verification) — merging to `dev` deploys live to dalenguyen.me.

---

## Notes for the executor

- Do NOT commit to `dev` directly — everything lands on `feat/projects-page` and merges via PR.
- `technologies[].icon` is not rendered (the card shows only `tech.name`); icon values are cosmetic.
- If `npx nx build blog-app` is too slow in the loop, rely on `npx nx test portfolio-home-feature` for the lib and defer the full build to Step 2 of Task 9.
