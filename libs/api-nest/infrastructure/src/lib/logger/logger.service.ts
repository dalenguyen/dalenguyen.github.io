import { ILogger } from '@dalenguyen/api-nest/domains'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class LoggerService extends Logger implements ILogger {
  debug(context: string, message: string): void {
    if (process.env.NODE_ENV !== 'production') {
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
    if (process.env.NODE_ENV !== 'production') {
      super.verbose(`[VERBOSE] ${context}`, message)
    }
  }
}
