import { injectContentFiles } from '@analogjs/content'
import { MetaTag } from '@analogjs/router'
import { DOCUMENT } from '@angular/common'
import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router'
import { PostAttributes } from './models'

// temporary
function injectActivePostAttributes(route: ActivatedRouteSnapshot): PostAttributes {
  const slug = route.params['slug']
  const contentFile = injectContentFiles<PostAttributes>().find(
    (contentFile) =>
      // match by frontmatter slug (works for any path/extension), falling back
      // to the filename for posts without an explicit slug
      contentFile.attributes.slug === slug ||
      contentFile.filename === `/src/content/${slug}.md` ||
      contentFile.filename === `/src/content/${slug}.agx`,
  )
  if (!contentFile) {
    throw new Error(`Blog post not found for slug "${slug}"`)
  }
  return contentFile.attributes
}

export const postTitleResolver: ResolveFn<string> = (route) => injectActivePostAttributes(route).title

export const postMetaResolver: ResolveFn<MetaTag[]> = (route) => {
  const postAttributes = injectActivePostAttributes(route)

  return [
    {
      name: 'description',
      content: postAttributes.description,
    },
    {
      name: 'author',
      content: 'Dale Nguyen',
    },
    {
      property: 'og:title',
      content: postAttributes.title,
    },
    {
      property: 'og:description',
      content: postAttributes.description,
    },
    {
      property: 'og:image',
      content: postAttributes.coverImage,
    },
  ]
}

// Runs at route-resolution time (before the component mounts) rather than as a
// component-level effect() — that ran too late to make it into the prerendered
// SSG HTML (GSC was reporting "no user-declared canonical" on every post,
// likely feeding the large "Crawled - currently not indexed" bucket). Fixed at
// the prod origin regardless of which origin served the request, so preview
// deployments canonicalize to prod instead of getting indexed as duplicates.
export const postCanonicalResolver: ResolveFn<void> = (route) => {
  const { slug } = injectActivePostAttributes(route)
  const document = inject(DOCUMENT)
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', `https://dalenguyen.me/blog/${slug}`)
}
