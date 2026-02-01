export class WebinarAlreadyBookedException extends Error {
  constructor() {
    super('User already booked this webinar');
    this.name = 'WebinarAlreadyBookedException';
  }
}
