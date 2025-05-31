---
title: Building PDF Open Source Services with Angular & GCP - PDF to Podcast
slug: 2025-05-31-building-open-source-pdf-services-with-angular-and-gcp-pdf-to-podcast
description: Welcome to the journey of building open source PDF service using Angular (Analogjs), Firestore, Cloud Storage, and CloudRun. This project serves as a platform for sharing my knowledge, continually learning best practices, and simultaneously contributing to the community.
categories: ['angular', 'tutorial', 'gcp']
coverImage: https://dalenguyen.me/assets/images/blog/angular-pdf-service.webp
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-05-26T15:17:31.359Z
author: Dale Nguyen
series: PDFun - Open Source PDF Services
---

Welcome to the journey of building open source PDF service using Angular (Analogjs), Firestore, Cloud Storage, and CloudRun. This project serves as a platform for sharing my knowledge, continually learning best practices, and simultaneously contributing to the community.

Demo: <https://pdfun.xyz>

GitHub - [dalenguyen/pdfun](https://github.com/dalenguyen/pdfun)

The solution is built around GCP ecosystem, it’s better to deploy the project on GCP, so it can access their services. There are two parts of the solution:

- Web UI (Analogjs - Angular): handle user interaction
- Backend (Node - Express): process PDF files

Have you ever wanted to turn your scripts, interviews, or even technical documents into engaging, conversational podcasts—without hiring voice actors? Thanks to advancements in AI, you can now synthesize realistic multi-speaker audio using Google Cloud’s Text-to-Speech (TTS) API and Node.js. In this post, I’ll show you how to create a deep-dive, two-person podcast episode with just a few lines of code.

## Architecture Overview

<figure>
  <img src="assets/images/blog/pdf-to-podcast-architecture.png" alt="Architecture Overview of PDF to Podcast" width="100%" height="auto" />
  <figcaption>Architecture Overview of PDF to Podcast</figcaption>
</figure>

In general, there’re three parts of the process:

- Upload PDF file
- Extract text from PDF file
- Convert the PDF to Podcast script
- Synthesize conversions using multi-speaker TTS

## Why Multi-Speaker TTS?

Traditional TTS is monolog—one voice, one perspective. But podcasts thrive on dialogue, debate, and personality. Google Cloud’s [latest TTS models](https://cloud.google.com/text-to-speech/docs/create-dialogue-with-multispeakers), especially the `en-US-Studio-Multispeaker` voice, let you alternate between speakers, creating a natural back-and-forth that’s perfect for podcasts, interviews, and storytelling.

---

## Prerequisites

- A Google Cloud Platform (GCP) account
- Node.js and npm installed
- `@google-cloud/text-to-speech` & `@google-cloud/vertexai` package
- `pdf-parse` package

---

## Generate Podcast from PDF

Now, let's break the steps on how to generate Podcast from an uploaded PDF file.

### Extract text from PDF

After download the PDF from Cloud storage, we will need to extract the text.

```typescript
const pdfBuffer = await pdfParse(downloadedPath)
const extractedText = pdfBuffer.text
```

### Generate the script from PDF Text

We will use `gemini-2.0-flash` and VertexAI to generate the script from text.

```typescript
const model = 'gemini-2.0-flash'
const generativeModel = vertexAI.getGenerativeModel({
  model,
  generationConfig: {
    maxOutputTokens: 2048,
    temperature: 0.4,
    topP: 0.8,
    topK: 40,
  },
})

const prompt = `Convert the following text into an engaging podcast conversation between two hosts that will be approximately 3-4 minutes long when read aloud.

Guidelines:
1. Keep the script under ${MAX_CHARS} characters to ensure it works with text-to-speech
2. Create a natural dialogue between two hosts: Yen (the expert) and Dale (the curious learner)
3. Structure the conversation to:
    - Start with a brief introduction of the topic
    - Have Dale ask thoughtful questions about key points
    - Let Yen provide clear, engaging explanations
    - Include natural transitions between topics
    - End with a brief summary and conclusion
4. Make the conversation feel natural and unscripted
5. Focus on the most important points and main ideas
6. Use conversational language and avoid overly formal tone

Text to convert:
${extractedText}`

console.log(`[PDF to Podcast] Sending prompt to Vertex AI (length: ${prompt.length} characters)`)

const result = await generativeModel.generateContent({
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
})

const script = result.response.candidates[0].content.parts[0].text
```

### Break the generated script to turns

We need to have a different format for each voice and speaker.

```typescript
// Split the conversation into turns
const conversationTurns = cleanScript
  .split(/(?=(?:Yen:|Dale:))/)
  .map((turn) => {
    if (turn.startsWith('Yen:')) {
      const text = turn.replace(/^Yen:\s*/, '').trim()
      return text
        ? {
            text,
            speaker: 'Y',
          }
        : null
    } else if (turn.startsWith('Dale:')) {
      const text = turn.replace(/^Dale:\s*/, '').trim()
      return text
        ? {
            text,
            speaker: 'D',
          }
        : null
    }
    return null
  })
  .filter((turn) => turn !== null && turn.text.length > 0)
```

### Generate and synthesize speeches

All we need to do is to loop through each conversion, generate the audio and combine it into one.

```typescript
// Process each turn separately
const audioBuffers = []
for (const turn of conversationTurns) {
  console.log(`[PDF to Podcast] Processing turn:`, turn)

  const [response] = await ttsClient.synthesizeSpeech({
    input: { text: turn.text },
    voice: {
      languageCode: 'en-US',
      // https://cloud.google.com/text-to-speech/docs/list-voices-and-types
      name: turn.speaker === 'Y' ? 'en-US-Standard-F' : 'en-US-Standard-D',
      ssmlGender: turn.speaker === 'Y' ? 'FEMALE' : 'MALE',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 1.0,
      pitch: 0.0,
      volumeGainDb: 2.0,
    },
  })
  audioBuffers.push(response.audioContent)
}
```

After that, the audio is ready to served!

Now we a fully running solution for generate podcast from your PDF file on https://pdfun.xyz/pdf-to-podcast.

## Questions?

If you have any questions or run into any issues, please don’t hesitate to [create an issue](https://github.com/dalenguyen/pdfun/issues) on our GitHub repository. Alternatively, you can chat with me. I’m here to help and would love to hear your feedback.

Here is the [PR on Github](https://github.com/dalenguyen/pdfun/pull/56) if you wanna see the implementation in detail.

Stay tuned for the next part. Until then, happy coding!
