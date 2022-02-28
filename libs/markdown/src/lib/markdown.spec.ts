import { renderMarkdown } from './markdown'

describe('markdown', () => {
  it('should work', () => {
    expect(renderMarkdown('markdown')).toEqual('markdown')
  })
})
