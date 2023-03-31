import {
  AddTodoUseCases,
  DeleteTodoUseCases,
  GetTodosUseCases,
  GetTodoUseCases,
  UpdateTodoUseCases,
} from '@dalenguyen/api-nest/usecases'
import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put } from '@nestjs/common'
import { ApiExtraModels, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ApiResponseType } from '../../common/swagger/response.decorator'
import { UseCasesProxy } from '../../usecases-proxy/usecases-proxy'
import { UseCasesProxyModule } from '../../usecases-proxy/usecases-proxy.module'
import { AddTodoDto, UpdateTodoDto } from './todo.dto'
import { TodoPresenter } from './todo.presenter'

@Controller()
@ApiTags('todo')
@ApiResponse({ status: 500, description: 'Internal Server Error' })
@ApiExtraModels(TodoPresenter)
export class TodoController {
  constructor(
    @Inject(UseCasesProxyModule.GET_TODO_USECASES_PROXY)
    private readonly getTodoUseCasesProxy: UseCasesProxy<GetTodoUseCases>,
    @Inject(UseCasesProxyModule.GET_TODOS_USECASES_PROXY)
    private readonly getTodosUseCasesProxy: UseCasesProxy<GetTodosUseCases>,
    @Inject(UseCasesProxyModule.POST_TODO_USECASES_PROXY)
    private readonly postTodoUseCasesProxy: UseCasesProxy<AddTodoUseCases>,
    @Inject(UseCasesProxyModule.PUT_TODO_USECASES_PROXY)
    private readonly putTodoUseCasesProxy: UseCasesProxy<UpdateTodoUseCases>,
    @Inject(UseCasesProxyModule.DELETE_TODO_USECASES_PROXY)
    private readonly deleteTodoUseCasesProxy: UseCasesProxy<DeleteTodoUseCases>,
  ) {}

  // http://localhost:3333/v1/todos
  @Get('todos')
  @ApiResponseType(TodoPresenter, true)
  async getTodos(): Promise<TodoPresenter[]> {
    const todos = await this.getTodosUseCasesProxy.getInstance().execute()
    return todos.map((todo) => new TodoPresenter(todo))
  }

  @Get('todos/:id')
  @ApiResponseType(TodoPresenter, false)
  async getTodo(@Param('id', ParseIntPipe) id: number): Promise<TodoPresenter> {
    const todo = await this.getTodoUseCasesProxy.getInstance().execute(id)
    return new TodoPresenter(todo)
  }

  @Put('todos')
  @ApiResponseType(TodoPresenter, true)
  async updateTodo(@Body() updateTodoDto: UpdateTodoDto) {
    const { id, isDone } = updateTodoDto
    await this.putTodoUseCasesProxy.getInstance().execute(id, isDone)
    return 'success'
  }

  @Post('todos')
  @ApiResponseType(TodoPresenter, true)
  async addTodo(@Body() addTodoDto: AddTodoDto) {
    const { content } = addTodoDto
    await this.postTodoUseCasesProxy.getInstance().execute(content)
    return 'success'
  }

  @Delete('todos/:id')
  @ApiResponseType(TodoPresenter, true)
  async deleteTodo(@Param('id', ParseIntPipe) id: number) {
    await this.deleteTodoUseCasesProxy.getInstance().execute(id)
    return 'success'
  }
}
