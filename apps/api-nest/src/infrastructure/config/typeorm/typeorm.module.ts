import { Module } from '@nestjs/common'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import { EnvironmentConfigModule, EnvironmentConfigService } from '../environment-config'

export const getTypeOrmModuleOptions = (config: EnvironmentConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.getDatabaseHost(),
  port: config.getDatabasePort(),
  username: config.getDatabaseUser(),
  password: config.getDatabasePassword(),
  database: config.getDatabaseName(),
  entities: [__dirname + './../../**/*.entity{.ts,.js}'],
  synchronize: config.getDatabaseSync(),
  schema: config.getDatabaseSchema(),
  migrationsRun: true,
  //   migrationsTableName: 'migration_todo',
  migrations: ['database/migrations/**/*{.ts,.js}'],
})

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [EnvironmentConfigModule],
      inject: [EnvironmentConfigService],
      useFactory: getTypeOrmModuleOptions,
    }),
  ],
})
export class TypeOrmConfigModule {}
