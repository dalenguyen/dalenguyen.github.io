import { RouteMeta } from '@analogjs/router'
import { Component } from '@angular/core'
import ResumeComponent from '@dalenguyen/portfolio/resume/feature'

export const routeMeta: RouteMeta = {
  title: 'Resume | Dale Nguyen',
  meta: [{ name: 'description', content: 'Resume of Dale Nguyen — software engineer.' }],
}

@Component({
  standalone: true,
  imports: [ResumeComponent],
  template: `<dalenguyen-resume />`,
})
export default class ResumePageComponent {}
