import { Dog } from '@/modules/dog/domain/dog';
import { Goal } from '@/modules/dog/domain/goal';
import { GoalRepository } from '@/modules/dog/repositories/goal.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { Identity } from '@/shared/auth/domain/identity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { GoalsService } from './goals.service';

const aDog = (overrides: Partial<Dog> = {}): Dog => ({
  id: 'd1',
  name: 'Rex',
  breed: 'Border kolie',
  color: 1,
  ownerId: 'u1',
  isArchived: false,
  disciplines: ['Poslušnost', 'Canicross'],
  createdAt: new Date('2026-01-01T12:00:00Z'),
  updatedAt: new Date('2026-01-01T12:00:00Z'),
  ...overrides,
});

const aGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: 'g1',
  dogId: 'd1',
  createdById: 'u1',
  createdBy: { id: 'u1', name: 'Jana' },
  title: 'Spolehlivá chůze u nohy',
  discipline: 'Poslušnost',
  principle: 'Pes jde u levé nohy.',
  status: 'ACTIVE',
  order: 0,
  createdAt: new Date('2026-01-01T12:00:00Z'),
  updatedAt: new Date('2026-01-01T12:00:00Z'),
  ...overrides,
});

const owner = { id: 'u1' } as Identity;
const trainer = { id: 'u9' } as Identity; // has a share on dog d1
const stranger = { id: 'u2' } as Identity;

const setup = (): {
  service: GoalsService;
  goalRepository: MockProxy<GoalRepository>;
  dogAccess: MockProxy<DogAccessService>;
} => {
  const goalRepository = mock<GoalRepository>();
  const dogAccess = mock<DogAccessService>();
  // The owner sees dog d1; anyone else gets the same 404 as for a missing dog.
  dogAccess.getAccessibleDog.mockImplementation((user, dogId) =>
    (user.id === 'u1' || user.id === 'u9') && dogId === 'd1'
      ? Promise.resolve(aDog())
      : Promise.reject(new NotFoundException()),
  );
  const service = new GoalsService(goalRepository, dogAccess);
  return { service, goalRepository, dogAccess };
};

