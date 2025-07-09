import { browserLocalStorage } from '../../storage/local-storage';
import { ExperimentAssignment, ExperimentConfig, ExperimentsService, Variant } from '../../types';

declare const __API_BASE_URL__: string;

const ASSIGNMENT_REASONS = {
  NOT_FOUND: 'not-found',
  ERROR: 'error',
  NOT_IN_TRAFFIC: 'not-in-traffic',
  ASSIGNED: 'assigned',
} as const;

type AssignmentReason = (typeof ASSIGNMENT_REASONS)[keyof typeof ASSIGNMENT_REASONS];

const ASSIGNMENT_TTLS: Record<AssignmentReason, number> = {
  [ASSIGNMENT_REASONS.ERROR]: 60 * 1000, // 1 minute
  [ASSIGNMENT_REASONS.NOT_IN_TRAFFIC]: 60 * 60 * 1000, // 1 hour
  [ASSIGNMENT_REASONS.NOT_FOUND]: 15 * 60 * 1000, // 15 minutes
  [ASSIGNMENT_REASONS.ASSIGNED]: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class DatanovaExperimentsService implements ExperimentsService {
  private sdkKey: string;

  constructor(sdkKey: string) {
    this.sdkKey = sdkKey;
  }

  async getVariant(experimentId: number, identifier: string): Promise<Variant> {
    const storageKey = this.storageKey(experimentId, identifier);
    const stored = browserLocalStorage.get<ExperimentAssignment>(storageKey);

    if (stored && !this.isExpired(stored)) {
      return stored.variant as Variant;
    }

    try {
      const config = await this.fetchConfig(experimentId);
      if (!config) {
        return this.saveAssignment(
          { experimentId, identifier },
          'control',
          ASSIGNMENT_REASONS.NOT_FOUND
        );
      }

      const trafficHash = this.hash(`${experimentId}:${identifier}`);
      if (trafficHash % 100 >= config.trafficAllocation) {
        // Not in traffic
        return this.saveAssignment(
          { experimentId, identifier },
          'control',
          ASSIGNMENT_REASONS.NOT_IN_TRAFFIC
        );
      }

      const variant = this.determineVariant(experimentId, identifier, config);
      return this.saveAssignment(
        { experimentId, identifier },
        variant,
        ASSIGNMENT_REASONS.ASSIGNED
      );
    } catch {
      return this.saveAssignment({ experimentId, identifier }, 'control', ASSIGNMENT_REASONS.ERROR);
    }
  }

  private determineVariant(
    experimentId: number,
    identifier: string,
    config: ExperimentConfig
  ): Variant {
    const variantHash = this.hash(`${experimentId}:${identifier}:variant`);
    return variantHash % 100 < config.variantAllocation ? 'variant' : 'control';
  }

  private saveAssignment(
    request: { experimentId: number; identifier: string },
    variant: Variant,
    reason: AssignmentReason
  ): Variant {
    const { experimentId, identifier } = request;
    const assignment: ExperimentAssignment = {
      experimentId,
      variant,
      assignedAt: Date.now(),
      expiresAt: Date.now() + ASSIGNMENT_TTLS[reason],
    };

    const storageKey = this.storageKey(experimentId, identifier);
    browserLocalStorage.set(storageKey, assignment);
    return variant;
  }

  private isExpired(assignment: ExperimentAssignment): boolean {
    if (!assignment.expiresAt) return false;
    return Date.now() >= assignment.expiresAt;
  }

  private async fetchConfig(experimentId: number): Promise<ExperimentConfig | null> {
    try {
      const response = await fetch(`${__API_BASE_URL__}/api/v1/experiments/${experimentId}`, {
        headers: {
          Authorization: `Bearer ${this.sdkKey}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch {
      return null;
    }
  }

  private hash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private storageKey(experimentId: number, identifier: string): string {
    return `experiment_${experimentId}_${identifier}`;
  }
}
