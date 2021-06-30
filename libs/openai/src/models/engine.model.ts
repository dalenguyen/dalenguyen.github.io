export enum EngineName {
  Davinci = 'davinci',
  Curie = 'curie',
  Babbage = 'babbage',
  Ada = 'ada'
}

export interface Engine {
  'id': EngineName
  'object': 'engine'
  'created': null | string
  'max_replicas': null | string
  'owner': 'openai',
  'permissions': null | string
  'ready': boolean,
  'ready_replicas': null | string
  'replicas': null | string
}

export interface ListEngine {
  'data': Engine[],
  'object': 'list'
}
