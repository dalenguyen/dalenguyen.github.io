export enum FilePurpose {
  Search = 'search',
  Answers = 'answers',
  Classifications = 'classifications',
}

export interface File {
  id: string
  object: 'file'
  bytes: number
  created_at: number
  filename: string
  purpose: FilePurpose
  status: string
  status_details: null | string
}

export interface ListFile {
  data: File[]
  object: 'list'
}

export interface FileRequest {
  /**
   * Name of the JSON Lines file to be uploaded.
   * If the purpose is set to "search" or "answers", each line is a JSON record with a "text" field and an optional "metadata" field.
   * Only "text" field will be used for search. Specially, when the purpose is "answers", "\n" is used as a delimiter to chunk contents in the "text" field into multiple documents for finer-grained matching.
   * If the purpose is set to "classifications", each line is a JSON record with a single training example with "text" and "label" fields along with an optional "metadata" field.
   */
  file: string

  /**
   * The intended purpose of the uploaded documents.
   * Use "search" for Search, "answers" for Answers and "classifications" for Classifications.
   * This allows us to validate the format of the uploaded file.
   */
  purpose: FilePurpose
}
