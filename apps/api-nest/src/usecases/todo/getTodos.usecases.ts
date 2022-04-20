import { ILogger } from '../../domain/logger/logger.interface'
import { TodoM } from '../../domain/model/todo'
import { TodoRepository } from '../../domain/repositories/todoRepository.interface'
export class GetTodosUseCases {
  constructor(private readonly logger: ILogger, private readonly todoRepository: TodoRepository) {}

  async execute(): Promise<TodoM[]> {
    const todos = await this.todoRepository.findAll()
    this.logger.info('GetTodosUseCases execute', `${todos.length} todos have been found`)
    return todos
  }
}
