import { Module } from '@nestjs/common'
import { UseCasesProxyModule } from '../usecases-proxy/usecases-proxy.module'
import { TodoController } from './todo/todo.controller'

@Module({
  imports: [UseCasesProxyModule.register()],
  providers: [TodoController],
})
export class ControllersModule {}
