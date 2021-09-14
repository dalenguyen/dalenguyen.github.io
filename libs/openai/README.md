# OpenAI TypeScript

TypesScript library for OpenAI

**Note:** this project is not affiliated with OpenAI in any way, and this was written purely out of interest.

**Safe key practices:** DO NOT reveal you OpenAI API Key publicly or on client site. Put it in a safe place such as in the environment or Secret Manager.

## Development

The project is a monorepo using [Nx Workspace](https://nx.dev/). OpenAI library is under `libs/openai` folder.

Before testing the package, you should rename `.env-template` to `.env` then add your `OPENAI_API_KEY` to the environment file.

After you clone & modify the package. You can run the test to make sure everything passes.

```
yarn test openai
```

## Getting started

```bash
npm i @dalenguyen/openai

OR

yarn add @dalenguyen/openai
```

## Usages

```javascript
import { OpenAI } from '@dalenguyen/openai'
const openAI = new OpenAI(process.env.OPENAI_API_KEY)
```

## Get Engines

```javascript
openAI
  .engines()
  .then((res) => console.log(res))
  .catch((error) => console.error(error))
```

## Create Completions

### Create completion from engine

```javascript
import { CompletionRequest, EngineName } from '@dalenguyen/openai'

const completionRequest: CompletionRequest = {
  prompt: `Once upon a time...`,
  temperature: 0,
  max_tokens: 100,
  top_p: 1,
  frequency_penalty: 0.0,
  presence_penalty: 0.0,
  stop: ['\n'],
}

openAI
  .createCompletion(EngineName.Ada, completionRequest)
  .then((res) => console.log(res))
  .catch((error) => console.error(error))
```

### Create completion from fine-tune model

```javascript
openAI
  .createCompletionFromModel(completionRequest)
  .then((res) => console.log(res))
  .catch((error) => console.error(error))
```

## Create Answer

```javascript
import { AnswerRequest, EngineName, OpenAI } from '@dalenguyen/openai'

...
const question: AnswerRequest = {
  documents: [
    "Puppy A is happy.",
    "Puppy B is sad."
  ],
  model: EngineName.Curie,
  question: 'which puppy is happy?',
  examples: [
    [
      "What is human life expectancy in the United States?",
      "78 years."
    ]
  ],
  examples_context: "In 2017, U.S. life expectancy was 78.6 years.",
}

openAI.createAnswer(question)
  .then(res => console.log(res))
  .catch(error => console.error(error))

```

## Text Conversion

Text 2 JSONL

```javascript
import { text2JsonlFile } from '@dalenguyen/openai'

const text = 'This is first sentence. The is second sentence'
const savedFile = text2JsonlFile(text)

// Response
//
// {
// "status": "success",
// "filePath": "abspath/converted.jsonl",
// "fileName": "converted.jsonl"
// }
```

## Files

### List files

```javascript
openAI
  .listFiles()
  .then((res) => console.log(res))
  .catch((error) => console.error(error))
```

### Upload File

```javascript
import { FilePurpose } from '@dalenguyen/openai'

openAI
  .uploadFile({
    purpose: FilePurpose.Answers,
    file: 'FILE_PATH',
  })
  .then((res) => console.log(res))
  .catch((error) => console.error(error))
```

### Delete File

```javascript
openAI
  .deleteFile(fileId)
  .then((res) => console.log(res))
  .catch((error) => console.error(error))
```

## Classifications

Create Classification

```javascript
const classificationRequest: ClassificationRequest = {
  examples: [
    ['A happy moment', 'Positive'],
    ['I am sad.', 'Negative'],
    ['I am feeling awesome', 'Positive'],
  ],
  query: 'It is a raining day :(',
  search_model: 'ada',
  model: 'curie',
  labels: ['Positive', 'Negative', 'Neutral'],
}

openAI
  .createClassification(classificationRequest)
  .then((res) => console.log(res))
  .catch((error) => console.error(error))
```

## Fine-tune

### List fine-tunes

```javascript
openAI
  .listFinetunes()
  .then((res) => console.log(res))
  .catch((error) => console.error(error))
```

### List fine-tune events

```javascript
openAI
  .listFinetuneEvents(finetuneId)
  .then((res) => console.log(res))
  .catch((error) => console.error(error))
```

### Cancel fine-tune

```javascript
openAI
  .cancelFinetune(finetuneId)
  .then((res) => console.log(res))
  .catch((error) => console.error(error))
```

### Create fine-tune

```javascript
openAI
  .createFinetune({ training_file: 'file-id' })
  .then((res) => console.log(res))
  .catch((error) => console.error(error))
```

### Retrieve fine-tune

```javascript
openAI
  .retrieveFinetune(finetuneId)
  .then((res) => console.log(res))
  .catch((error) => console.error(error))
```

## Contributions

Feel free to report bugs and make feature requests in the [Issue Tracker](https://github.com/dalenguyen/dalenguyen.github.io/issues), fork and create pull requests!
