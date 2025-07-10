import { describe, it, expect, beforeEach } from 'vitest';
import { RandomExperimentsService } from './random';

describe('RandomExperimentsService', () => {
  let service: RandomExperimentsService;

  beforeEach(() => {
    service = new RandomExperimentsService();
  });

  describe('constructor', () => {
    it('should use default split ratio of 0.5', async () => {
      const results = new Map<string, number>();

      // Test with many users to check distribution
      for (let i = 0; i < 1000; i++) {
        const variant = await service.getVariant(1, `user${i}`);
        results.set(variant, (results.get(variant) || 0) + 1);
      }

      const controlCount = results.get('control') || 0;
      const variantCount = results.get('variant') || 0;

      // Should be roughly 50/50 split (allow 10% margin)
      expect(Math.abs(controlCount - variantCount)).toBeLessThan(100);
    });

    it('should accept custom split ratio', async () => {
      const customService = new RandomExperimentsService(0.2); // 20% variant, 80% control
      const results = new Map<string, number>();

      for (let i = 0; i < 1000; i++) {
        const variant = await customService.getVariant(1, `user${i}`);
        results.set(variant, (results.get(variant) || 0) + 1);
      }

      const controlCount = results.get('control') || 0;
      const variantCount = results.get('variant') || 0;

      // Variant should be roughly 20% (allow some margin)
      expect(variantCount).toBeGreaterThan(150);
      expect(variantCount).toBeLessThan(250);
      expect(controlCount).toBeGreaterThan(750);
      expect(controlCount).toBeLessThan(850);
    });
  });

  describe('getVariant', () => {
    it('should return consistent variant for same experiment and identifier', async () => {
      const experimentId = 123;
      const identifier = 'user456';

      const variant1 = await service.getVariant(experimentId, identifier);
      const variant2 = await service.getVariant(experimentId, identifier);
      const variant3 = await service.getVariant(experimentId, identifier);

      expect(variant1).toBe(variant2);
      expect(variant2).toBe(variant3);
    });

    it('should cache results', async () => {
      const experimentId = 123;
      const identifier = 'user456';

      // First call - not cached
      const variant1 = await service.getVariant(experimentId, identifier);

      // Subsequent calls should use cache
      const variant2 = await service.getVariant(experimentId, identifier);

      expect(variant1).toBe(variant2);
    });

    it('should return different variants for different identifiers', async () => {
      const experimentId = 123;
      const variants = new Set<string>();

      // Try multiple identifiers
      for (let i = 0; i < 100; i++) {
        const variant = await service.getVariant(experimentId, `user${i}`);
        variants.add(variant);
      }

      // Should have both variants
      expect(variants.has('control')).toBe(true);
      expect(variants.has('variant')).toBe(true);
    });

    it('should return different variants for different experiments', async () => {
      const resultsExp1 = new Map<string, number>();
      const resultsExp2 = new Map<string, number>();

      // Test multiple experiments with same users
      for (let i = 0; i < 100; i++) {
        const variant1 = await service.getVariant(1, `user${i}`);
        const variant2 = await service.getVariant(2, `user${i}`);

        resultsExp1.set(variant1, (resultsExp1.get(variant1) || 0) + 1);
        resultsExp2.set(variant2, (resultsExp2.get(variant2) || 0) + 1);
      }

      // Both experiments should have both variants
      expect(resultsExp1.has('control')).toBe(true);
      expect(resultsExp1.has('variant')).toBe(true);
      expect(resultsExp2.has('control')).toBe(true);
      expect(resultsExp2.has('variant')).toBe(true);
    });

    it('should handle edge cases', async () => {
      // Empty identifier
      const variant1 = await service.getVariant(123, '');
      expect(['control', 'variant']).toContain(variant1);

      // Very large experiment ID
      const variant2 = await service.getVariant(999999999, 'user123');
      expect(['control', 'variant']).toContain(variant2);

      // Special characters in identifier
      const variant3 = await service.getVariant(123, 'user@example.com');
      expect(['control', 'variant']).toContain(variant3);

      // Unicode in identifier
      const variant4 = await service.getVariant(123, 'пользователь123');
      expect(['control', 'variant']).toContain(variant4);
    });

    it('should maintain deterministic assignment', async () => {
      // Create new service instance
      const newService = new RandomExperimentsService();

      // Should get same variant as original service
      const originalVariant = await service.getVariant(456, 'testuser');
      const newServiceVariant = await newService.getVariant(456, 'testuser');

      expect(originalVariant).toBe(newServiceVariant);
    });

    it('should return promise', () => {
      const result = service.getVariant(123, 'user456');
      expect(result).toBeInstanceOf(Promise);
    });

    it('should handle extreme split ratios', async () => {
      // 0% variant
      const service0 = new RandomExperimentsService(0);
      for (let i = 0; i < 100; i++) {
        const variant = await service0.getVariant(1, `user${i}`);
        expect(variant).toBe('control');
      }

      // 100% variant
      const service100 = new RandomExperimentsService(1);
      for (let i = 0; i < 100; i++) {
        const variant = await service100.getVariant(1, `user${i}`);
        expect(variant).toBe('variant');
      }
    });
  });
});
