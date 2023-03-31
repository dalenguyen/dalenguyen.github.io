import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class addTodoTable1650004487316 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'todo',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true },
          { name: 'content', type: 'varchar', isNullable: true },
          { name: 'is_done', type: 'boolean', isNullable: false },
          { name: 'created_at', type: 'datetime', isNullable: false },
          { name: 'updated_at', type: 'datetime' },
        ],
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "todo"`)
  }
}
