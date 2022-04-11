import { ILogger } from '../../domain/logger/logger.interface'
import { TodoM } from '../../domain/model/todo'
import { TodoRepository } from '../../domain/repositories/todoRepository.interface'

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
