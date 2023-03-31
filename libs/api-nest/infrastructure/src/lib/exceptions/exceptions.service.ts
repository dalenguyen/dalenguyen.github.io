import { IException, IFormatExceptionMessage } from '@dalenguyen/api-nest/domains'
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'

@Injectable()
export class ExceptionsService implements IException {
  badRequest(data: IFormatExceptionMessage): void {
    throw new BadRequestException(data)
  }
  internalServiceErrorException(data?: IFormatExceptionMessage): void {
    throw new InternalServerErrorException(data)
  }
  forbiddenException(data?: IFormatExceptionMessage): void {
    throw new ForbiddenException(data)
  }
  unauthorizedException(data?: IFormatExceptionMessage): void {
    throw new UnauthorizedException(data)
  }
}
