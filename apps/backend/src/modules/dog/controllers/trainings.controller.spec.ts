import {
  ScheduledTraining,
  TrainingStatus,
  WorkoutLog,
  WorkoutStatus,
} from '@/generated/prisma/client';
import { CompleteTrainingDto } from '@/modules/dog/controllers/dto/training.dto';
import { TrainingsService } from '@/modules/dog/services/trainings.service';
import { Identity } from '@/shared/auth/domain/identity';
import { HttpStatus } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
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
        scheduledTrainingId: 't1',
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

  describe('skip and undoSkip (#75)', () => {
    const aTraining = (status: TrainingStatus): ScheduledTraining => ({
      id: 't1',
      goalId: 'g1',
      dogId: 'dog1',
      createdById: 'u1',
      date: new Date('2026-10-22T00:00:00.000Z'),
      status,
      createdAt: new Date('2026-10-20T10:00:00Z'),
      updatedAt: new Date('2026-10-22T10:00:00Z'),
    });

    it('skips through the service and answers 200 with the training', async () => {
      const service = mock<TrainingsService>();
      const controller = new TrainingsController(service);
      const skipped = aTraining(TrainingStatus.SKIPPED);
      service.skipTraining.mockResolvedValue(skipped);

      const result = await controller.skip(user, 't1');

      expect(service.skipTraining).toHaveBeenCalledWith(user, 't1');
      expect(result).toEqual({
        id: 't1',
        goalId: 'g1',
        dogId: 'dog1',
        date: '2026-10-22',
        status: TrainingStatus.SKIPPED,
        createdAt: skipped.createdAt,
      });
      // A POST that creates nothing new in the API's eyes: 200, not 201.
      expect(
        Reflect.getMetadata(
          HTTP_CODE_METADATA,
          TrainingsController.prototype.skip,
        ),
      ).toBe(HttpStatus.OK);
    });

    it('undoes the skip through the service and returns the planned training', async () => {
      const service = mock<TrainingsService>();
      const controller = new TrainingsController(service);
      service.undoSkip.mockResolvedValue(aTraining(TrainingStatus.PLANNED));

      const result = await controller.undoSkip(user, 't1');

      expect(service.undoSkip).toHaveBeenCalledWith(user, 't1');
      expect(result).toMatchObject({
        id: 't1',
        date: '2026-10-22',
        status: TrainingStatus.PLANNED,
      });
    });
  });
});
