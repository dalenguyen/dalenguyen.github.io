import { DynamicModule, Module } from '@nestjs/common'
import {
  AddTodoUseCases,
  DeleteTodoUseCases,
  GetTodosUseCases,
  GetTodoUseCases,
  UpdateTodoUseCases,
} from '../../usecases/todo'
import { ExceptionsModule } from '../exceptions/exceptions.module'
import { LoggerModule } from '../logger/logger.module'
import { LoggerService } from '../logger/logger.service'
import { RepositoriesModule } from '../repositories/repositories.module'
import { DatabaseTodoRepository } from '../repositories/todo.repository'
import { UseCasesProxy } from './usecases-proxy'

@Module({
  imports: [LoggerModule, RepositoriesModule, ExceptionsModule],
})
export class UseCasesProxyModule {
  static GET_TODO_USECASES_PROXY = 'getTodoUseCasesProxy'
  static GET_TODOS_USECASES_PROXY = 'getTodosUseCasesProxy'
  static POST_TODO_USECASES_PROXY = 'postTodoUseCasesProxy'
  static PUT_TODO_USECASES_PROXY = 'putTodoUseCasesProxy'
  static DELETE_TODO_USECASES_PROXY = 'deleteTodoUseCasesProxy'

  static register(): DynamicModule {
    return {
      module: UseCasesProxyModule,
      providers: [
        {
          inject: [DatabaseTodoRepository],
          provide: UseCasesProxyModule.GET_TODO_USECASES_PROXY,
          useFactory: (logger: LoggerService, todoRepository: DatabaseTodoRepository) =>
            new UseCasesProxy(new GetTodoUseCases(logger, todoRepository)),
        },
        {
          inject: [DatabaseTodoRepository],
          provide: UseCasesProxyModule.GET_TODOS_USECASES_PROXY,
          useFactory: (logger: LoggerService, todoRepository: DatabaseTodoRepository) =>
            new UseCasesProxy(new GetTodosUseCases(logger, todoRepository)),
        },
        {
          inject: [DatabaseTodoRepository],
          provide: UseCasesProxyModule.POST_TODO_USECASES_PROXY,
          useFactory: (logger: LoggerService, todoRepository: DatabaseTodoRepository) =>
            new UseCasesProxy(new AddTodoUseCases(logger, todoRepository)),
        },
        {
          inject: [DatabaseTodoRepository],
          provide: UseCasesProxyModule.PUT_TODO_USECASES_PROXY,
          useFactory: (logger: LoggerService, todoRepository: DatabaseTodoRepository) =>
            new UseCasesProxy(new UpdateTodoUseCases(logger, todoRepository)),
        },
        {
          inject: [DatabaseTodoRepository],
          provide: UseCasesProxyModule.DELETE_TODO_USECASES_PROXY,
          useFactory: (logger: LoggerService, todoRepository: DatabaseTodoRepository) =>
            new UseCasesProxy(new DeleteTodoUseCases(logger, todoRepository)),
        },
      ],
      exports: [
        UseCasesProxyModule.GET_TODO_USECASES_PROXY,
        UseCasesProxyModule.GET_TODOS_USECASES_PROXY,
        UseCasesProxyModule.POST_TODO_USECASES_PROXY,
        UseCasesProxyModule.PUT_TODO_USECASES_PROXY,
        UseCasesProxyModule.DELETE_TODO_USECASES_PROXY,
      ],
    }
  }
}
