---
title: Building PDF Open Source Services with Angular & GCP - PDF AI Chat
slug: 2025-03-10-building-open-source-pdf-services-with-angular-and-gcp-pdf-ai-chat
description: Welcome to the first part of the journey in building open source PDF service using Angular (Analogjs), Firestore, Cloud Storage, and CloudRun. This project serves as a platform for sharing my knowledge, continually learning best practices, and simultaneously contributing to the community.
categories: ['angular', 'tutorial', 'gcp']
coverImage: https://dalenguyen.me/assets/images/blog/angular-pdf-service.webp
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-03-10T15:17:31.359Z
author: Dale Nguyen
series: PDFun - Open Source PDF Services
---

Welcome to the first part of the journey in building open source PDF service using Angular (Analogjs), Firestore, Cloud Storage, and CloudRun. This project serves as a platform for sharing my knowledge, continually learning best practices, and simultaneously contributing to the community.

Demo: <https://pdfun.xyz>

GitHub - [dalenguyen/pdfun](https://github.com/dalenguyen/pdfun)

The solution is built around GCP ecosystem, it’s better to deploy the project on GCP, so it can access their services. There are two parts of the solution:

- Web UI (Analogjs - Angular): handle user interaction
- Backend (Node - Express): process PDF files

In this part, we will explore the process of building a solution that you can chat with your PDF file using AI.

## Architecture Overview

<figure>
  <img src="assets/images/blog/pdf-ai-chat-architecture.webp" alt="Architecture Overview of PDF AI Chat" width="100%" height="auto" style="aspect-ratio: 16/9;" />
  <figcaption>Architecture Overview of PDF AI Chat</figcaption>
</figure>

In general, there’re two parts of the process: uploading PDF file & Chat with your PDF.

### Uploading PDF file

This is the first step before you can chat with your PDF - uploading a PDF file. Here is the process:

1. User uploads an PDF file -> Cloud Storage -> Save metadata to Firestore
2. Firestore -> trigger PDF service (cloud run service)

- Create an OpenAI assistant
- Download PDF file from Cloud storage
- Upload PDF file -> OpenAI -> vector store
- Add vector store -> OpenAI Assistant
- Save assistant data -> Firestore

```typescript
// pdf-chat.handler.ts

export const handlePDFChat = async (uploadedFileData: UploadedFile, documentPath: string) => {
  const filePath = await downloadFile(uploadedFileData)
  const assistant = await createAIAssistant()
  console.log(`Created assistant - ${assistant.id}`)

  const vectorStore = await uploadLoadFileAndAddToVectorStore(filePath)
  console.log(`Created vector store - ${vectorStore.name}`)

  const result = await addVectorStoreToAssistant(assistant, vectorStore)
  console.log(`Assigned vector store (${vectorStore.name}) to assistant (${assistant.id})`)

  await updateDocument(documentPath, { assistant: result })
  console.log(`Finished uploading ${uploadedFileData.fileName}`)
}
```

### Chat with your PDF

This is the next step after your PDF file is processed. After you upload your PDF file, you will be redirected to a chat page with the document id in the param, so we can use it to retrieve data from firestore.

```typescript
//pdf-chat/index.page.ts

override async onUpload(event: FileUploadHandlerEvent) {
// set a new document Id if users want to retry without reloading the page
this.currentID.set(nanoid())

    const file = event.files[0]

    if (file) {
      this.loading.set(true)

      const fileName = `pdfun-${String(Date.now())}.pdf`

      // Upload file to Cloud Storage
      const storageRef = ref(
        this.storage,
        `${this.generateFilePath()}/${fileName}`
      )
      const result = await uploadBytesResumable(storageRef, file)

      // Update file data to Firestore
      if (result.state === 'success') {
        const uploadFileData: UploadedFile = {
          fileName,
          pdfId: this.currentID(),
          taskType: TaskType.PDF_CHAT,
          ...
        }

        await setDoc(this.docRef(), uploadFileData)

        // Navigate to the chat page after uploading <----------
        this.router.navigate([`pdf-chat/${this.currentID()}`], {
          state: {
            filePath: this.generateFilePath(),
            fileName: file.name,
          },
        })
      } else {
        this.loading.set(false)
        this.errorMessage.set('Failed to upload file. Please try again later.')
      }
    }
}
```

Since we have the assistant id saved from the previous process, so every time you send a chat message, the assistant id is included, so you can chat with the correct data.

On the chat page, we need to listen to the document, and make sure that the `assistant` exists before chatting.

```typescript
// [pdfId].page.ts

async ngOnInit(): Promise<void> {
const docRef = doc(this.firestore, `${this.filePath}/${this.pdfId()}`)

const unsubscribe = onSnapshot(
  docRef as DocumentReference<UploadedFile>,
  (doc) => {
  if (doc.data()?.assistant) {

          // Assistant exists!
          this.assistant.set(doc.data()?.assistant)
          this.loading.set(false)
          unsubscribe()
        }
      },
      (error: Error) => {
        this.response.set(error.message)
      }
  )
}
```

<figure>
  <img src="assets/images/blog/pdf-chat-is-ready.webp" alt="Chat is ready" width="100%" height="auto" style="aspect-ratio: 16/9;" />
  <figcaption>Chat is ready</figcaption>
</figure>

After that, each chat message will include the assistant, so the backend don’t need to read data from Firestore.

```typescript
// [pdfId].page.ts

async sendChat(assistantId: string) {
this.response.set('')
if (this.prompt().trim() === '') return

    this.responseLoading.set(true)

    try {
      const result = await lastValueFrom(
        this.http.post<{ response: string; threadId?: string }>(
          '/api/v1/chat',
          {
            prompt: this.prompt(),
            assistantId,
            threadId: this.threadId(),
          }
        )
      )

      if (result.threadId) {
        this.threadId.set(result.threadId)
      }

      this.response.set(result.response)
    } catch (error) {
      this.response.set('Error processing your request. Please try again.')
    } finally {
      this.responseLoading.set(false)
      this.prompt.set('')
    }
}
```

<figure>
  <img src="assets/images/blog/pdf-the-first-chat.webp" alt="The first chat" width="100%" height="auto" style="aspect-ratio: 16/9;" />
  <figcaption>The first chat</figcaption>
</figure>

For the backend that handles the chat, I’m using Analogjs, so it’s included. You can create any API that you want to the handle the chat.

```typescript
// chat.post.ts

export default defineEventHandler(async (event) => {
  const { assistantId, prompt, threadId } = await readBody(event)

  try {
    // Reuse existing thread or create new one
    const thread = threadId ? await openai.beta.threads.retrieve(threadId) : await openai.beta.threads.create()

    // Add message to existing thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: prompt,
    })

    // Run the thread and wait for the result
    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistantId,
    })

    // Retrieve messages from the thread run
    const messages = await openai.beta.threads.messages.list(thread.id, {
      run_id: run.id,
    })

    // Get the last message from the retrieved messages
    const message = messages.data.pop()!

    let response = ''

    // Check if the message content is not empty and is of type 'text'
    if (message.content.length > 0 && message.content[0].type === 'text') {
      const { text } = message.content[0]
      /// ......

      // Set the final response text
      response = text.value
    }

    return {
      response: response,
      threadId: thread.id,
    }
  } catch (error) {
    console.error('Chat error:', error)
    return {
      response: 'Error processing your request',
      threadId: null,
    }
  }
})
```

<figure>
  <img src="assets/images/blog/pdf-second-chat-with-thread.webp" alt="Second chat will include threadId for persistent previous context
" width="100%" height="auto" style="aspect-ratio: 16/9;" />
  <figcaption>Second chat will include threadId for persistent previous context
</figcaption>
</figure>

Now we a fully running solution for chatting with your PDF files using OpenAI and https://pdfun.xyz.

## Questions?

If you have any questions or run into any issues, please don’t hesitate to [create an issue](https://github.com/dalenguyen/pdfun/issues) on our GitHub repository. Alternatively, you can chat with me. I’m here to help and would love to hear your feedback.

Stay tuned for the next part. Until then, happy coding!
