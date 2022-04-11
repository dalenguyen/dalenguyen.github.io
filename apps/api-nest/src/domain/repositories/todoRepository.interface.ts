import { TodoM } from '../model/todo'

export interface TodoRepository {
  findAll(): Promise<TodoM[]>
  findById(id: number): Promise<TodoM>
  create(todo: TodoM): Promise<TodoM>
  update(id: number, isDone: boolean): Promise<void>
  delete(id: number): Promise<void>
}
