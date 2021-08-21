import { EngineName, BaseModel } from '.'

// https://beta.openai.com/docs/api-reference/classifications

export interface ClassificationRequest extends BaseModel {
  /**
   * Query to be classified.
   */
  query: string

  /**
   * ID of the engine to use for completion.
   */
  model: string

  // OPTIONALS

  /**
   * The set of categories being classified.
   * If not specified, candidate labels will be automatically collected from the examples you provide.
   * All the label strings will be normalized to be capitalized.
   */
  labels?: string[]
}

export interface ClassificationSelectedExample {
  document: number
  label: string
  text: string
}

export interface ClassificationResponse {
  completion: string
  label: string
  model: string
  object: 'classification'
  search_model: EngineName
  selected_examples: ClassificationSelectedExample[]
}
