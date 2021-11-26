import * as dotenv from 'dotenv'

const config = dotenv.config()

export const environment = {
  production: false,
  openAIKey: config.parsed['OPENAI_API_KEY'],
}
