import { TodoM } from '@dalenguyen/api-nest/domains'
import { ApiProperty } from '@nestjs/swagger'

export class TodoPresenter {
  @ApiProperty()
  id: number

  @ApiProperty()
  content: string

  @ApiProperty()
  isDone: boolean

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date

  constructor(todo: TodoM) {
    this.id = todo.id
    this.content = todo.content
    this.isDone = todo.isDone
    this.createdAt = todo.createdAt
    this.updatedAt = todo.updatedAt
  }
}
