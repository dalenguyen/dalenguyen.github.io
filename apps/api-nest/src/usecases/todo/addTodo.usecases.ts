import { ILogger } from '../../domain/logger/logger.interface'
import { TodoM } from '../../domain/model/todo'
import { TodoRepository } from '../../domain/repositories/todoRepository.interface'

export class AddTodoUseCases {
  constructor(private readonly logger: ILogger, private readonly todoRepository: TodoRepository) {}

  async execute(content: string): Promise<TodoM> {
    const todo = new TodoM()
    todo.content = content
    todo.isDone = false
    const result = await this.todoRepository.create(todo)
    this.logger.info('addTodoUseCases execute', `New todo have been inserted ${result.id}`)
    return result
  }
}
