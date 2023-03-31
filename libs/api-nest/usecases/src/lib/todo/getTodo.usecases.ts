import { ILogger, TodoM, TodoRepository } from '@dalenguyen/api-nest/domains'

export class GetTodoUseCases {
  constructor(private readonly logger: ILogger, private readonly todoRepository: TodoRepository) {}

  async execute(id: number): Promise<TodoM> {
    const todo = await this.todoRepository.findById(id)
    if (!todo) {
      this.logger.warn('GetTodoUseCases execute', `Todo ${id} not found`)
      throw new Error(`Todo ${id} not found`)
    }

    return todo
  }
}
