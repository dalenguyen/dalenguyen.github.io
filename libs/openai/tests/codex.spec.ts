import * as dotenv from 'dotenv'
import { OpenAI } from '../src/lib/base'
import { CompletionRequest, EngineName } from '../src/models'

const config = dotenv.config()
const apiKey = config.parsed['OPENAI_API_KEY']

describe('OpenAI - Base', () => {
  let openAI: OpenAI

  beforeAll(() => {
    openAI = new OpenAI(apiKey)
  })

  it('Say "Hello" - Python', async () => {
    const completionRequest: CompletionRequest = {
      prompt: '"""\nAsk the user for their name and say "Hello"\n"""',
      temperature: 0,
      max_tokens: 64,
      top_p: 1,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    }

    const completion = await openAI.createCompletion(EngineName.DavinciCodex, completionRequest)

    expect(completion.object).toEqual('text_completion')
    expect(completion.choices).toHaveLength(1)
    expect(completion.choices[0].text).toEqual('\n\nname = input("What is your name? ")\nprint("Hello " + name)')
  }, 60000)
})
