import * as fs from 'fs'
import { CompletionResponse, FilePurpose } from '../models'

export const text2JsonlFile = (text: string, filePath = 'converted.jsonl', purpose = FilePurpose.Answers) => {
  const localFilePath = filePath === 'converted.jsonl' ? process.cwd() + '/' + filePath : filePath
  const stream = fs.createWriteStream(localFilePath, { flags: 'a' })
  let phrases

  switch (purpose) {
    case FilePurpose.Answers:
      // console.log(`Prepare for 'Answers' purpose`)
      phrases = text.replace(/"|“|”/g, "'").split(/\r|\n|\./)

      phrases.forEach((item) => {
        if (item.trim() !== '') {
          const sentence = `{"text": "${item.trim()}"}`
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

export const isContentSafe = (response: CompletionResponse): boolean => {
  let outputLabel = response.choices[0].text

  // This is the probability at which we evaluate that a "2" is likely real
  // vs. should be discarded as a false positive
  const toxicThreshold = -0.355

  // # If the model is not sufficiently confident in "2",
  // # choose the most probable of "0" or "1"
  // # Guaranteed to have a confidence for 2 since this was the selected token.
  if (outputLabel === '2') {
    // If the model returns "2", return its confidence in 2 or other output-labels
    const logProbs = response.choices[0].logprobs.top_logprobs[0]

    if (logProbs['2'] < toxicThreshold) {
      const logProbs0 = logProbs['0']
      const logProbs1 = logProbs['1']

      if (logProbs0 != null && logProbs1 != null) {
        if (logProbs0 > logProbs1) {
          outputLabel = '0'
        } else {
          outputLabel = '1'
        }
      }

      // If only one of them is found, set output label to that one
      if (logProbs0 != null && logProbs1 == null) {
        outputLabel = '0'
      }

      if (logProbs1 != null && logProbs0 == null) {
        outputLabel = '1'
      }

      // If neither "0" or "1" are available, stick with "2"
      // by leaving output_label unchanged.
    }
  }

  // if the most probable token is none of "0", "1", or "2"
  // this should be set as unsafe
  if (['0', '1', '2'].indexOf(outputLabel) === -1) {
    return false
  }

  return outputLabel !== '2'
}
