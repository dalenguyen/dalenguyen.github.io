export interface File {
  id: string
  object: 'file'
  bytes: number
  created_at: number
  filename: string
  purpose: string
  status: string
  status_details: null | string
}

export interface ListFile {
  data: File[]
  object: 'list'
}
