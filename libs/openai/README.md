# OpenAI

TypesScript library for OpenAI

## Getting started

```
npm i @dalenguyen/openai

OR

yarn add @dalenguyen/openai
```

## Usages

```
import { OpenAI } from '@dalenguyen/openai'

```

## Get Engines

```
const openAI = new OpenAI('OPENAI_API_KEY')
openAI.engines().then(res => console.log(res))
```
