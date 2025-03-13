import { injectContent, MarkdownComponent } from '@analogjs/content'
import { RouteMeta } from '@analogjs/router'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { PostAttributes } from '../../blog/models'
import { postMetaResolver, postTitleResolver } from '../../blog/resolvers'

export const routeMeta: RouteMeta = {
  title: postTitleResolver,
  meta: postMetaResolver,
}

@Component({
  standalone: true,
  imports: [CommonModule, MarkdownComponent, RouterLink],
  template: `
      <div class="relative px-6 lg:px-8">
        <nav class="flex py-4" aria-label="Breadcrumb">
          <ol class="inline-flex items-center space-x-1 md:space-x-3">
            <li class="inline-flex items-center">
              <a routerLink="/" class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                <svg class="w-3 h-3 mr-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
                </svg>
                Home
              </a>
            </li>
            <li>
              <div class="flex items-center">
                <svg class="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                </svg>
                <a routerLink="/blog" class="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2">Blog</a>
              </div>
            </li>
            <li aria-current="page" *ngIf="post$ | async as post">
              <div class="flex items-center">
                <svg class="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                </svg>
                <span class="ml-1 text-sm font-medium text-gray-500 md:ml-2 truncate max-w-xs">{{ post.attributes.title }}</span>
              </div>
            </li>
          </ol>
        </nav>
        <div class="mx-auto max-w-prose text-lg text-center mt-8">
          <ng-container *ngIf="post$ | async as post">
            <h1>{{ post.attributes.title }}</h1>
            <analog-markdown [content]="post.content" />
          </ng-container>
        </div>
      </div>
  `,
})
export default class BlogPostComponent {
  readonly post$ = injectContent<PostAttributes>()
}
