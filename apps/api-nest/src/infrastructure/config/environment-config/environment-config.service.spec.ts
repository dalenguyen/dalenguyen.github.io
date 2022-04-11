import { Test, TestingModule } from '@nestjs/testing'
import { EnvironmentConfigService } from './environment-config.service'

describe('EnvironmentConfigService', () => {
  let service: EnvironmentConfigService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnvironmentConfigService],
    }).compile()

    service = module.get<EnvironmentConfigService>(EnvironmentConfigService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
