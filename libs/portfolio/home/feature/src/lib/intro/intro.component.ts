import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-intro',
  imports: [RouterModule],
  template: `
    <section id="intro" class="relative isolate overflow-hidden bg-bg">
      <!-- Animated accent glow -->
      <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 -top-48 -z-10 flex justify-center blur-3xl">
        <div
          class="aspect-[1100/600] w-[72rem] max-w-none bg-gradient-to-tr from-accent-fill/40 via-accent/30 to-cyan-400/30 opacity-40 bg-[length:200%_200%] animate-gradient-pan"
        ></div>
      </div>
      <!-- Subtle grid texture -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 -z-10 opacity-[0.04] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:48px_48px] text-fg"
      ></div>

      <div class="mx-auto max-w-3xl px-6 py-28 sm:py-36 text-center">
        <img
          src="/assets/images/dale-nguyen-avatar.webp"
          alt="Dale Nguyen"
          width="96"
          height="96"
          class="mx-auto h-20 w-20 rounded-full ring-2 ring-border shadow-lg animate-fade-up"
        />

        <span
          class="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-fg-muted backdrop-blur animate-fade-up [animation-delay:80ms]"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-green-400"></span>
          Software Engineer · Toronto, Canada
        </span>

        <h1 class="mt-6 text-4xl font-bold tracking-tight text-fg sm:text-6xl animate-fade-up [animation-delay:160ms]">
          Howdy <span class="inline-block">👋</span> I'm
          <span class="bg-gradient-to-r from-accent to-cyan-400 bg-clip-text text-transparent">Dale</span>
        </h1>

        <p class="mx-auto mt-6 max-w-2xl text-lg leading-8 text-fg-muted animate-fade-up [animation-delay:240ms]">
          A Toronto-based digital architect building for the web and the agentic era — from Angular, NodeJS and GCP to
          production AI agents and the Model Context Protocol.
        </p>

        <div class="mt-10 flex flex-wrap items-center justify-center gap-3 animate-fade-up [animation-delay:320ms]">
          <a
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            [routerLink]="'/'"
            fragment="contact"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Let's work together
          </a>
          <a
            class="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-5 py-2.5 text-sm font-semibold text-fg transition hover:bg-surface-2 hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            routerLink="/blog"
          >
            Read my thoughts
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <ul class="mt-10 flex flex-wrap items-center justify-center gap-2 animate-fade-up [animation-delay:400ms]">
          @for (tech of techStack; track tech) {
            <li class="rounded-full border border-border bg-surface/50 px-3 py-1 text-xs font-medium text-fg-muted">
              {{ tech }}
            </li>
          }
        </ul>
      </div>
    </section>
  `,
})
export class IntroComponent {
  readonly techStack = ['Angular', 'GCP', 'Node.js', 'AI Agents', 'MCP', 'TypeScript']
}
