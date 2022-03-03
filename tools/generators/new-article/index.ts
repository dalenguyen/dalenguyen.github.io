import { formatFiles, generateFiles, joinPathFragments, names, Tree } from '@nrwl/devkit'

interface NewArticleSchemaOptions {
  title: string
  author: string
  excerpt?: string
}

export default async function (tree: Tree, schema: NewArticleSchemaOptions) {
  generateFiles(
    // virtual file system
    tree,

    // the location where the template files are
    joinPathFragments(__dirname, './files'),

    // where the files should be generated
    './_articles',

    // the variables to be substituted in the template
    {
      title: schema.title,
      author: schema.author,
      excerpt: schema.excerpt || '',
      normalizedTitle: names(schema.title).fileName,
      creationDate: new Date().toISOString(),
    },
  )

  await formatFiles(tree)
}

// npx nx workspace-generator new-article "my generated article" --author=dalenguyen --dry-run
