/**
 * Tests for DependencyGraphService
 * Test-Driven Development approach
 */

import { DependencyGraphService } from '../dependencyGraph';

describe('DependencyGraphService', () => {
  let service: DependencyGraphService;
  
  beforeEach(() => {
    service = new DependencyGraphService();
  });
  
  describe('buildGraph', () => {
    it('should build graph from ABAP objects', () => {
      const objects = [
        {
          name: 'Z_FUNC_A',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [
            { name: 'Z_FUNC_B', type: 'calls' }
          ],
          linesOfCode: 100
        },
        {
          name: 'Z_FUNC_B',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [],
          linesOfCode: 50
        }
      ];
      
      const graph = service.buildGraph(objects);
      
      expect(graph.nodes).toHaveLength(2);
      expect(graph.links).toHaveLength(1);
      expect(graph.stats.totalNodes).toBe(2);
      expect(graph.stats.totalLinks).toBe(1);
    });
    
    it('should calculate dependent counts correctly', () => {
      const objects = [
        {
          name: 'Z_FUNC_A',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [{ name: 'Z_FUNC_C', type: 'calls' }],
          linesOfCode: 100
        },
        {
          name: 'Z_FUNC_B',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [{ name: 'Z_FUNC_C', type: 'calls' }],
          linesOfCode: 50
        },
        {
          name: 'Z_FUNC_C',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [],
          linesOfCode: 25
        }
      ];
      
      const graph = service.buildGraph(objects);
      const funcC = graph.nodes.find(n => n.id === 'Z_FUNC_C');
      
      expect(funcC?.dependentCount).toBe(2);
    });
    
    it('should identify circular dependencies', () => {
      const objects = [
        {
          name: 'Z_FUNC_A',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [{ name: 'Z_FUNC_B', type: 'calls' }],
          linesOfCode: 100
        },
        {
          name: 'Z_FUNC_B',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [{ name: 'Z_FUNC_A', type: 'calls' }],
          linesOfCode: 50
        }
      ];
      
      const graph = service.buildGraph(objects);
      
      expect(graph.stats.circularDependencies.length).toBeGreaterThan(0);
    });
  });
  
  describe('findImpact', () => {
    it('should find all objects impacted by a change', () => {
      const objects = [
        {
          name: 'Z_FUNC_A',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [{ name: 'Z_FUNC_C', type: 'calls' }],
          linesOfCode: 100
        },
        {
          name: 'Z_FUNC_B',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [{ name: 'Z_FUNC_C', type: 'calls' }],
          linesOfCode: 50
        },
        {
          name: 'Z_FUNC_C',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [],
          linesOfCode: 25
        }
      ];
      
      const graph = service.buildGraph(objects);
      const impacted = service.findImpact('Z_FUNC_C', graph);
      
      expect(impacted).toContain('Z_FUNC_A');
      expect(impacted).toContain('Z_FUNC_B');
      expect(impacted).toHaveLength(2);
    });
    
    it('should handle transitive dependencies', () => {
      const objects = [
        {
          name: 'Z_FUNC_A',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [{ name: 'Z_FUNC_B', type: 'calls' }],
          linesOfCode: 100
        },
        {
          name: 'Z_FUNC_B',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [{ name: 'Z_FUNC_C', type: 'calls' }],
          linesOfCode: 50
        },
        {
          name: 'Z_FUNC_C',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [],
          linesOfCode: 25
        }
      ];
      
      const graph = service.buildGraph(objects);
      const impacted = service.findImpact('Z_FUNC_C', graph);
      
      expect(impacted).toContain('Z_FUNC_A');
      expect(impacted).toContain('Z_FUNC_B');
    });
  });
  
  describe('calculateComplexity', () => {
    it('should calculate complexity metrics', () => {
      const objects = [
        {
          name: 'Z_FUNC_A',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [
            { name: 'Z_FUNC_B', type: 'calls' },
            { name: 'Z_FUNC_C', type: 'calls' }
          ],
          linesOfCode: 100
        },
        {
          name: 'Z_FUNC_B',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [],
          linesOfCode: 50
        },
        {
          name: 'Z_FUNC_C',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [],
          linesOfCode: 25
        }
      ];
      
      const graph = service.buildGraph(objects);
      const complexity = service.calculateComplexity(graph);
      
      expect(complexity.averageDependencies).toBeGreaterThan(0);
      expect(complexity.maxDependencies).toBe(2);
      expect(complexity.coupling).toBeGreaterThan(0);
      expect(complexity.coupling).toBeLessThan(1);
    });
  });
  
  describe('findCriticalNodes', () => {
    it('should identify critical nodes', () => {
      const objects = [
        {
          name: 'Z_CRITICAL',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [
            { name: 'Z_FUNC_B', type: 'calls' },
            { name: 'Z_FUNC_C', type: 'calls' }
          ],
          linesOfCode: 100
        },
        {
          name: 'Z_FUNC_B',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [{ name: 'Z_CRITICAL', type: 'calls' }],
          linesOfCode: 50
        },
        {
          name: 'Z_FUNC_C',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [],
          linesOfCode: 25
        }
      ];
      
      const graph = service.buildGraph(objects);
      const critical = service.findCriticalNodes(graph, 5);
      
      expect(critical.length).toBeGreaterThan(0);
      expect(critical[0]).toHaveProperty('criticalityScore');
    });
  });
  
  describe('exportGraph', () => {
    it('should export graph as JSON', () => {
      const objects = [
        {
          name: 'Z_FUNC_A',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [],
          linesOfCode: 100
        }
      ];
      
      const graph = service.buildGraph(objects);
      const exported = service.exportGraph(graph, 'json');
      
      expect(exported).toBeDefined();
      expect(() => JSON.parse(exported)).not.toThrow();
    });
    
    it('should export graph as DOT format', () => {
      const objects = [
        {
          name: 'Z_FUNC_A',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [{ name: 'Z_FUNC_B', type: 'calls' }],
          linesOfCode: 100
        },
        {
          name: 'Z_FUNC_B',
          type: 'FUNCTION',
          module: 'SD',
          dependencies: [],
          linesOfCode: 50
        }
      ];
      
      const graph = service.buildGraph(objects);
      const exported = service.exportGraph(graph, 'dot');
      
      expect(exported).toContain('digraph dependencies');
      expect(exported).toContain('Z_FUNC_A');
      expect(exported).toContain('Z_FUNC_B');
    });
  });
});