describe('GoalsService', () => {
  describe('getGoalsByDogId', () => {
    it("lists the goals of the user's dog", async () => {
      const { service, goalRepository } = setup();
      const goals = [aGoal(), aGoal({ id: 'g2', title: 'Pac' })];
      goalRepository.getGoalsByDogId.mockResolvedValue(goals);

      await expect(service.getGoalsByDogId(owner, 'd1')).resolves.toEqual(
        goals,
      );
      expect(goalRepository.getGoalsByDogId).toHaveBeenCalledWith(
        'd1',
        undefined,
      );
    });

    it("does not list goals of another user's dog", async () => {
      const { service, goalRepository } = setup();

      await expect(service.getGoalsByDogId(stranger, 'd1')).rejects.toThrow(
        NotFoundException,
      );
      expect(goalRepository.getGoalsByDogId).not.toHaveBeenCalled();
    });
  });

  describe('getGoal', () => {
    it('returns a goal of the user’s dog including its author', async () => {
      const { service, goalRepository } = setup();
      goalRepository.getGoalById.mockResolvedValue(aGoal());

      await expect(service.getGoal(owner, 'g1')).resolves.toMatchObject({
        id: 'g1',
        createdBy: { id: 'u1', name: 'Jana' },
      });
    });

    it('reports a missing goal as not found', async () => {
      const { service, goalRepository } = setup();
      goalRepository.getGoalById.mockResolvedValue(null);

      await expect(service.getGoal(owner, 'nope')).rejects.toThrow(
        NotFoundException,
      );
    });

    it("reports a goal of another user's dog as not found", async () => {
      const { service, goalRepository } = setup();
      goalRepository.getGoalById.mockResolvedValue(aGoal());

      await expect(service.getGoal(stranger, 'g1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it("does not reveal the ID of another user's dog", async () => {
      const { service, goalRepository } = setup();
      goalRepository.getGoalById.mockResolvedValue(aGoal());

      await expect(service.getGoal(stranger, 'g1')).rejects.toThrow(
        'Goal with ID g1 not found',
      );
    });
  });

  describe('createGoal', () => {
    it('creates a goal authored by the signed-in user', async () => {
      const { service, goalRepository } = setup();
      const created = aGoal();
      goalRepository.createGoal.mockResolvedValue(created);

      await expect(
        service.createGoal(owner, 'd1', {
          title: '  Spolehlivá chůze u nohy  ',
          discipline: ' Poslušnost ',
          principle: '  Pes jde u levé nohy.  ',
        }),
      ).resolves.toEqual(created);

      expect(goalRepository.createGoal).toHaveBeenCalledWith({
        dogId: 'd1',
        createdById: 'u1',
        title: 'Spolehlivá chůze u nohy',
        discipline: 'Poslušnost',
        principle: 'Pes jde u levé nohy.',
        status: undefined,
        order: undefined,
      });
    });

    it('stores a goal without discipline and principle as null', async () => {
      const { service, goalRepository } = setup();
      goalRepository.createGoal.mockResolvedValue(aGoal());

      await service.createGoal(owner, 'd1', {
        title: 'Pac',
        discipline: '',
        principle: '   ',
      });

      expect(goalRepository.createGoal).toHaveBeenCalledWith(
        expect.objectContaining({ discipline: null, principle: null }),
      );
    });

    it("rejects a discipline the dog doesn't do", async () => {
      const { service, goalRepository } = setup();

      await expect(
        service.createGoal(owner, 'd1', {
          title: 'Skok přes překážku',
          discipline: 'Agility',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(goalRepository.createGoal).not.toHaveBeenCalled();
    });

    it("does not create a goal for another user's dog", async () => {
      const { service, goalRepository } = setup();

      await expect(
        service.createGoal(stranger, 'd1', { title: 'Pac' }),
      ).rejects.toThrow(NotFoundException);
      expect(goalRepository.createGoal).not.toHaveBeenCalled();
    });
  });

  describe('updateGoal', () => {
    it('updates a goal of the user’s dog', async () => {
      const { service, goalRepository } = setup();
      goalRepository.getGoalById.mockResolvedValue(aGoal());
      goalRepository.updateGoal.mockResolvedValue(
        aGoal({ discipline: 'Canicross' }),
      );

      await service.updateGoal(owner, 'g1', {
        title: ' Start na povel ',
        discipline: 'Canicross',
      });

      expect(goalRepository.updateGoal).toHaveBeenCalledWith('g1', {
        title: 'Start na povel',
        discipline: 'Canicross',
        principle: undefined,
        status: undefined,
        order: undefined,
      });
    });

    it("rejects a discipline the dog doesn't do", async () => {
      const { service, goalRepository } = setup();
      goalRepository.getGoalById.mockResolvedValue(aGoal());

      await expect(
        service.updateGoal(owner, 'g1', { discipline: 'Agility' }),
      ).rejects.toThrow(BadRequestException);
      expect(goalRepository.updateGoal).not.toHaveBeenCalled();
    });

    it('keeps a discipline the dog no longer does when it is unchanged', async () => {
      const { service, goalRepository, dogAccess } = setup();
      dogAccess.getAccessibleDog.mockResolvedValue(
        aDog({ disciplines: ['Canicross'] }),
      );
      goalRepository.getGoalById.mockResolvedValue(
        aGoal({ discipline: 'Poslušnost' }),
      );
      goalRepository.updateGoal.mockResolvedValue(aGoal());

      await service.updateGoal(owner, 'g1', {
        title: 'Nový název',
        discipline: 'Poslušnost',
      });

      expect(goalRepository.updateGoal).toHaveBeenCalledWith(
        'g1',
        expect.objectContaining({ discipline: 'Poslušnost' }),
      );
    });

    it("does not update a goal of another user's dog", async () => {
      const { service, goalRepository } = setup();
      goalRepository.getGoalById.mockResolvedValue(aGoal());

      await expect(
        service.updateGoal(stranger, 'g1', { title: 'Cizí' }),
      ).rejects.toThrow(NotFoundException);
      expect(goalRepository.updateGoal).not.toHaveBeenCalled();
    });
  });

  describe('deleteGoal', () => {
    it("does not delete a goal of another user's dog", async () => {
      const { service, goalRepository } = setup();
      goalRepository.getGoalById.mockResolvedValue(aGoal());

      await expect(service.deleteGoal(stranger, 'g1')).rejects.toThrow(
        NotFoundException,
      );
      expect(goalRepository.deleteGoal).not.toHaveBeenCalled();
    });

    it('deletes a goal of the user’s dog', async () => {
      const { service, goalRepository } = setup();
      goalRepository.getGoalById.mockResolvedValue(aGoal());
      goalRepository.deleteGoal.mockResolvedValue(aGoal());

      await service.deleteGoal(owner, 'g1');

      expect(goalRepository.deleteGoal).toHaveBeenCalledWith('g1');
    });
  });

  // #85: a trainer the dog is shared with works on the goals like the owner.
  describe('a trainer with a share', () => {
    it('lists and reads the goals of the shared dog', async () => {
      const { service, goalRepository } = setup();
      goalRepository.getGoalsByDogId.mockResolvedValue([aGoal()]);
      goalRepository.getGoalById.mockResolvedValue(aGoal());

      await expect(
        service.getGoalsByDogId(trainer, 'd1'),
      ).resolves.toHaveLength(1);
      await expect(service.getGoal(trainer, 'g1')).resolves.toMatchObject({
        id: 'g1',
      });
    });

    it('creates a goal authored by the trainer', async () => {
      const { service, goalRepository } = setup();
      goalRepository.createGoal.mockResolvedValue(aGoal({ createdById: 'u9' }));

      await service.createGoal(trainer, 'd1', { title: 'Zadání od trenéra' });

      expect(goalRepository.createGoal).toHaveBeenCalledWith(
        expect.objectContaining({ dogId: 'd1', createdById: 'u9' }),
      );
    });

    it("edits and deletes the owner's goal", async () => {
      const { service, goalRepository } = setup();
      goalRepository.getGoalById.mockResolvedValue(aGoal());
      goalRepository.updateGoal.mockResolvedValue(aGoal());
      goalRepository.deleteGoal.mockResolvedValue(aGoal());

      await service.updateGoal(trainer, 'g1', { title: 'Upraveno' });
      await service.deleteGoal(trainer, 'g1');

      expect(goalRepository.updateGoal).toHaveBeenCalled();
      expect(goalRepository.deleteGoal).toHaveBeenCalledWith('g1');
    });

    it('is turned away once the share is gone (the dog is no longer accessible)', async () => {
      const { service, goalRepository, dogAccess } = setup();
      goalRepository.getGoalById.mockResolvedValue(aGoal());
      dogAccess.getAccessibleDog.mockRejectedValue(new NotFoundException());

      await expect(service.getGoal(trainer, 'g1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(
        service.createGoal(trainer, 'd1', { title: 'Nesmí projít' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
