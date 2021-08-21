import { EngineName, BaseModel } from '.'

// https://beta.openai.com/docs/api-reference/answers/create

export interface AnswerRequest extends BaseModel {
  /**
   * ID of the engine to use for completion.
   */
  model: EngineName

  /**
   * Question to get answered.
   */
  question: string

  /**
   * List of (question, answer) pairs that will help steer the model towards the tone and answer format you'd like.
   * We recommend adding 2 to 3 examples.
   */
  examples: string[][]

  /**
   * A text snippet containing the contextual information used to generate the answers for the `examples` you provide.
   * */
  examples_context: string
}

export interface AnswerDocument {
  document: number
  text: string
}

export interface AnswerResponse {
  answers: string[]
  completion: string
  model: string
  file: string
  object: 'answer'
  search_model: EngineName
  selected_documents: AnswerDocument[]
}
