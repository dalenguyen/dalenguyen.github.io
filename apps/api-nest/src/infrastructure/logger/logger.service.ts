import { Injectable, Logger } from '@nestjs/common'
import { ILogger } from '../../domain/logger/logger.interface'
import { environment } from '../../environments/environment'

@Injectable()
export class LoggerService extends Logger implements ILogger {
  debug(context: string, message: string): void {
    if (environment.production === false) {
      super.debug(`[DEBUG] ${context}`, message)
    }
  }
  info(context: string, message: string): void {
    super.log(`[INFO] ${context}`, message)
  }
  warn(context: string, message: string): void {
    super.warn(`[WARN] ${context}`, message)
  }
  error(context: string, message: string, trace?: string): void {
    super.error(`[ERROR] ${context}`, message, trace)
  }
  verbose(context: string, message: string): void {
    if (environment.production === false) {
      super.verbose(`[VERBOSE] ${context}`, message)
    }
  }
}
