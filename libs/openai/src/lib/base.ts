import axios, { AxiosRequestConfig } from 'axios'
import * as FormData from 'form-data'
import * as fs from 'fs'
import {
  AnswerRequest,
  AnswerResponse,
  ClassificationRequest,
  ClassificationResponse,
  CompletionRequest,
  CompletionResponse,
  EngineName,
  FileDeleted,
  FileRequest,
  Finetune,
  FinetuneEventResponse,
  FinetuneRequest,
  ListEngine,
  ListFile,
  ListFinetunes,
  OpenAIFile,
} from '../models'

export class OpenAI {
  protected apiKey: string
  protected baseUrl = 'https://api.openai.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request<T>(
    url: string,
    method: 'GET' | 'POST' | 'DELETE',
    data?: AnswerRequest | FileRequest | ClassificationRequest | CompletionRequest | FinetuneRequest,
  ): Promise<T> {
    try {
      const options: AxiosRequestConfig = {
        method,
        url,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }

      if (method !== 'GET') {
        options.data = data || ''
      }

      // TODO - better type checking for data
      // Upload file
      if (data?.['file'] != null && data?.['purpose'] != null) {
        const formData = new FormData()
        formData.append('purpose', data['purpose'])
        formData.append('file', fs.createReadStream(data['file']))

        options.headers = {
          ...options.headers,
          ...formData.getHeaders(),
        }

        options.data = formData
      }

      const response = await axios(options)

      return response.data
    } catch (error) {
      throw new Error(error?.response?.data?.error?.message || error?.message || 'Something wrong happened!')
    }
  }

  engines(): Promise<ListEngine> {
    return this.request<ListEngine>(`${this.baseUrl}/engines`, 'GET')
  }

  createAnswer(data: AnswerRequest): Promise<AnswerResponse> {
    return this.request<AnswerResponse>(`${this.baseUrl}/answers`, 'POST', data)
  }

  // FILES
  listFiles(): Promise<ListFile> {
    return this.request<ListFile>(`${this.baseUrl}/files`, 'GET')
  }

  retrieveFile(fileId: string): Promise<OpenAIFile> {
    return this.request<OpenAIFile>(`${this.baseUrl}/files/${fileId}`, 'GET')
  }

  retrieveFileContent(fileId: string): Promise<OpenAIFile> {
    return this.request<OpenAIFile>(`${this.baseUrl}/files/${fileId}/content`, 'GET')
  }

  uploadFile(data: FileRequest): Promise<OpenAIFile> {
    return this.request<OpenAIFile>(`${this.baseUrl}/files`, 'POST', data)
  }

  deleteFile(fileId: string): Promise<FileDeleted> {
    return this.request<FileDeleted>(`${this.baseUrl}/files/${fileId}`, 'DELETE')
  }

  // CLASSIFICATIONS
  createClassification(data: ClassificationRequest): Promise<ClassificationResponse> {
    return this.request<ClassificationResponse>(`${this.baseUrl}/classifications`, 'POST', data)
  }

  // COMPLETIONS
  createCompletion(engine: EngineName, data: CompletionRequest): Promise<CompletionResponse> {
    return this.request<CompletionResponse>(`${this.baseUrl}/engines/${engine}/completions`, 'POST', data)
  }

  createCompletionFromModel(data: CompletionRequest): Promise<CompletionResponse> {
    return this.request<CompletionResponse>(`${this.baseUrl}/completions`, 'POST', data)
  }

  // FINE-TUNE
  listFinetunes(): Promise<ListFinetunes> {
    return this.request<ListFinetunes>(`${this.baseUrl}/fine-tunes`, 'GET')
  }

  listFinetuneEvents(finetuneId: string): Promise<FinetuneEventResponse> {
    return this.request<FinetuneEventResponse>(`${this.baseUrl}/fine-tunes/${finetuneId}/events`, 'GET')
  }

  cancelFinetune(finetuneId: string): Promise<Finetune> {
    return this.request<Finetune>(`${this.baseUrl}/fine-tunes/${finetuneId}/cancel`, 'POST')
  }

  createFinetune(data: FinetuneRequest): Promise<Finetune> {
    return this.request<Finetune>(`${this.baseUrl}/fine-tunes`, 'POST', data)
  }

  retrieveFinetune(finetuneId: string): Promise<Finetune> {
    return this.request<Finetune>(`${this.baseUrl}/fine-tunes/${finetuneId}`, 'GET')
  }

  // CONTENT FILTERS
  contentFilter(data: CompletionRequest): Promise<CompletionResponse> {
    // use default settings
    // https://beta.openai.com/docs/engines/how-do-you-use-the-filter
    const updatedData = {
      ...data,
      prompt: data.prompt.indexOf('<|endoftext|>') > -1 ? data.prompt : `<|endoftext|>${data.prompt}\n--\nLabel:`,
      max_tokens: data.max_tokens || 1,
      temperature: data.temperature || 0.0,
      top_p: data.top_p || 0,
      logprobs: data.logprobs || 100,
    }

    return this.request<CompletionResponse>(
      `${this.baseUrl}/engines/content-filter-alpha-c4/completions`,
      'POST',
      updatedData,
    )
  }
}
