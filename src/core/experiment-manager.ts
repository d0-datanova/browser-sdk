import { browserLocalStorage } from '../storage/local-storage';
import { EventType, ExperimentsService, InternalEventType, Tracker } from '../types';

interface ExposureRecord {
  variant: string;
  trackedAt: number;
}

export class ExperimentManager {
  constructor(
    private experimentsService: ExperimentsService,
    private tracker: Tracker | undefined
  ) {}

  async getVariant(experimentId: number, identifier: string): Promise<string> {
    const exposureKey = this.getExposureKey(experimentId, identifier);

    const previousExposure = browserLocalStorage.get<ExposureRecord>(exposureKey);

    const variant = await this.experimentsService.getVariant(experimentId, identifier);

    const shouldTrackExposure = !previousExposure || previousExposure.variant !== variant;

    if (shouldTrackExposure) {
      const exposureRecord: ExposureRecord = {
        variant,
        trackedAt: Date.now(),
      };
      browserLocalStorage.set(exposureKey, exposureRecord);

      this.tracker?.track('$experiment_exposed', InternalEventType.SYSTEM as EventType, {
        experiment_id: experimentId,
        variant,
      });
    }

    return variant;
  }

  private getExposureKey(experimentId: number, identifier: string): string {
    return `exposure_${experimentId}_${identifier}`;
  }
}
