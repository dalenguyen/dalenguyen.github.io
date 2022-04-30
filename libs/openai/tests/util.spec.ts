import { text2JsonlFile } from '../src/lib/util'
import { FileData } from '../src/models'

describe('OpenAI - Util', () => {
  it('Text Conversion - custom path', async () => {
    const data: FileData[] = [
      {
        text: 'This is first sentence. The is second sentence',
      },
    ]

    const filePath = `/tmp/file-${Date.now()}.jsonl`

    const savedFile = text2JsonlFile({ data, filePath })

    expect(savedFile.status).toEqual('success')
    expect(savedFile.filePath).toEqual(filePath)
    expect(savedFile.fileName).toContain('.jsonl')
  }, 60000)

  it('Text Conversion - Answer', async () => {
    const data: FileData[] = [
      {
        text: 'This is first sentence. The is second sentence',
      },
    ]
    const savedFile = text2JsonlFile({ data })

    expect(savedFile.status).toEqual('success')
    expect(savedFile.fileName).toContain('.jsonl')
  }, 60000)

  it('Text Conversion - Fine Tune', async () => {
    const data: FileData[] = [
      {
        prompt: 'How about return or refund policy?',
        completion: 'Due to the nature of digital products, which cannot be returned, we will not offer any refunds.',
      },
      {
        prompt: 'How can i see the reviews?',
        completion: 'There is no review at this moment',
      },
    ]
    const savedFile = text2JsonlFile({ data, purpose: FilePurpose.Finetune })

    expect(savedFile.status).toEqual('success')
    expect(savedFile.fileName).toContain('.jsonl')
  }, 60000)
})
