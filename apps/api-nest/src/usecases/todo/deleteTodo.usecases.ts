import { ILogger } from '../../domain/logger/logger.interface'
import { TodoRepository } from '../../domain/repositories/todoRepository.interface'

export class DeleteTodoUseCases {
  constructor(private readonly logger: ILogger, private readonly todoRepository: TodoRepository) {}

  async execute(id: number): Promise<void> {
    await this.todoRepository.delete(id)
    this.logger.info('deleteTodoUseCases execute', `Todo ${id} have been deleted`)
  }
}
