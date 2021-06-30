import { OpenAI } from './base'

describe('openai', () => {
  it('should work', () => {
    const openAI = new OpenAI('test')
    expect(openAI).toEqual(true)
  })
})
