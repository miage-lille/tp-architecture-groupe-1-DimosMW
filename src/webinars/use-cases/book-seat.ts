import { IMailer } from 'src/core/ports/mailer.interface';
import { Executable } from 'src/shared/executable';
import { User } from 'src/users/entities/user.entity';
import { IUserRepository } from 'src/users/ports/user-repository.interface';
import { Participation } from 'src/webinars/entities/participation.entity';
import { WebinarAlreadyBookedException } from 'src/webinars/exceptions/webinar-already-booked';
import { WebinarNoMoreSeatsException } from 'src/webinars/exceptions/webinar-no-more-seats';
import { IParticipationRepository } from 'src/webinars/ports/participation-repository.interface';
import { IWebinarRepository } from 'src/webinars/ports/webinar-repository.interface';

type Request = {
  webinarId: string;
  user: User;
};
type Response = void;

export class BookSeat implements Executable<Request, Response> {
  constructor(
    private readonly participationRepository: IParticipationRepository,
    private readonly userRepository: IUserRepository,
    private readonly webinarRepository: IWebinarRepository,
    private readonly mailer: IMailer,
  ) {}
  async execute({ webinarId, user }: Request): Promise<Response> {
    const webinar = await this.webinarRepository.findById(webinarId);
    if (!webinar) {
      throw new Error('Webinar not found');
    }

    const participations = await this.participationRepository.findByWebinarId(
      webinarId,
    );

    const alreadyBooked = participations.some(
      (participation) => participation.props.userId === user.props.id,
    );
    if (alreadyBooked) {
      throw new WebinarAlreadyBookedException();
    }

    if (webinar.hasNoMoreSeats(participations.length)) {
      throw new WebinarNoMoreSeatsException();
    }

    const participation = new Participation({
      userId: user.props.id,
      webinarId: webinarId,
    });

    await this.participationRepository.save(participation);

    const organizer = await this.userRepository.findById(
      webinar.props.organizerId,
    );
    if (organizer) {
      await this.mailer.send({
        to: organizer.props.email,
        subject: 'New participation',
        body: `A new participant has registered for your webinar "${webinar.props.title}".`,
      });
    }
  }
}
