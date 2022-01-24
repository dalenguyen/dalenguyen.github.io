export enum EngineName {
  Davinci = 'davinci',
  DavinciCodex = 'code-davinci-001',
  DavinciInstructBeta = 'davinci-instruct-beta ',
  Curie = 'curie',
  CurieInstructBeta = 'curie-instruct-beta',
  CushmanCodex = 'code-cushman-001',
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
