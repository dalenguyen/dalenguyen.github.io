import {
  AllExceptionFilter,
  LoggerInterceptor,
  LoggerService,
  ResponseFormat,
  ResponseInterceptor,
} from '@dalenguyen/api-nest/infrastructure'
import { ApiNestShellModule } from '@dalenguyen/api-nest/shell'
import { http } from '@google-cloud/functions-framework'
import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ExpressAdapter } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as express from 'express'
import 'tslib' // needed until importHelpers is set to false
import { environment } from './environments/environment'

const server = express()

export const createNestServer = async (expressInstance) => {
  const app = await NestFactory.create(ApiNestShellModule, new ExpressAdapter(expressInstance))

  // Filter
  app.useGlobalFilters(new AllExceptionFilter(new LoggerService()))

  // pipes
  app.useGlobalPipes(new ValidationPipe())

  // interceptors
  app.useGlobalInterceptors(new LoggerInterceptor(new LoggerService()))
  app.useGlobalInterceptors(new ResponseInterceptor())

  // http://localhost:3333/v1
  const globalPrefix = 'v1'
  app.setGlobalPrefix(globalPrefix)
  app.enableCors()

  return app.init()
}

createNestServer(server)
  .then((v) => {
    if (environment.production) {
      Logger.log('🚀 Starting production server...')
    } else {
      Logger.log(`🚀 Starting development server on http://localhost:${process.env.PORT || 3333}`)

      const config = new DocumentBuilder()
        .addBearerAuth()
        .setTitle('API Nest')
        .setDescription('The API Nest API description')
        .setVersion('1.0')
        .build()

      const document = SwaggerModule.createDocument(v, config, {
        extraModels: [ResponseFormat],
        deepScanRoutes: true,
      })

      SwaggerModule.setup('api', v, document)

      v.listen(process.env.PORT || 3333)
    }
  })
  .catch((err) => Logger.error('Nest broken', err))

http('apiNEST', server)
