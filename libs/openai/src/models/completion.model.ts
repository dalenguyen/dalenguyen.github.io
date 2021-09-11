import { BaseModel } from './base.model'

export interface CompletionRequest extends BaseModel {
  /**
   * The prompt(s) to generate completions for, encoded as a string, a list of strings, or a list of token lists.
   * Note that <|endoftext|> is the document separator that the model sees during training,
   * so if a prompt is not specified the model will generate as if from the beginning of a new document.
   */
  prompt?: string | string[]

  /**
   * An alternative to sampling with temperature, called nucleus sampling,
   * where the model considers the results of the tokens with top_p probability mass.
   * So 0.1 means only the tokens comprising the top 10% probability mass are considered.
   * We generally recommend altering this or temperature but not both.
   */
  top_p?: number

  /**
   * Whether to stream back partial progress.
   * If set, tokens will be sent as data-only server-sent events as they become available,
   * with the stream terminated by a data: [DONE] message.
   */
  stream?: boolean

  /**
   * Echo back the prompt in addition to the completion
   */
  echo?: boolean

  /**
   * Number between 0 and 1 that penalizes new tokens based on whether they appear in the text so far.
   * Increases the model's likelihood to talk about new topics.
   */
  presence_penalty?: number

  /**
   * Number between 0 and 1 that penalizes new tokens based on their existing frequency in the text so far.
   * Decreases the model's likelihood to repeat the same line verbatim.
   */
  frequency_penalty?: number

  /**
   * Generates best_of completions server-side and returns the "best" (the one with the lowest log probability per token).
   * Results cannot be streamed. When used with n, best_of controls the number of candidate completions and n specifies how many to return – best_of must be greater than n.
   */
  best_of?: number

  /**
   * Fine-tune model if possible
   */
  model?: string
}

export interface CompletionChoice {
  text: string
  index: number
  logprobs: null | number
  finish_reason: string
}

export interface CompletionResponse {
  id: string
  object: 'text_completion'
  created: number
  model: string
  choices: CompletionChoice[]
}
