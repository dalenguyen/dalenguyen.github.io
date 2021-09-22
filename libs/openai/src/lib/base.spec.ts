import * as dotenv from 'dotenv'
import { AnswerRequest, ClassificationRequest, CompletionRequest, CompletionResponse, EngineName } from '../models'
import { OpenAI } from './base'
import { isContentSafe, text2JsonlFile } from './util'

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
      logprobs: 1,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stop: ['\n'],
    }

    const completion = await openAI.createCompletion(EngineName.Davinci, completionRequest)

    expect(completion.object).toEqual('text_completion')
    expect(completion.choices).toHaveLength(1)
    expect(completion.choices[0].logprobs).toBeDefined()
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

  it('Content filter', async () => {
    const content = await openAI.contentFilter({ prompt: `You're a big pig!` })
    expect(content.object).toEqual('text_completion')
    expect(content.choices[0].logprobs.top_logprobs).toBeDefined()
  }, 60000)

  it('Is content safe?', async () => {
    const response = {
      id: 'cmpl-3kM9tatOg9RKGm92fxfFsMUyXYjQj',
      object: 'text_completion',
      created: 1632177277,
      model: 'toxicity-double-18',
      choices: [
        {
          text: '2',
          index: 0,
          logprobs: {
            tokens: ['2'],
            token_logprobs: [-0.0000724364],
            top_logprobs: [
              {
                '0': -10.44776,
                '1': -10.306609,
                '2': -0.0000724364,
                '3': -12.755058,
                '4': -14.482331,
                '5': -14.977424,
                '6': -15.776937,
                '7': -16.151781,
                '8': -16.41714,
                '9': -16.96813,
                '10': -18.07914,
                '12': -18.496382,
                '!': -18.478472,
                It: -18.13568,
                what: -16.369093,
                We: -18.400267,
                the: -17.329096,
                This: -17.416876,
                oh: -18.156015,
                gt: -16.914577,
                '/': -17.176352,
                He: -18.428219,
                You: -17.394817,
                not: -17.802439,
                ' bullshit': -18.493778,
                What: -17.083782,
                why: -17.828255,
                How: -17.678377,
                he: -18.266256,
                re: -18.083364,
                it: -17.543606,
                '>': -17.50221,
                as: -17.70416,
                ll: -18.37475,
                ' asshole': -17.69392,
                '?': -16.74317,
                fuck: -15.86569,
                A: -17.557634,
                B: -18.180685,
                C: -18.172163,
                Fuck: -16.80401,
                D: -17.532698,
                '??': -18.087122,
                if: -18.353895,
                ' 2': -14.750179,
                F: -16.709352,
                G: -18.178196,
                H: -17.672983,
                no: -17.469284,
                and: -18.376867,
                I: -15.626488,
                th: -18.227945,
                http: -18.029413,
                K: -18.16579,
                L: -18.253916,
                end: -18.170355,
                M: -18.330359,
                N: -17.516209,
                do: -16.783812,
                ak: -18.268692,
                The: -17.753933,
                P: -18.147144,
                how: -16.977543,
                T: -18.468407,
                Why: -17.615562,
                U: -17.311522,
                W: -17.899305,
                that: -18.163754,
                ass: -18.084736,
                this: -17.319904,
                so: -17.869379,
                Oh: -17.941038,
                you: -17.160475,
                a: -17.124113,
                b: -17.446665,
                c: -16.586987,
                d: -16.94719,
                f: -15.344229,
                g: -17.92359,
                h: -16.697206,
                i: -16.788227,
                j: -16.884907,
                we: -17.844076,
                k: -16.421576,
                l: -17.574291,
                m: -17.648815,
                n: -16.528507,
                p: -18.160578,
                s: -16.709784,
                Who: -17.799694,
                t: -18.202757,
                yes: -18.395456,
                '==': -18.186659,
                w: -17.79637,
                x: -18.347416,
                who: -17.116364,
                y: -17.60011,
                z: -17.979704,
                '|': -17.321615,
                '...': -17.809526,
              },
            ],
            text_offset: [45],
          },
          finish_reason: 'length',
        },
      ],
    } as CompletionResponse

    const accepted = isContentSafe(response)

    expect(accepted).toBe(false)
  })
})
