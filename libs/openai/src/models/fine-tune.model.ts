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
  status: 'succeeded' | 'pending'
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
  /**
   * The ID of an uploaded file that contains training data.
   */
  training_file: string
  /**
   * Defaults to curie.
   * The name of the base model to fine-tune. You can select one of "ada", "babbage", "curie", or "davinci".
   */
  model?: EngineName
  /**
   * Defaults to null
   * A string of up to 40 characters that will be added to your fine-tuned model name.
   * For example, a suffix of "custom-model-name" would produce a model name like ada:ft-your-org:custom-model-name-2022-02-15-04-21-04.
   */
  suffix?: string
  /**
   * The ID of an uploaded file that contains validation data.
   */
  validation_file?: string
  /**
   * Defaults to 4
   * The number of epochs to train the model for. An epoch refers to one full cycle through the training dataset.
   */
  n_epochs?: number
  /**
   * Defaults to null
   * The batch size to use for training. The batch size is the number of training examples used to train a single forward and backward pass.
   */
  batch_size?: number
  /**
   * Defaults to null
   * The learning rate multiplier to use for training.
   * The fine-tuning learning rate is the original learning rate used for pretraining multiplied by this value.
   */
  learning_rate_multiplier?: number
  /**
   * Defaults to 0.1
   * The weight to use for loss on the prompt tokens.
   * This controls how much the model tries to learn to generate the prompt (as compared to the completion which always has a weight of 1.0),
   * and can add a stabilizing effect to training when completions are short.
   */
  prompt_loss_weight?: number
  /**
   * Defaults to false
   * If set, we calculate classification-specific metrics such as accuracy and F-1 score using the validation set at the end of every epoch.
   */
  compute_classification_metrics?: boolean
  /**
   * Defaults to null
   * The number of classes in a classification task.
   * This parameter is required for multiclass classification.
   */
  classification_n_classes?: number
  /**
   * Defaults to null
   * The positive class in binary classification.
   * This parameter is needed to generate precision, recall, and F1 metrics when doing binary classification.
   */
  classification_positive_class?: string
  /**
   * Defaults to null
   * If this is provided, we calculate F-beta scores at the specified beta values.
   * The F-beta score is a generalization of F-1 score. This is only used for binary classification.
   */
  classification_betas?: number[]
}
