import { render } from '@testing-library/react'

import SharedMdxElements from './shared-mdx-elements'

describe('SharedMdxElements', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<SharedMdxElements />)
    expect(baseElement).toBeTruthy()
  })
})
