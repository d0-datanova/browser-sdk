import { Event, EventsService } from '../../types';

export class NoopEventsService implements EventsService {
  async send(_event: Event): Promise<void> {
    // No-op implementation - does nothing
  }
}
