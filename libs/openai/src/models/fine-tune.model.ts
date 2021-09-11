import { EngineName } from './engine.model'
import { OpenAIFile } from './file.model'

export interface FinetuneEvent {
  object: 'fine-tune-event'
  created_at: number
  level: 'info'
  message: string
}

export interface FinetuneEventResponse {
  object: 'list'
  data: FinetuneEvent[]
}

export interface Finetune {
  id: string
  object: 'fine-tune'
  model: EngineName
  created_at: number
  events: FinetuneEvent[]
  fine_tuned_model: string
  hyperparams: {
    batch_size: number
    learning_rate_multiplier: number
    n_epochs: number
    prompt_loss_weight: number
    use_packing: boolean
  }
  organization_id: string
  result_files: OpenAIFile[]
  status: 'succeeded'
  validation_files: []
  training_files: OpenAIFile[]
  updated_at: number
  user_id: string
}

export interface ListFinetunes {
  object: 'list'
  data: Finetune[]
}

export interface FinetuneRequest {
  training_file: string
}
