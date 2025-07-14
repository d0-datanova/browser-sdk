import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatanovaExperimentsService } from './datanova';
import { browserLocalStorage } from '../../storage/local-storage';
import { ExperimentAssignment, ExperimentConfig } from '../../types';

// Mock the API base URL global
declare global {
  var __API_BASE_URL__: string;
}
(global as { __API_BASE_URL__: string }).__API_BASE_URL__ = 'https://app.datanova.sh';

vi.mock('../../storage/local-storage');

describe('DatanovaExperimentsService', () => {
  let service: DatanovaExperimentsService;
  const sdkKey = 'dn_sdk_test123';

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    vi.mocked(browserLocalStorage.get).mockReturnValue(null);
    vi.mocked(browserLocalStorage.set).mockReturnValue(undefined);
    service = new DatanovaExperimentsService(sdkKey);
  });

  describe('getVariant', () => {
    it('should fetch config and assign variant', async () => {
      const experimentId = 123;
      const identifier = 'user456';
      const config: ExperimentConfig = {
        id: experimentId,
        trafficAllocation: 100, // 100% in traffic
        variantAllocation: 50, // 50/50 split
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => config,
      } as Response);

      const variant = await service.getVariant(experimentId, identifier);

      expect(fetch).toHaveBeenCalledWith(`https://app.datanova.sh/api/v1/exp/${experimentId}`, {
        headers: {
          Authorization: `Bearer ${sdkKey}`,
        },
      });

      expect(['control', 'variant']).toContain(variant);
      expect(browserLocalStorage.set).toHaveBeenCalledWith(
        `experiment_${experimentId}_${identifier}`,
        expect.objectContaining({
          experimentId,
          variant,
          assignedAt: expect.any(Number),
          expiresAt: expect.any(Number),
        })
      );
    });

    it('should return cached variant if not expired', async () => {
      const experimentId = 123;
      const identifier = 'user456';
      const cachedAssignment: ExperimentAssignment = {
        experimentId,
        variant: 'variant',
        assignedAt: Date.now() - 1000,
        expiresAt: Date.now() + 1000000, // Not expired
      };

      vi.mocked(browserLocalStorage.get).mockReturnValue(cachedAssignment);

      const variant = await service.getVariant(experimentId, identifier);

      expect(variant).toBe('variant');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should fetch new assignment if cached is expired', async () => {
      const experimentId = 123;
      const identifier = 'user456';
      const expiredAssignment: ExperimentAssignment = {
        experimentId,
        variant: 'variant',
        assignedAt: Date.now() - 1000000,
        expiresAt: Date.now() - 1000, // Expired
      };

      vi.mocked(browserLocalStorage.get).mockReturnValue(expiredAssignment);
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: experimentId,
          trafficAllocation: 100,
          variantAllocation: 50,
        }),
      } as Response);

      await service.getVariant(experimentId, identifier);

      expect(fetch).toHaveBeenCalled();
      expect(browserLocalStorage.set).toHaveBeenCalled();
    });

    it('should return control when experiment not found', async () => {
      const experimentId = 999;
      const identifier = 'user456';

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const variant = await service.getVariant(experimentId, identifier);

      expect(variant).toBe('control');

      const savedAssignment = vi.mocked(browserLocalStorage.set).mock
        .calls[0][1] as ExperimentAssignment;
      expect(savedAssignment.variant).toBe('control');
      expect(savedAssignment.expiresAt! - savedAssignment.assignedAt).toBe(15 * 60 * 1000); // 15 minutes
    });

    it('should return control when not in traffic', async () => {
      const experimentId = 123;
      const identifier = 'user_not_in_traffic';
      const config: ExperimentConfig = {
        id: experimentId,
        trafficAllocation: 10, // Only 10% in traffic
        variantAllocation: 50,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => config,
      } as Response);

      // Mock hash to return a value that puts user out of traffic
      const originalHash = service['hash'];
      service['hash'] = vi.fn().mockReturnValue(95); // 95% > 10% traffic allocation

      const variant = await service.getVariant(experimentId, identifier);

      expect(variant).toBe('control');

      const savedAssignment = vi.mocked(browserLocalStorage.set).mock
        .calls[0][1] as ExperimentAssignment;
      expect(savedAssignment.variant).toBe('control');
      expect(savedAssignment.expiresAt! - savedAssignment.assignedAt).toBe(60 * 60 * 1000); // 1 hour

      service['hash'] = originalHash;
    });

    it('should handle fetch errors gracefully', async () => {
      const experimentId = 123;
      const identifier = 'user456';

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const variant = await service.getVariant(experimentId, identifier);

      expect(variant).toBe('control');

      const savedAssignment = vi.mocked(browserLocalStorage.set).mock
        .calls[0][1] as ExperimentAssignment;
      expect(savedAssignment.variant).toBe('control');
      // When fetchConfig fails, it returns null, which is treated as NOT_FOUND
      expect(savedAssignment.expiresAt! - savedAssignment.assignedAt).toBe(15 * 60 * 1000); // 15 minutes for not found
    });

    it('should deterministically assign variants based on hash', async () => {
      const experimentId = 123;
      const config: ExperimentConfig = {
        id: experimentId,
        trafficAllocation: 100,
        variantAllocation: 50,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => config,
      } as Response);

      // Test multiple users
      const results = new Map<string, string>();
      for (let i = 0; i < 10; i++) {
        vi.mocked(browserLocalStorage.get).mockReturnValue(null); // No cache
        const variant = await service.getVariant(experimentId, `user${i}`);
        results.set(`user${i}`, variant);
      }

      // Verify we get both variants
      const variants = Array.from(results.values());
      expect(variants).toContain('control');
      expect(variants).toContain('variant');

      // Verify same user gets same variant
      vi.mocked(browserLocalStorage.get).mockReturnValue(null);
      const repeatVariant = await service.getVariant(experimentId, 'user1');
      expect(repeatVariant).toBe(results.get('user1'));
    });

    it('should handle assignment without expiration', async () => {
      const experimentId = 123;
      const identifier = 'user456';
      const assignmentWithoutExpiry: ExperimentAssignment = {
        experimentId,
        variant: 'control',
        assignedAt: Date.now() - 1000000,
        // No expiresAt field
      };

      vi.mocked(browserLocalStorage.get).mockReturnValue(assignmentWithoutExpiry);

      const variant = await service.getVariant(experimentId, identifier);

      expect(variant).toBe('control');
      expect(fetch).not.toHaveBeenCalled(); // Should use cached value
    });

    it('should handle different experiment configurations', async () => {
      const configs = [
        { id: 1, trafficAllocation: 100, variantAllocation: 0 }, // All control
        { id: 2, trafficAllocation: 100, variantAllocation: 100 }, // All variant
        { id: 3, trafficAllocation: 0, variantAllocation: 50 }, // No traffic
      ];

      for (const config of configs) {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => config,
        } as Response);

        const variant = await service.getVariant(config.id, 'user123');

        if (config.trafficAllocation === 0) {
          expect(variant).toBe('control'); // Not in traffic
        } else if (config.variantAllocation === 0) {
          expect(variant).toBe('control'); // All control
        } else if (config.variantAllocation === 100) {
          expect(variant).toBe('variant'); // All variant
        }
      }
    });

    it('should use correct storage keys', async () => {
      const experimentId = 456;
      const identifier = 'test@example.com';

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: experimentId,
          trafficAllocation: 100,
          variantAllocation: 50,
        }),
      } as Response);

      await service.getVariant(experimentId, identifier);

      expect(browserLocalStorage.get).toHaveBeenCalledWith(
        `experiment_${experimentId}_${identifier}`
      );
      expect(browserLocalStorage.set).toHaveBeenCalledWith(
        `experiment_${experimentId}_${identifier}`,
        expect.any(Object)
      );
    });
  });
});
