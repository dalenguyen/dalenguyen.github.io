import { plainToClass } from 'class-transformer'
import { IsBoolean, IsNumber, IsString, validateSync } from 'class-validator'

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Local = 'local',
}

class EnvironmentVariables {
  // @IsEnum(Environment)
  // NODE_ENV: Environment

  @IsString()
  DATABASE_HOST: string

  @IsNumber()
  DATABASE_PORT: number

  @IsString()
  DATABASE_USER: string

  @IsString()
  DATABASE_PASSWORD: string

  @IsString()
  DATABASE_NAME: string

  @IsString()
  DATABASE_SCHEMA: string

  @IsBoolean()
  DATABASE_SYNCHRONIZE: boolean
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  })

  console.log(`DATABASE_HOST`, config.DATABASE_HOST)
  console.log(`NODE_ENV`, config.NODE_ENV)

  const errors = validateSync(validatedConfig, { skipMissingProperties: false })

  if (errors.length > 0) {
    throw new Error(errors.toString())
  }

  return validatedConfig
}
