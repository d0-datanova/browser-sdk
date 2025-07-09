import { browserLocalStorage } from '../storage/local-storage';
import { EventType, ExperimentsService, InternalEventType, Tracker, Variant } from '../types';

interface AssignmentRecord {
  variant: string;
  assignedAt: number;
}

export class ExperimentManager {
  constructor(
    private experimentsService: ExperimentsService,
    private tracker: Tracker | undefined
  ) {}

  async getVariant(experimentId: number, identifier: string): Promise<Variant> {
    const assignmentKey = this.getAssignmentKey(experimentId, identifier);

    const previousAssignment = browserLocalStorage.get<AssignmentRecord>(assignmentKey);

    const variant = await this.experimentsService.getVariant(experimentId, identifier);

    const shouldTrackAssignment = !previousAssignment || previousAssignment.variant !== variant;

    if (shouldTrackAssignment) {
      const assignmentRecord: AssignmentRecord = {
        variant,
        assignedAt: Date.now(),
      };
      browserLocalStorage.set(assignmentKey, assignmentRecord);

      this.tracker?.track('$variant_assigned', InternalEventType.SYSTEM as EventType, {
        experiment_id: experimentId,
        variant,
      });
    }

    return variant;
  }

  private getAssignmentKey(experimentId: number, identifier: string): string {
    return `assignment_${experimentId}_${identifier}`;
  }
}
