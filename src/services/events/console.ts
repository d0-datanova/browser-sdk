/* eslint-disable no-console */
import { Event, EventsService } from '../../types';

export class ConsoleEventsService implements EventsService {
  async send(event: Event): Promise<void> {
    const styles = {
      header: 'color: #0080ff; font-weight: bold;',
      label: 'color: #666; font-weight: bold;',
    };

    console.group(`%c📊 [Datanova] ${event.eventName} (${event.eventType})`, styles.header);

    if (event.properties && Object.keys(event.properties).length > 0) {
      console.log('%cProperties:', styles.label, event.properties);
    }

    console.log('%cUser:', styles.label, event.context.userId || 'Anonymous');

    console.log('%cSession:', styles.label, event.context.sessionId);

    console.groupEnd();
  }
}
