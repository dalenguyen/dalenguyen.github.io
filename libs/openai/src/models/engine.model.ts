export enum EngineName {
  Davinci = 'davinci',
  DavinciCodex = 'davinci-codex',
  DavinciInstructBeta = 'davinci-instruct-beta ',
  Curie = 'curie',
  CurieInstructBeta = 'curie-instruct-beta',
  CushmanCodex = 'cushman-codex',
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
