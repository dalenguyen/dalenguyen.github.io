export interface ILogger {
  debug(context: string, message: string): void
  info(context: string, message: string): void
  warn(context: string, message: string): void
  error(context: string, message: string, trace?: string): void
  verbose(context: string, message: string): void
}
