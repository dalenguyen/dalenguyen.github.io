import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TodoM } from '../../domain/model/todo'
import { TodoRepository } from '../../domain/repositories/todoRepository.interface'
import { Todo } from '../entities/todo.entity'

export class DatabaseTodoRepository implements TodoRepository {
  constructor(@InjectRepository(Todo) private readonly todoEntityRepository: Repository<Todo>) {}

  async findAll(): Promise<TodoM[]> {
    const todosEntity = await this.todoEntityRepository.find()
    return todosEntity.map((todoEntity) => this.toTodo(todoEntity))
  }

  async findById(id: number): Promise<TodoM> {
    const todoEntity = await this.todoEntityRepository.findOneOrFail({
      where: { id },
    })
    return this.toTodo(todoEntity)
  }

  async create(todo: TodoM): Promise<TodoM> {
    const todoEntity = this.toTodoEntity(todo)
    const result = await this.todoEntityRepository.insert(todoEntity)
    return this.toTodo(result.generatedMaps[0] as Todo)
  }

  async update(id: number, isDone: boolean): Promise<void> {
    await this.todoEntityRepository.update(id, { is_done: isDone })
  }

  async delete(id: number): Promise<void> {
    await this.todoEntityRepository.delete({ id })
  }

  private toTodo(todoEntity: Todo): TodoM {
    const todo: TodoM = new TodoM()

    todo.id = todoEntity.id
    todo.content = todoEntity.content
    todo.isDone = todoEntity.is_done
    todo.createdAt = todoEntity.created_at
    todo.updatedAt = todoEntity.updated_at

    return todo
  }

  private toTodoEntity(todo: TodoM): Todo {
    const todoEntity: Todo = new Todo()

    todoEntity.id = todo.id
    todoEntity.content = todo.content
    todoEntity.is_done = todo.isDone

    return todoEntity
  }
}
