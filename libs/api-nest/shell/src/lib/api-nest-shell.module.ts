import {
  ControllersModule,
  EnvironmentConfigModule,
  ExceptionsModule,
  LoggerModule,
} from '@dalenguyen/api-nest/infrastructure'
import { Module } from '@nestjs/common'

@Module({
  imports: [
    LoggerModule,
    ExceptionsModule,
    // UseCasesProxyModule.register(),
    ControllersModule,
    EnvironmentConfigModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class ApiNestShellModule {}
