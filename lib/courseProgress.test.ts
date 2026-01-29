/**
 * Tests for Course Progress Resolution
 * 
 * Tests the resolveCompletedTitles function to ensure it correctly
 * maps module IDs to titles and identifies unmatched IDs.
 */

import { describe, it, expect } from '@jest/globals';
import { resolveCompletedTitles, flattenCourseMap, computePhaseProgress, formatPhaseProgressSummary } from './courseProgress';
import { CourseSection, CourseModule } from './types';

describe('courseProgress', () => {
  describe('flattenCourseMap', () => {
    it('should flatten hierarchical course map', () => {
      const courseMap: CourseSection[] = [
        {
          id: 'phase-1',
          title: 'Phase 1',
          items: [
            { id: 'phase-1/item-1', title: 'Item 1', type: 'file' },
            { id: 'phase-1/item-2', title: 'Item 2', type: 'file' },
          ],
        },
        {
          id: 'phase-2',
          title: 'Phase 2',
          items: [
            { id: 'phase-2/item-1', title: 'Item 3', type: 'file' },
          ],
        },
      ];

      const flat = flattenCourseMap(courseMap);
      expect(flat).toHaveLength(3);
      expect(flat[0]).toEqual({ id: 'phase-1/item-1', title: 'Item 1' });
      expect(flat[1]).toEqual({ id: 'phase-1/item-2', title: 'Item 2' });
      expect(flat[2]).toEqual({ id: 'phase-2/item-1', title: 'Item 3' });
    });

    it('should flatten flat course map', () => {
      const courseMap: CourseModule[] = [
        { id: 'module-1', title: 'Module 1' },
        { id: 'module-2', title: 'Module 2' },
      ];

      const flat = flattenCourseMap(courseMap);
      expect(flat).toHaveLength(2);
      expect(flat[0]).toEqual({ id: 'module-1', title: 'Module 1' });
      expect(flat[1]).toEqual({ id: 'module-2', title: 'Module 2' });
    });
  });

  describe('resolveCompletedTitles', () => {
    it('should resolve all IDs when all items are completed', () => {
      const courseMap: CourseSection[] = [
        {
          id: 'phase-1',
          title: 'Phase 1',
          items: [
            { id: 'phase-1/item-1', title: 'Item 1', type: 'file' },
            { id: 'phase-1/item-2', title: 'Item 2', type: 'file' },
            { id: 'phase-1/item-3', title: 'Item 3', type: 'file' },
          ],
        },
      ];

      const completedModuleIds = ['phase-1/item-1', 'phase-1/item-2', 'phase-1/item-3'];
      const result = resolveCompletedTitles(courseMap, completedModuleIds);

      expect(result.titles).toHaveLength(3);
      expect(result.titles).toEqual(['Item 1', 'Item 2', 'Item 3']);
      expect(result.unmatchedIds).toHaveLength(0);
    });

    it('should identify unmatched IDs', () => {
      const courseMap: CourseSection[] = [
        {
          id: 'phase-1',
          title: 'Phase 1',
          items: [
            { id: 'phase-1/item-1', title: 'Item 1', type: 'file' },
            { id: 'phase-1/item-2', title: 'Item 2', type: 'file' },
          ],
        },
      ];

      const completedModuleIds = ['phase-1/item-1', 'unknown-id', 'phase-1/item-2'];
      const result = resolveCompletedTitles(courseMap, completedModuleIds);

      expect(result.titles).toHaveLength(2);
      expect(result.titles).toEqual(['Item 1', 'Item 2']);
      expect(result.unmatchedIds).toHaveLength(1);
      expect(result.unmatchedIds).toEqual(['unknown-id']);
    });

    it('should handle empty course map', () => {
      const result = resolveCompletedTitles([], ['id-1', 'id-2']);

      expect(result.titles).toHaveLength(0);
      expect(result.unmatchedIds).toHaveLength(2);
      expect(result.unmatchedIds).toEqual(['id-1', 'id-2']);
    });

    it('should handle empty completed IDs', () => {
      const courseMap: CourseSection[] = [
        {
          id: 'phase-1',
          title: 'Phase 1',
          items: [
            { id: 'phase-1/item-1', title: 'Item 1', type: 'file' },
          ],
        },
      ];

      const result = resolveCompletedTitles(courseMap, []);

      expect(result.titles).toHaveLength(0);
      expect(result.unmatchedIds).toHaveLength(0);
    });

    it('should handle null/undefined inputs', () => {
      const result1 = resolveCompletedTitles(null, ['id-1']);
      expect(result1.titles).toHaveLength(0);
      expect(result1.unmatchedIds).toHaveLength(1);

      const result2 = resolveCompletedTitles([], null);
      expect(result2.titles).toHaveLength(0);
      expect(result2.unmatchedIds).toHaveLength(0);
    });

    it('should handle string ID type mismatches', () => {
      const courseMap: CourseSection[] = [
        {
          id: 'phase-1',
          title: 'Phase 1',
          items: [
            { id: '123', title: 'Item 1', type: 'file' }, // Number as string
          ],
        },
      ];

      // Client sends number, server has string
      const result1 = resolveCompletedTitles(courseMap, ['123']);
      expect(result1.titles).toHaveLength(1);
      expect(result1.unmatchedIds).toHaveLength(0);

      // Client sends string, server has string
      const result2 = resolveCompletedTitles(courseMap, ['123']);
      expect(result2.titles).toHaveLength(1);
      expect(result2.unmatchedIds).toHaveLength(0);
    });
  });

  describe('computePhaseProgress', () => {
    it('should compute phase progress for hierarchical course map', () => {
      const courseMap: CourseSection[] = [
        {
          id: 'phase-1',
          title: 'Phase 1',
          items: [
            { id: 'phase-1/item-1', title: 'Item 1', type: 'file' },
            { id: 'phase-1/item-2', title: 'Item 2', type: 'file' },
            { id: 'phase-1/item-3', title: 'Item 3', type: 'file' },
          ],
        },
        {
          id: 'phase-2',
          title: 'Phase 2',
          items: [
            { id: 'phase-2/item-1', title: 'Item 4', type: 'file' },
            { id: 'phase-2/item-2', title: 'Item 5', type: 'file' },
          ],
        },
      ];

      // Complete Phase 1, partial Phase 2
      const completedModuleIds = ['phase-1/item-1', 'phase-1/item-2', 'phase-1/item-3', 'phase-2/item-1'];
      const result = computePhaseProgress(courseMap, completedModuleIds);

      expect(result.totalModules).toBe(5);
      expect(result.completedModules).toBe(4);
      expect(result.phases).toHaveLength(2);

      // Phase 1 should be complete
      expect(result.phases[0].phaseId).toBe('phase-1');
      expect(result.phases[0].phaseTitle).toBe('Phase 1');
      expect(result.phases[0].total).toBe(3);
      expect(result.phases[0].completed).toBe(3);
      expect(result.phases[0].isComplete).toBe(true);
      expect(result.phases[0].remainingTitles).toHaveLength(0);

      // Phase 2 should be incomplete
      expect(result.phases[1].phaseId).toBe('phase-2');
      expect(result.phases[1].phaseTitle).toBe('Phase 2');
      expect(result.phases[1].total).toBe(2);
      expect(result.phases[1].completed).toBe(1);
      expect(result.phases[1].isComplete).toBe(false);
      expect(result.phases[1].remainingTitles).toEqual(['Item 5']);
    });

    it('should handle all phases complete', () => {
      const courseMap: CourseSection[] = [
        {
          id: 'phase-1',
          title: 'Phase 1',
          items: [
            { id: 'phase-1/item-1', title: 'Item 1', type: 'file' },
            { id: 'phase-1/item-2', title: 'Item 2', type: 'file' },
          ],
        },
        {
          id: 'phase-2',
          title: 'Phase 2',
          items: [
            { id: 'phase-2/item-1', title: 'Item 3', type: 'file' },
          ],
        },
      ];

      const completedModuleIds = ['phase-1/item-1', 'phase-1/item-2', 'phase-2/item-1'];
      const result = computePhaseProgress(courseMap, completedModuleIds);

      expect(result.totalModules).toBe(3);
      expect(result.completedModules).toBe(3);
      expect(result.phases.every(p => p.isComplete)).toBe(true);
    });

    it('should limit remaining titles to 3', () => {
      const courseMap: CourseSection[] = [
        {
          id: 'phase-1',
          title: 'Phase 1',
          items: [
            { id: 'phase-1/item-1', title: 'Item 1', type: 'file' },
            { id: 'phase-1/item-2', title: 'Item 2', type: 'file' },
            { id: 'phase-1/item-3', title: 'Item 3', type: 'file' },
            { id: 'phase-1/item-4', title: 'Item 4', type: 'file' },
            { id: 'phase-1/item-5', title: 'Item 5', type: 'file' },
          ],
        },
      ];

      // Only complete 1 item
      const completedModuleIds = ['phase-1/item-1'];
      const result = computePhaseProgress(courseMap, completedModuleIds);

      expect(result.phases[0].remainingTitles).toHaveLength(3);
      expect(result.phases[0].remainingTitles).toEqual(['Item 2', 'Item 3', 'Item 4']);
    });

    it('should handle empty course map', () => {
      const result = computePhaseProgress([], ['id-1']);

      expect(result.totalModules).toBe(0);
      expect(result.completedModules).toBe(0);
      expect(result.phases).toHaveLength(0);
    });

    it('should handle empty completed IDs', () => {
      const courseMap: CourseSection[] = [
        {
          id: 'phase-1',
          title: 'Phase 1',
          items: [
            { id: 'phase-1/item-1', title: 'Item 1', type: 'file' },
          ],
        },
      ];

      const result = computePhaseProgress(courseMap, []);

      expect(result.totalModules).toBe(1);
      expect(result.completedModules).toBe(0);
      expect(result.phases[0].isComplete).toBe(false);
      expect(result.phases[0].remainingTitles).toEqual(['Item 1']);
    });

    it('should handle flat course map structure', () => {
      const courseMap: CourseModule[] = [
        { id: 'module-1', title: 'Module 1' },
        { id: 'module-2', title: 'Module 2' },
        { id: 'module-3', title: 'Module 3' },
      ];

      const completedModuleIds = ['module-1', 'module-2'];
      const result = computePhaseProgress(courseMap, completedModuleIds);

      expect(result.totalModules).toBe(3);
      expect(result.completedModules).toBe(2);
      expect(result.phases).toHaveLength(1);
      expect(result.phases[0].phaseTitle).toBe('All Modules');
      expect(result.phases[0].isComplete).toBe(false);
      expect(result.phases[0].remainingTitles).toEqual(['Module 3']);
    });
  });

  describe('formatPhaseProgressSummary', () => {
    it('should format complete phases correctly', () => {
      const summary = {
        totalModules: 5,
        completedModules: 5,
        phases: [
          {
            phaseId: 'phase-1',
            phaseTitle: 'Phase 1',
            total: 3,
            completed: 3,
            isComplete: true,
            remainingTitles: [],
          },
          {
            phaseId: 'phase-2',
            phaseTitle: 'Phase 2',
            total: 2,
            completed: 2,
            isComplete: true,
            remainingTitles: [],
          },
        ],
      };

      const formatted = formatPhaseProgressSummary(summary);
      
      expect(formatted).toContain('Overall: 5/5 complete');
      expect(formatted).toContain('Phase 1 (3/3): ✅ COMPLETE');
      expect(formatted).toContain('Phase 2 (2/2): ✅ COMPLETE');
      expect(formatted).toContain('🎉 All phases complete');
    });

    it('should format incomplete phases with remaining modules', () => {
      const summary = {
        totalModules: 5,
        completedModules: 2,
        phases: [
          {
            phaseId: 'phase-1',
            phaseTitle: 'Phase 1',
            total: 3,
            completed: 1,
            isComplete: false,
            remainingTitles: ['Item 2', 'Item 3'],
          },
        ],
      };

      const formatted = formatPhaseProgressSummary(summary);
      
      expect(formatted).toContain('Overall: 2/5 complete');
      expect(formatted).toContain('Phase 1 (1/3): IN PROGRESS');
      expect(formatted).toContain('Remaining (top 2): Item 2, Item 3');
    });

    it('should show "+N more" when there are more than 3 remaining', () => {
      const summary = {
        totalModules: 10,
        completedModules: 2,
        phases: [
          {
            phaseId: 'phase-1',
            phaseTitle: 'Phase 1',
            total: 10,
            completed: 2,
            isComplete: false,
            remainingTitles: ['Item 3', 'Item 4', 'Item 5'],
          },
        ],
      };

      const formatted = formatPhaseProgressSummary(summary);
      
      expect(formatted).toContain('Remaining (top 3): Item 3, Item 4, Item 5 (+5 more)');
    });
  });
});

