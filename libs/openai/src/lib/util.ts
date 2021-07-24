import * as fs from 'fs'
import { FilePurpose } from '../models'

export const text2JsonlFile = (text: string, filePath = 'converted.jsonl', purpose = FilePurpose.Answers) => {
  const localFilePath = filePath === 'converted.jsonl' ? process.cwd() + '/' + filePath : filePath
  const stream = fs.createWriteStream(localFilePath, { flags: 'a' })
  let phrases

  switch (purpose) {
    case FilePurpose.Answers:
      console.log(`Prepare for 'Answers' purpose`)
      phrases = text.split('.')
      phrases.forEach((item) => {
        if (item.trim() !== '') {
          const sentence = `{"text": ${item.trim()}}`
          stream.write(sentence + '\n')
        }
      })
      break

    default:
      console.log(`We only support type 'Answers' for now)`)
      break
  }

  stream.end()

  return {
    status: 'success',
    filePath: localFilePath,
    fileName: filePath.split('/').pop(),
  }
}
