/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { http } from '@google-cloud/functions-framework'
import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ExpressAdapter } from '@nestjs/platform-express'
import * as express from 'express'
import 'tslib' // needed until importHelpers is set to false
import { AppModule } from './app/app.module'
import { environment } from './environments/environment'
import { AllExceptionFilter } from './infrastructure/common/filter/exception.filter'
import { LoggerService } from './infrastructure/logger/logger.service'

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule)
//   const globalPrefix = 'api'
//   app.setGlobalPrefix(globalPrefix)
//   const port = process.env.PORT || 3333
//   await app.listen(port)
//   Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`)
// }

// bootstrap()

const server = express()

export const createNestServer = async (expressInstance) => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance))

  // Filter
  app.useGlobalFilters(new AllExceptionFilter(new LoggerService()))

  // pipes
  app.useGlobalPipes(new ValidationPipe())

  const globalPrefix = 'api'
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

      // const config = new DocumentBuilder()
      //   .addBearerAuth()
      //   .setTitle('API Nest')
      //   .setDescription('The API Nest API description')
      //   .setVersion('1.0')
      //   .build()

      // const document = SwaggerModule.createDocument(v, config)

      // SwaggerModule.setup('api', v, document)

      v.listen(process.env.PORT || 3333)
    }
  })
  .catch((err) => Logger.error('Nest broken', err))

http('apiNEST', server)
