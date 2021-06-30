import axios, { AxiosRequestConfig } from 'axios'
import { ListEngine, AnswerResponse, AnswerRequest } from '../models'

export class OpenAI {
  protected apiKey: string
  protected baseUrl = 'https://api.openai.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request<T>(url: string, method: 'GET' | 'POST', data?: AnswerRequest): Promise<T> {
    try {
      const options: AxiosRequestConfig = {
        method,
        url,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        data: data || ''
      }

      const response = await axios(options)

      return response.data
    } catch (error) {
      // console.log(`EWRRRO----`, error.response.status);
      // console.log(`EWRRRO----`, error.response.data);
      throw new Error(error?.response?.data?.error?.message || error?.message || 'Something wrong happened!')
    }
  }

  engines(): Promise<ListEngine> {
    return this.request<ListEngine>(`${this.baseUrl}/engines`, 'GET')
  }

  createAnswer(data: AnswerRequest): Promise<AnswerResponse> {
    return this.request<AnswerResponse>(`${this.baseUrl}/answers`, 'POST', data)
  }
}
