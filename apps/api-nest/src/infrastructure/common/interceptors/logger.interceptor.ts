import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { LoggerService } from '../../logger/logger.service'

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now()
    const httpContext = context.switchToHttp()
    const request = httpContext.getRequest()

    const ip = this.getIp(request)

    this.logger.log(`Start Request for ${request.path}`, `method=${request.method} ip=${ip}`)

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `End Request for ${request.path}`,
          `method=${request.method} ip=${ip} duration=${Date.now() - now}ms`,
        )
      }),
    )
  }

  private getIp(request) {
    let ip: string
    const ipAddr = request.headers['x-forwarded-for']
    if (ipAddr) {
      const list = ipAddr.split(',')
      ip = list[list.length - 1]
    } else {
      ip = request.connection.remoteAddress
    }

    return ip.replace('::ffff:', '')
  }
}
