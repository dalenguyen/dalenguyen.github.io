import axios, { AxiosRequestConfig } from 'axios'
import {
  ListEngine,
  AnswerResponse,
  AnswerRequest,
  ListFile,
  OpenAIFile,
  FileRequest,
  FileDeleted,
  ClassificationRequest,
  ClassificationResponse,
  CompletionRequest,
  CompletionResponse,
  EngineName,
} from '../models'
import * as FormData from 'form-data'
import * as fs from 'fs'

export class OpenAI {
  protected apiKey: string
  protected baseUrl = 'https://api.openai.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request<T>(
    url: string,
    method: 'GET' | 'POST' | 'DELETE',
    data?: AnswerRequest | FileRequest | ClassificationRequest | CompletionRequest,
  ): Promise<T> {
    try {
      const options: AxiosRequestConfig = {
        method,
        url,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        data: data || '',
      }

      // TODO - better type checking for data
      // Upload file
      if (data?.file != null && data?.['purpose'] != null) {
        const formData = new FormData()
        formData.append('purpose', data['purpose'])
        formData.append('file', fs.createReadStream(data.file))

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

  // FINE-TUNE
}
