# OpenAI

TypesScript library for OpenAI

## Getting started

```bash
npm i @dalenguyen/openai

OR

yarn add @dalenguyen/openai
```

## Usages

```javascript
import { OpenAI } from '@dalenguyen/openai'
const openAI = new OpenAI('OPENAI_API_KEY')
```

## Get Engines

```javascript
openAI
  .engines()
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

## List Files

```javascript
openAI
  .listFiles()
  .then((res) => console.log(res))
  .catch((error) => console.error(error))
```
