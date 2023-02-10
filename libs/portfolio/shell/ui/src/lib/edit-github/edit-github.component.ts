import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'

@Component({
  selector: 'dalenguyen-edit-github',
  standalone: true,
  imports: [CommonModule],
  template: `
    <a
      href="https://github.com/dalenguyen/dalenguyen.github.io/tree/dev/apps/blog-app"
      target="_blank"
      class="bg-slate-400 bg-opacity-75 shadow-xl absolute top-0 right-0 z-50 inline-flex items-center rounded-md border border-transparent bg-black-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      Edit
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
        />
      </svg>
    </a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditGithubComponent {}
