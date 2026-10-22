import { WorkoutLog, WorkoutStatus } from '@/generated/prisma/client';
import { CompleteTrainingDto } from '@/modules/dog/controllers/dto/training.dto';
import { TrainingsService } from '@/modules/dog/services/trainings.service';
import { Identity } from '@/shared/auth/domain/identity';
import { mock } from 'jest-mock-extended';
import { TrainingsController } from './trainings.controller';

jest.mock('@/shared/auth/guards/authenticated-user.guard', () => ({
  AuthenticatedUserGuard: class {},
}));

describe('TrainingsController', () => {
  const user = { id: 'u1' } as Identity;

  describe('completeTraining', () => {
    it('calls service and serializes created workout log into ActivityResponseDto', async () => {
      const service = mock<TrainingsService>();
      const controller = new TrainingsController(service);

      const fakeLog: WorkoutLog = {
        id: 'log1',
        dogId: 'dog1',
        goalId: 'goal1',
        authorId: 'u1',
        title: 'Chůze u nohy',
        discipline: 'Poslušnost',
        status: WorkoutStatus.COMPLETED,
        completedAt: new Date('2026-10-22T10:00:00Z'),
        successRate: 80,
        rating: null,
        focus: 'YES',
        repeatedMistakes: 'NO',
        note: 'Skvělý trénink',
        videoUrl: null,
        skipReason: null,
        createdAt: new Date('2026-10-22T10:00:00Z'),
        updatedAt: new Date('2026-10-22T10:00:00Z'),
      };

      service.completeTraining.mockResolvedValue(fakeLog);

      const dto: CompleteTrainingDto = {
        successRate: 80,
        focus: 'YES',
        repeatedMistakes: 'NO',
        note: 'Skvělý trénink',
      };

      const result = await controller.completeTraining(user, 't1', dto);

      expect(service.completeTraining).toHaveBeenCalledWith(user, 't1', dto);
      expect(result).toEqual({
        id: 'log1',
        dogId: 'dog1',
        authorId: 'u1',
        messages: [],
        title: 'Chůze u nohy',
        discipline: 'Poslušnost',
        status: WorkoutStatus.COMPLETED,
        completedAt: fakeLog.completedAt,
        successRate: 80,
        rating: null,
        focus: 'YES',
        repeatedMistakes: 'NO',
        note: 'Skvělý trénink',
        videoUrl: null,
        skipReason: null,
        createdAt: fakeLog.createdAt,
        updatedAt: fakeLog.updatedAt,
      });
    });
  });
});
