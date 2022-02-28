import dynamic from 'next/dynamic';
import './shared-mdx-elements.module.scss';


export const mdxElements = {
  Youtube: dynamic(() => import('./youtube/youtube')),
}

/* eslint-disable-next-line */
export interface SharedMdxElementsProps {}

export function SharedMdxElements(props: SharedMdxElementsProps) {
  return (
    <div>
      <h1>Welcome to SharedMdxElements!</h1>
    </div>
  )
}

export default SharedMdxElements
