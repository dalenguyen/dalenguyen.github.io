import axios, { AxiosRequestConfig } from 'axios'
import { ListEngine } from '../models'

export class OpenAI {
  protected apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request(url: string, method: 'GET' | 'POST', data?: any): Promise<ListEngine> {

    const options: AxiosRequestConfig = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      }
    }

    if (data!= null) {
      options.data = data
    }

    const response = await axios(options).catch((err) => {
      throw new Error(err)
    })

    return response.data
  }

  engines() {
    return this.request('https://api.openai.com/v1/engines', 'GET')
  }
}
