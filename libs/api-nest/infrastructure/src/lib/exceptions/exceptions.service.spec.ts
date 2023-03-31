import { Test, TestingModule } from '@nestjs/testing'
import { ExceptionsService } from './exceptions.service'

describe('ExceptionsService', () => {
  let service: ExceptionsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExceptionsService],
    }).compile()

    service = module.get<ExceptionsService>(ExceptionsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
