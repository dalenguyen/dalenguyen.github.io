import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Todo } from '../../entities/todo.entity'
import { addTodoTable1650004487316 } from '../../migrations/addUser'

// export const getTypeOrmModuleOptions = (config: EnvironmentConfigService): TypeOrmModuleOptions => ({
//   type: 'postgres',
//   host: config.getDatabaseHost(),
//   port: config.getDatabasePort(),
//   username: config.getDatabaseUser(),
//   password: config.getDatabasePassword(),
//   database: config.getDatabaseName(),
//   entities: [__dirname + './../../**/*.entity{.ts,.js}'],
//   synchronize: config.getDatabaseSync(),
//   schema: config.getDatabaseSchema(),
//   migrationsRun: true,
//   //   migrationsTableName: 'migration_todo',
//   migrations: ['database/migrations/**/*{.ts,.js}'],
// })

@Module({
  imports: [
    // TypeOrmModule.forRootAsync({
    //   imports: [EnvironmentConfigModule],
    //   inject: [EnvironmentConfigService],
    //   useFactory: getTypeOrmModuleOptions,
    // }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './data/myDb.db',
      logging: false,
      synchronize: false,
      entities: [Todo],
      migrations: [addTodoTable1650004487316],
      migrationsRun: true,
    }),
  ],
})
export class TypeOrmConfigModule {}
