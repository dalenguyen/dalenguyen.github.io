export interface PostAttributes {
  title: string
  slug: string
  description: string
  coverImage: string
  categories: string[]
  published: string
  profileImage: string
  author: {
    firstName: string
    lastName: string
  }
}
