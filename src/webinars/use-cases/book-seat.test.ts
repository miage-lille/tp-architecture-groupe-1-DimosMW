import { InMemoryMailer } from 'src/core/adapters/in-memory-mailer';
import { InMemoryUserRepository } from 'src/users/adapters/user-repository.in-memory';
import { User } from 'src/users/entities/user.entity';
import { InMemoryParticipationRepository } from 'src/webinars/adapters/participation-repository.in-memory';
import { InMemoryWebinarRepository } from 'src/webinars/adapters/webinar-repository.in-memory';
import { Participation } from 'src/webinars/entities/participation.entity';
import { Webinar } from 'src/webinars/entities/webinar.entity';
import { BookSeat } from 'src/webinars/use-cases/book-seat';

describe('Feature: Book seat', () => {
  let participationRepository: InMemoryParticipationRepository;
  let userRepository: InMemoryUserRepository;
  let webinarRepository: InMemoryWebinarRepository;
  let mailer: InMemoryMailer;
  let useCase: BookSeat;

  const dimos = new User({
    id: 'dimos-id',
    email: 'dimos@example.com',
    password: 'password',
  });

  const guillaume = new User({
    id: 'guillaume-id',
    email: 'guillaume@example.com',
    password: 'password',
  });

  const webinar = new Webinar({
    id: 'webinar-1',
    organizerId: 'dimos-id',
    title: 'Webinar title',
    startDate: new Date('2024-01-10T10:00:00.000Z'),
    endDate: new Date('2024-01-10T11:00:00.000Z'),
    seats: 2,
  });

  beforeEach(() => {
    participationRepository = new InMemoryParticipationRepository();
    userRepository = new InMemoryUserRepository([dimos]);
    webinarRepository = new InMemoryWebinarRepository([webinar]);
    mailer = new InMemoryMailer();
    useCase = new BookSeat(
      participationRepository,
      userRepository,
      webinarRepository,
      mailer,
    );
  });

  describe('Scenario: happy path', () => {
    it('should save a participation and send email', async () => {
      await useCase.execute({
        webinarId: 'webinar-1',
        user: guillaume,
      });

      expect(participationRepository.database).toHaveLength(1);
      expect(mailer.sentEmails).toHaveLength(1);
      expect(mailer.sentEmails[0].to).toBe('dimos@example.com');
    });
  });

  describe('Scenario: webinar has no more seats', () => {
    beforeEach(() => {
      participationRepository.database.push(
        new Participation({
          userId: 'user-1',
          webinarId: 'webinar-1',
        }),
      );
      participationRepository.database.push(
        new Participation({
          userId: 'user-2',
          webinarId: 'webinar-1',
        }),
      );
    });

    it('should throw an error', async () => {
      await expect(
        useCase.execute({
          webinarId: 'webinar-1',
          user: guillaume,
        }),
      ).rejects.toThrow('Webinar has no more seats available');
    });
  });

  describe('Scenario: user already booked', () => {
    beforeEach(() => {
      participationRepository.database.push(
        new Participation({
          userId: 'guillaume-id',
          webinarId: 'webinar-1',
        }),
      );
    });

    it('should throw an error', async () => {
      await expect(
        useCase.execute({
          webinarId: 'webinar-1',
          user: guillaume,
        }),
      ).rejects.toThrow('User already booked this webinar');
    });
  });
});
