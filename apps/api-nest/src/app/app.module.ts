import { Module } from '@nestjs/common'
import { ControllersModule } from '../infrastructure/controllers/controllers.module'
import { ExceptionsModule } from '../infrastructure/exceptions/exceptions.module'
import { LoggerModule } from '../infrastructure/logger/logger.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [LoggerModule, ExceptionsModule, ControllersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
