import { ChangeDetectionStrategy, Component } from '@angular/core'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-contact',
  standalone: true,
  template: `
    <section id="contact" class="relative isolate overflow-hidden border-t border-border bg-surface/40">
      <!-- accent glow -->
      <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 -bottom-48 -z-10 flex justify-center blur-3xl">
        <div
          class="aspect-[1100/600] w-[60rem] max-w-none bg-gradient-to-tr from-accent-fill/30 via-accent/20 to-cyan-400/20 opacity-40 bg-[length:200%_200%] animate-gradient-pan"
        ></div>
      </div>

      <div class="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-accent">Contact</h2>
          <p class="mt-2 text-3xl font-bold tracking-tight text-fg sm:text-4xl">Let's work together</p>
          <p class="mt-4 text-lg leading-7 text-fg-muted">If you have something interesting, shoot me an email.</p>

          <div class="mt-8 flex justify-center">
            <a
              href="mailto:dale@dalenguyen.me"
              class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Email me
            </a>
          </div>

          <div class="mt-10">
            <p class="mb-4 text-sm text-fg-muted">Or connect with me on social media:</p>
            <div class="flex justify-center gap-6">
              <a
                href="https://www.linkedin.com/in/dalenguyenblogger/"
                target="_blank"
                rel="noopener"
                class="text-fg-muted transition-colors duration-300 hover:text-accent"
              >
                <span class="sr-only">LinkedIn</span>
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 448 512" aria-hidden="true">
                  <path
                    d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"
                  ></path>
                </svg>
              </a>
              <a
                href="https://github.com/dalenguyen"
                target="_blank"
                rel="noopener"
                class="text-fg-muted transition-colors duration-300 hover:text-accent"
              >
                <span class="sr-only">GitHub</span>
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clip-rule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="https://twitter.com/dale_nguyen"
                target="_blank"
                rel="noopener"
                class="text-fg-muted transition-colors duration-300 hover:text-accent"
              >
                <span class="sr-only">Twitter</span>
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"
                  />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@dale_nguyen"
                target="_blank"
                rel="noopener"
                class="text-fg-muted transition-colors duration-300 hover:text-accent"
              >
                <span class="sr-only">YouTube</span>
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z"
                    clip-rule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class ContactComponent {}
