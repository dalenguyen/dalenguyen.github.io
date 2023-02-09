import { RouteMeta } from '@analogjs/router'
import { HomeComponent } from '@dalenguyen/portfolio/home/feature'

export const routeMeta: RouteMeta = {
  title: 'Home | Dale Nguyen',

  meta: [
    { name: 'og:title', content: 'Home | Dale Nguyen' },
    {
      name: 'og:description',
      content: `Just a normal person who tries to explore the world and find his purpose.`,
    },
    { name: 'og:url', content: 'https://dalenguyen.me' },
    {
      name: 'og:image',
      content: 'https://dalenguyen.me/assets/images/dale-nguyen-avatar.jpeg',
    },
    { name: 'type', content: 'website' },
  ],
}

export default HomeComponent
