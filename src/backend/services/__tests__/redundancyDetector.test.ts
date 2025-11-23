/**
 * Tests for RedundancyDetector
 * Test-Driven Development approach
 */

import { RedundancyDetector } from '../redundancyDetector';

describe('RedundancyDetector', () => {
  let detector: RedundancyDetector;
  
  beforeEach(() => {
    detector = new RedundancyDetector();
  });
  
  describe('findRedundancies', () => {
    it('should find similar code files', async () => {
      const files = [
        {
          id: '1',
          name: 'Z_CALC_DISCOUNT_V1',
          content: 'FUNCTION z_calc_discount. DATA: lv_discount TYPE p. IF total > 1000. lv_discount = total * 0.10. ENDIF. ENDFUNCTION.',
          type: 'FUNCTION',
          module: 'SD',
          linesOfCode: 10
        },
        {
          id: '2',
          name: 'Z_CALC_DISCOUNT_V2',
          content: 'FUNCTION z_calc_discount_new. DATA: lv_discount TYPE p. IF total > 1000. lv_discount = total * 0.10. ENDIF. ENDFUNCTION.',
          type: 'FUNCTION',
          module: 'SD',
          linesOfCode: 10
        }
      ];
      
      const redundancies = await detector.findRedundancies(files);
      
      expect(redundancies).toBeDefined();
      expect(Array.isArray(redundancies)).toBe(true);
    });
    
    it('should calculate similarity scores', async () => {
      const files = [
        {
          id: '1',
          name: 'Z_FUNC_A',
          content: 'Same content here',
          type: 'FUNCTION',
          module: 'SD',
          linesOfCode: 10
        },
        {
          id: '2',
          name: 'Z_FUNC_B',
          content: 'Same content here',
          type: 'FUNCTION',
          module: 'SD',
          linesOfCode: 10
        }
      ];
      
      const redundancies = await detector.findRedundancies(files);
      
      if (redundancies.length > 0) {
        expect(redundancies[0].similarity).toBeGreaterThan(0);
        expect(redundancies[0].similarity).toBeLessThanOrEqual(1);
      }
    });
    
    it('should sort by similarity descending', async () => {
      const files = [
        {
          id: '1',
          name: 'Z_FUNC_A',
          content: 'Content A',
          type: 'FUNCTION',
          module: 'SD',
          linesOfCode: 10
        },
        {
          id: '2',
          name: 'Z_FUNC_B',
          content: 'Content B',
          type: 'FUNCTION',
          module: 'SD',
          linesOfCode: 10
        },
        {
          id: '3',
          name: 'Z_FUNC_C',
          content: 'Content C',
          type: 'FUNCTION',
          module: 'SD',
          linesOfCode: 10
        }
      ];
      
      const redundancies = await detector.findRedundancies(files);
      
      for (let i = 1; i < redundancies.length; i++) {
        expect(redundancies[i - 1].similarity).toBeGreaterThanOrEqual(
          redundancies[i].similarity
        );
      }
    });
  });
  
  describe('getStatistics', () => {
    it('should calculate redundancy statistics', () => {
      const redundancies = [
        {
          file1: { id: '1', name: 'Z_A', type: 'FUNCTION', module: 'SD', content: '', linesOfCode: 100 },
          file2: { id: '2', name: 'Z_B', type: 'FUNCTION', module: 'SD', content: '', linesOfCode: 100 },
          similarity: 0.95,
          recommendation: 'Consolidate',
          potentialSavings: { linesOfCode: 60, effort: 'Low' }
        },
        {
          file1: { id: '3', name: 'Z_C', type: 'FUNCTION', module: 'MM', content: '', linesOfCode: 50 },
          file2: { id: '4', name: 'Z_D', type: 'FUNCTION', module: 'MM', content: '', linesOfCode: 50 },
          similarity: 0.87,
          recommendation: 'Consolidate',
          potentialSavings: { linesOfCode: 30, effort: 'Low' }
        }
      ];
      
      const stats = detector.getStatistics(redundancies);
      
      expect(stats.totalRedundancies).toBe(2);
      expect(stats.highSimilarity).toBe(1);
      expect(stats.mediumSimilarity).toBe(1);
      expect(stats.totalPotentialSavings).toBe(90);
      expect(stats.byModule).toHaveProperty('SD');
      expect(stats.byModule).toHaveProperty('MM');
    });
    
    it('should group by module correctly', () => {
      const redundancies = [
        {
          file1: { id: '1', name: 'Z_A', type: 'FUNCTION', module: 'SD', content: '', linesOfCode: 100 },
          file2: { id: '2', name: 'Z_B', type: 'FUNCTION', module: 'SD', content: '', linesOfCode: 100 },
          similarity: 0.95,
          recommendation: 'Consolidate',
          potentialSavings: { linesOfCode: 60, effort: 'Low' }
        },
        {
          file1: { id: '3', name: 'Z_C', type: 'FUNCTION', module: 'SD', content: '', linesOfCode: 50 },
          file2: { id: '4', name: 'Z_D', type: 'FUNCTION', module: 'SD', content: '', linesOfCode: 50 },
          similarity: 0.87,
          recommendation: 'Consolidate',
          potentialSavings: { linesOfCode: 30, effort: 'Low' }
        }
      ];
      
      const stats = detector.getStatistics(redundancies);
      
      expect(stats.byModule['SD']).toBe(2);
    });
  });
  
  describe('generateConsolidationPlan', () => {
    it('should generate consolidation plan', async () => {
      const redundancies = [
        {
          file1: { id: '1', name: 'Z_A', type: 'FUNCTION', module: 'SD', content: '', linesOfCode: 100 },
          file2: { id: '2', name: 'Z_B', type: 'FUNCTION', module: 'SD', content: '', linesOfCode: 100 },
          similarity: 0.95,
          recommendation: 'Consolidate these files',
          potentialSavings: { linesOfCode: 60, effort: 'Low' }
        }
      ];
      
      const plan = await detector.generateConsolidationPlan(redundancies);
      
      expect(plan).toHaveProperty('priority');
      expect(plan).toHaveProperty('items');
      expect(plan).toHaveProperty('totalSavings');
      expect(plan).toHaveProperty('estimatedEffort');
      expect(plan.items.length).toBeGreaterThan(0);
    });
    
    it('should prioritize by savings', async () => {
      const redundancies = [
        {
          file1: { id: '1', name: 'Z_A', type: 'FUNCTION', module: 'SD', content: '', linesOfCode: 100 },
          file2: { id: '2', name: 'Z_B', type: 'FUNCTION', module: 'SD', content: '', linesOfCode: 100 },
          similarity: 0.95,
          recommendation: 'Consolidate',
          potentialSavings: { linesOfCode: 200, effort: 'High' }
        },
        {
          file1: { id: '3', name: 'Z_C', type: 'FUNCTION', module: 'SD', content: '', linesOfCode: 50 },
          file2: { id: '4', name: 'Z_D', type: 'FUNCTION', module: 'SD', content: '', linesOfCode: 50 },
          similarity: 0.87,
          recommendation: 'Consolidate',
          potentialSavings: { linesOfCode: 30, effort: 'Low' }
        }
      ];
      
      const plan = await detector.generateConsolidationPlan(redundancies);
      
      expect(plan.items[0].savings).toBeGreaterThanOrEqual(plan.items[1].savings);
    });
    
    it('should set priority based on total savings', async () => {
      const highSavings = [
        {
          file1: { id: '1', name: 'Z_A', type: 'FUNCTION', module: 'SD', content: '', linesOfCode: 1000 },
          file2: { id: '2', name: 'Z_B', type: 'FUNCTION', module: 'SD', content: '', linesOfCode: 1000 },
          similarity: 0.95,
          recommendation: 'Consolidate',
          potentialSavings: { linesOfCode: 1200, effort: 'High' }
        }
      ];
      
      const plan = await detector.generateConsolidationPlan(highSavings);
      
      expect(plan.priority).toBe('high');
    });
  });
});
