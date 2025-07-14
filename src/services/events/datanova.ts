import { Event, EventsService } from '../../types';

declare const __API_BASE_URL__: string;

export class DatanovaEventsService implements EventsService {
  constructor(
    private sdkKey: string,
    private endpoint: string = `${__API_BASE_URL__}/api/v1/e`
  ) {
    if (!sdkKey || !sdkKey.startsWith('dn_sdk_')) {
      throw new Error("Invalid API key. Must start with 'dn_sdk_'");
    }
  }

  async send(event: Event): Promise<void> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.sdkKey}`,
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Silently fail - tracking should not break the app
      console.error('[Datanova] Failed to send event:', error);
    }
  }
}
