import * as dotenv from 'dotenv'
import { AnswerRequest, ClassificationRequest, CompletionRequest, EngineName } from '../models'
import { OpenAI } from './base'
import { text2JsonlFile } from './util'

const config = dotenv.config()
const apiKey = config.parsed['OPENAI_API_KEY']

describe('OpenAI', () => {
  let openAI: OpenAI

  beforeAll(() => {
    openAI = new OpenAI(apiKey)
  })

  it('Get Engines', async () => {
    const engines = await openAI.engines()
    expect(engines.object).toEqual('list')
    expect(engines.data.length).toBeGreaterThan(4)
  }, 60000)

  it('Create completion from engine', async () => {
    const completionRequest: CompletionRequest = {
      prompt: `Once upon a time...`,
      temperature: 0.7,
      max_tokens: 100,
      top_p: 1,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stop: ['\n'],
    }

    const completion = await openAI.createCompletion(EngineName.Curie, completionRequest)

    expect(completion.object).toEqual('text_completion')
    expect(completion.choices).toHaveLength(1)
  }, 60000)

  it('Create Answer', async () => {
    const question: AnswerRequest = {
      documents: ['Puppy A is happy.', 'Puppy B is sad.'],
      model: EngineName.Curie,
      question: 'which puppy is happy?',
      examples: [['What is human life expectancy in the United States?', '78 years.']],
      examples_context: 'In 2017, U.S. life expectancy was 78.6 years.',
    }

    const result = await openAI.createAnswer(question)

    // console.log(result)

    expect(result.object).toEqual('answer')
    expect(result.answers).toHaveLength(1)
    expect(result.selected_documents).toHaveLength(2)
  }, 60000)

  it('Text Conversion', async () => {
    const text = 'This is first sentence. The is second sentence'
    const savedFile = text2JsonlFile(text)

    expect(savedFile.status).toEqual('success')
    expect(savedFile.fileName).toEqual('converted.jsonl')
  }, 60000)

  it('List files', async () => {
    const files = await openAI.listFiles()
    expect(files.object).toEqual('list')
    expect(files.data).toBeDefined()
  }, 60000)

  it('Create Classification', async () => {
    const classificationRequest: ClassificationRequest = {
      examples: [
        ['A happy moment', 'Positive'],
        ['I am sad.', 'Negative'],
        ['I am feeling awesome', 'Positive'],
      ],
      query: 'It is a raining day :(',
      search_model: EngineName.Ada,
      model: 'curie',
      labels: ['Positive', 'Negative', 'Neutral'],
    }

    const result = await openAI.createClassification(classificationRequest)

    expect(result.object).toEqual('classification')
    expect(result.label).toEqual('Negative')
  }, 60000)

  it('List fine-tunes', async () => {
    const files = await openAI.listFinetunes()
    expect(files.object).toEqual('list')
    expect(files.data).toBeDefined()
  }, 60000)
})
