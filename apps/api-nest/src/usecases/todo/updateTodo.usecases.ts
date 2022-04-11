import { ILogger } from '../../domain/logger/logger.interface'
import { TodoRepository } from '../../domain/repositories/todoRepository.interface'

export class UpdateTodoUseCases {
  constructor(private readonly logger: ILogger, private readonly todoRepository: TodoRepository) {}

  async execute(id: number, isDone: boolean): Promise<void> {
    await this.todoRepository.update(id, isDone)
    this.logger.info('UpdateTodoUseCases execute', `Todo ${id} has been updated`)
  }
}
