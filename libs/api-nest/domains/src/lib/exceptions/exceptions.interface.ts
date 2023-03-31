export interface IFormatExceptionMessage {
  message: string
  code_error?: number
}

export interface IException {
  badRequest(data: IFormatExceptionMessage): void
  internalServiceErrorException(data?: IFormatExceptionMessage): void
  forbiddenException(data?: IFormatExceptionMessage): void
  unauthorizedException(data?: IFormatExceptionMessage): void
}
