import { injectContentFiles } from '@analogjs/content'
import { MetaTag } from '@analogjs/router'
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router'
import { PostAttributes } from './models'

// temporary
function injectActivePostAttributes(route: ActivatedRouteSnapshot): PostAttributes {
  const slug = route.params['slug']
  return injectContentFiles<PostAttributes>().find(
    (contentFile) =>
      // match by frontmatter slug (works for any path/extension), falling back
      // to the filename for posts without an explicit slug
      contentFile.attributes.slug === slug ||
      contentFile.filename === `/src/content/${slug}.md` ||
      contentFile.filename === `/src/content/${slug}.agx`,
  )!.attributes
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
