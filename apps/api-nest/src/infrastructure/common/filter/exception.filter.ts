import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { IFormatExceptionMessage } from '../../../domain/exceptions/exceptions.interface'
import { LoggerService } from '../../logger/logger.service'

@Catch()
export class AllExceptionFilter<T> implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: (exception as unknown as IFormatExceptionMessage).message, code_error: null }

    const responseData = {
      ...{
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
      ...(message as Record<string, unknown>),
    }

    this.logMessage(request, message, status, exception)

    response.status(status).json(responseData)
  }

  private logMessage(request, message, status, exception) {
    if (status === 500) {
      this.logger.error(
        `End Request for ${request.path}`,
        `method=${request.method} status = ${status} code_error = ${message.code_error} message = ${message.message}`,
        status >= 500 ? exception.stack : '',
      )
    } else {
      this.logger.warn(
        `End Request for ${request.path}`,
        `method=${request.method} status=${status} code_error=${message.code_error} message=${message.message}`,
      )
    }
  }
}
