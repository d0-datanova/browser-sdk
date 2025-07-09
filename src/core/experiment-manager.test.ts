import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExperimentManager } from './experiment-manager';
import { browserLocalStorage } from '../storage/local-storage';
import { ExperimentsService, Tracker, EventType, InternalEventType } from '../types';

vi.mock('../storage/local-storage');

describe('ExperimentManager', () => {
  let experimentManager: ExperimentManager;
  let mockExperimentsService: ExperimentsService;
  let mockTracker: Tracker;

  beforeEach(() => {
    vi.clearAllMocks();

    mockExperimentsService = {
      getVariant: vi.fn().mockResolvedValue('control'),
    };

    mockTracker = {
      track: vi.fn(),
    };

    vi.mocked(browserLocalStorage.get).mockReturnValue(null);
    vi.mocked(browserLocalStorage.set).mockReturnValue(undefined);

    experimentManager = new ExperimentManager(mockExperimentsService, mockTracker);
  });

  describe('getVariant', () => {
    it('should get variant from experiments service', async () => {
      const experimentId = 123;
      const identifier = 'user-456';

      const variant = await experimentManager.getVariant(experimentId, identifier);

      expect(variant).toBe('control');
      expect(mockExperimentsService.getVariant).toHaveBeenCalledWith(experimentId, identifier);
    });

    it('should track assignment for first time', async () => {
      const experimentId = 123;
      const identifier = 'user-456';

      await experimentManager.getVariant(experimentId, identifier);

      expect(mockTracker.track).toHaveBeenCalledWith(
        '$variant_assigned',
        InternalEventType.SYSTEM as EventType,
        {
          experiment_id: experimentId,
          variant: 'control',
        }
      );
    });

    it('should store assignment record in local storage', async () => {
      const experimentId = 123;
      const identifier = 'user-456';
      const beforeTime = Date.now();

      await experimentManager.getVariant(experimentId, identifier);

      const afterTime = Date.now();

      expect(browserLocalStorage.set).toHaveBeenCalledWith('assignment_123_user-456', {
        variant: 'control',
        assignedAt: expect.any(Number),
      });

      const storedRecord = vi.mocked(browserLocalStorage.set).mock.calls[0][1] as {
        variant: string;
        assignedAt: number;
      };
      expect(storedRecord.assignedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(storedRecord.assignedAt).toBeLessThanOrEqual(afterTime);
    });

    it('should not track assignment if variant has not changed', async () => {
      const experimentId = 123;
      const identifier = 'user-456';

      // Mock previous assignment
      vi.mocked(browserLocalStorage.get).mockReturnValue({
        variant: 'control',
        assignedAt: Date.now() - 1000,
      });

      await experimentManager.getVariant(experimentId, identifier);

      expect(mockTracker.track).not.toHaveBeenCalled();
      expect(browserLocalStorage.set).not.toHaveBeenCalled();
    });

    it('should track assignment if variant has changed', async () => {
      const experimentId = 123;
      const identifier = 'user-456';

      // Mock previous assignment with different variant
      vi.mocked(browserLocalStorage.get).mockReturnValue({
        variant: 'control',
        assignedAt: Date.now() - 1000,
      });

      // Service now returns different variant
      vi.mocked(mockExperimentsService.getVariant).mockResolvedValue('variant');

      await experimentManager.getVariant(experimentId, identifier);

      expect(mockTracker.track).toHaveBeenCalledWith(
        '$variant_assigned',
        InternalEventType.SYSTEM as EventType,
        {
          experiment_id: experimentId,
          variant: 'variant',
        }
      );

      expect(browserLocalStorage.set).toHaveBeenCalledWith('assignment_123_user-456', {
        variant: 'variant',
        assignedAt: expect.any(Number),
      });
    });

    it('should handle variant type correctly', async () => {
      vi.mocked(mockExperimentsService.getVariant).mockResolvedValue('variant');

      const variant = await experimentManager.getVariant(789, 'user-123');

      expect(variant).toBe('variant');
    });

    it('should work without tracker', async () => {
      const managerWithoutTracker = new ExperimentManager(mockExperimentsService, undefined);

      const variant = await managerWithoutTracker.getVariant(123, 'user-456');

      expect(variant).toBe('control');
      expect(browserLocalStorage.set).toHaveBeenCalled(); // Still stores assignment
    });

    it('should handle different experiment and user combinations', async () => {
      const combinations = [
        { experimentId: 1, identifier: 'user-1', expectedKey: 'assignment_1_user-1' },
        { experimentId: 2, identifier: 'user-1', expectedKey: 'assignment_2_user-1' },
        { experimentId: 1, identifier: 'user-2', expectedKey: 'assignment_1_user-2' },
      ];

      for (const { experimentId, identifier, expectedKey } of combinations) {
        await experimentManager.getVariant(experimentId, identifier);

        expect(browserLocalStorage.set).toHaveBeenCalledWith(expectedKey, expect.any(Object));
      }
    });

    it('should handle service errors', async () => {
      vi.mocked(mockExperimentsService.getVariant).mockRejectedValue(new Error('Service error'));

      await expect(experimentManager.getVariant(123, 'user-456')).rejects.toThrow('Service error');
    });
  });
});
