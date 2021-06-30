import * as dotenv from "dotenv";

const config = dotenv.config()

// console.log(config);
// console.log(process.env);


export const environment = {
  production: false,
  openAIKey: config.parsed['OPENAI_API_KEY']
}
