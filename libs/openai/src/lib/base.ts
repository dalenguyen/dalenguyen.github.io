import axios, { AxiosRequestConfig } from 'axios'
import { ListEngine, AnswerResponse, AnswerRequest, ListFile, File, FileRequest } from '../models'
import * as FormData from 'form-data'
import * as fs from 'fs'

export class OpenAI {
  protected apiKey: string
  protected baseUrl = 'https://api.openai.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request<T>(url: string, method: 'GET' | 'POST', data?: AnswerRequest | FileRequest): Promise<T> {
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
      if (data.file != null && data['purpose'] != null) {
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

  retrieveFile(fileId: string): Promise<File> {
    return this.request<File>(`${this.baseUrl}/files/${fileId}`, 'GET')
  }

  uploadFile(data: FileRequest): Promise<File> {
    return this.request<File>(`${this.baseUrl}/files`, 'POST', data)
  }
}
