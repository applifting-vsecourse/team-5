import { Config } from '@/shared/config/config.service';
import { Test, TestingModule } from '@nestjs/testing';
import { WelcomeController } from './welcome.controller';

describe('WelcomeController', () => {
  let controller: WelcomeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WelcomeController],
      providers: [
        {
          provide: Config,
          useValue: {
            name: 'TrainLoop backend',
            description: 'Backend for TrainLoop',
            version: '0.1.0',
          },
        },
      ],
    }).compile();

    controller = module.get<WelcomeController>(WelcomeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return welcome message', async () => {
    const result = await controller.getWelcomeMessage();
    expect(result.name).toBe('TrainLoop backend');
    expect(result.message).toBe('Welcome to TrainLoop backend');
  });

  it('should return health ok', async () => {
    const health = await controller.getHealth();
    expect(health).toEqual({ status: 'ok' });
  });
});
