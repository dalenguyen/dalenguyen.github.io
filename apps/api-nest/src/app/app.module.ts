import { Module } from '@nestjs/common'
import { EnvironmentConfigModule } from '../infrastructure/config/environment-config'
import { ControllersModule } from '../infrastructure/controllers/controllers.module'
import { ExceptionsModule } from '../infrastructure/exceptions/exceptions.module'
import { LoggerModule } from '../infrastructure/logger/logger.module'
import { UseCasesProxyModule } from '../infrastructure/usecases-proxy/usecases-proxy.module'

@Module({
  imports: [LoggerModule, ExceptionsModule, UseCasesProxyModule.register(), ControllersModule, EnvironmentConfigModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
