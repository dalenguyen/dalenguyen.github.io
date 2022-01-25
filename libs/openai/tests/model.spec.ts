import * as dotenv from 'dotenv'
import { OpenAI } from '../src/lib/base'
import { CompletionRequest, EngineName } from '../src/models'

const config = dotenv.config()
const apiKey = config.parsed['OPENAI_API_KEY']

describe('OpenAI - Models', () => {
  let openAI: OpenAI

  beforeAll(() => {
    openAI = new OpenAI(apiKey)
  })

  for (let engine of Object.values(EngineName)) {
    it(`Create completion from - ${engine}`, async () => {
      const completionRequest: CompletionRequest = {
        prompt: `Once upon a time...`,
        temperature: 0.7,
        max_tokens: 100,
        top_p: 1,
        logprobs: 1,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        stop: ['\n'],
      }

      const completion = await openAI.createCompletion(engine, completionRequest)

      expect(completion.object).toEqual('text_completion')
      expect(completion.choices).toHaveLength(1)
      expect(completion.choices[0].logprobs).toBeDefined()
    }, 60000)
  }
})
