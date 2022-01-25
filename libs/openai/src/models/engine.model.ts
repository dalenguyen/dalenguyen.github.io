export enum EngineName {
  // Instruct
  TextDavinci = 'text-davinci-001',
  TextCurie = 'text-curie-001',
  TextBabbage = 'text-babbage-001',
  TextAda = 'text-ada-001',
  DavinciInstructBeta = 'davinci-instruct-beta',
  CurieInstructBeta = 'curie-instruct-beta',

  // Codex
  DavinciCodex = 'code-davinci-001',
  CushmanCodex = 'code-cushman-001',

  // Default
  Davinci = 'davinci',
  Curie = 'curie',
  Babbage = 'babbage',
  Ada = 'ada',
}

export interface Engine {
  id: EngineName
  object: 'engine'
  created: null | string
  max_replicas: null | string
  owner: 'openai'
  permissions: null | string
  ready: boolean
  ready_replicas: null | string
  replicas: null | string
}

export interface ListEngine {
  data: Engine[]
  object: 'list'
}
