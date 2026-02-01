export class WebinarNoMoreSeatsException extends Error {
  constructor() {
    super('Webinar has no more seats available');
    this.name = 'WebinarNoMoreSeatsException';
  }
}
