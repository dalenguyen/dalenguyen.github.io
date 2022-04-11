import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class Todo {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number

  @Column({ type: 'varchar', length: 255, nullable: true })
  content: string

  @Column({ type: 'boolean', default: false })
  is_done: boolean

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date
}
