import {
  getParsedFileContentBySlug, MarkdownRenderingResult, renderMarkdown
} from '@dalenguyen/markdown';
import { mdxElements } from '@dalenguyen/shared/mdx-elements';
import fs from 'fs';
import { GetStaticPaths, GetStaticProps } from "next";
import { MDXRemote } from 'next-mdx-remote';
import { join } from 'path';
import { ParsedUrlQuery } from "querystring";

const POSTS_PATH = join(process.cwd(), '_articles');

interface ArticleProps extends ParsedUrlQuery {
  slug: string;
}


export const getStaticPaths: GetStaticPaths<ArticleProps> = async () => {
  const paths = fs
    .readdirSync(POSTS_PATH)
    // Remove file extensions for page paths
    .map((path) => path.replace(/\.mdx?$/, ''))
    // Map the path into the static paths object required by Next.js
    .map((slug) => ({ params: { slug } }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<MarkdownRenderingResult> = async ({
  params,
}: {
  params: ArticleProps;
}) => {

  const articleMarkdownContent = getParsedFileContentBySlug(params.slug, POSTS_PATH);
  const renderedHTML = await renderMarkdown(articleMarkdownContent.content);


  return {
    props: {
      frontMatter: articleMarkdownContent.frontMatter,
      html: renderedHTML,
    },
  };
};

export function Article({ frontMatter, html }) {  
  return (
    <div className="md:container md:mx-auto">
    <article>
      <h1 className="text-3xl font-bold hover:text-gray-700 pb-4">
        {frontMatter.title}
      </h1>
      <div>by {frontMatter.author.name}</div>
      <hr />
      <br />

      <MDXRemote {...html} components={mdxElements} />
    </article>
  </div>
  );
}

export default Article
