export interface Article {
  author: {
    bio: string
    email: string
    facebook_url: string
    first_name: string
    instagram_url: string
    last_name: string
    linkedin_url: string
    pinterest_url: string
    profile_image: string
    slug: string
    title: string
  }
  twitter_handle: string
  body: string
  categories: Array<{ name: string; slug: string }>
  created: string
  featured_image: string
  meta_description: string
  published: string
  seo_title: string
  slug: string
  status: string
  summary: string
  tags: Array<{ name: string; slug: string }>
  title: string
  url: string
}
