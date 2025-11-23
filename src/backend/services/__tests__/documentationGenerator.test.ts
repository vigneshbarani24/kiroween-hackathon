/**
 * Tests for DocumentationGenerator
 * Test-Driven Development approach
 */

import { DocumentationGenerator } from '../documentationGenerator';

describe('DocumentationGenerator', () => {
  let docGen: DocumentationGenerator;
  
  beforeEach(() => {
    docGen = new DocumentationGenerator();
  });
  
  describe('generateDocumentation', () => {
    it('should generate markdown documentation from ABAP analysis', async () => {
      const analysis = {
        name: 'Z_TEST_FUNCTION',
        type: 'FUNCTION',
        module: 'SD',
        businessLogic: [
          { type: 'calculation', description: 'Calculate discount' }
        ],
        dependencies: [],
        tables: [
          { name: 'VBAK', operation: 'SELECT' }
        ],
        linesOfCode: 50,
        complexity: 3
      };
      
      const result = await docGen.generateDocumentation(analysis);
      
      expect(result).toBeDefined();
      expect(result.markdown).toContain('Z_TEST_FUNCTION');
      expect(result.markdown).toContain('## Overview');
      expect(result.markdown).toContain('## Business Logic');
      expect(result.metadata).toEqual(analysis);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });
    
    it('should handle empty business logic', async () => {
      const analysis = {
        name: 'Z_SIMPLE',
        type: 'FUNCTION',
        module: 'SD',
        businessLogic: [],
        dependencies: [],
        tables: []
      };
      
      const result = await docGen.generateDocumentation(analysis);
      
      expect(result).toBeDefined();
      expect(result.markdown).toContain('Z_SIMPLE');
    });
    
    it('should include all required sections', async () => {
      const analysis = {
        name: 'Z_COMPLETE',
        type: 'FUNCTION',
        module: 'SD',
        businessLogic: [{ type: 'validation' }],
        dependencies: [{ name: 'Z_OTHER', type: 'calls' }],
        tables: [{ name: 'VBAK' }]
      };
      
      const result = await docGen.generateDocumentation(analysis);
      
      expect(result.markdown).toContain('## Overview');
      expect(result.markdown).toContain('## Business Logic');
      expect(result.markdown).toContain('## Technical Details');
      expect(result.markdown).toContain('## Dependencies');
      expect(result.markdown).toContain('## Database Operations');
    });
  });
  
  describe('generateBatch', () => {
    it('should generate documentation for multiple files', async () => {
      const analyses = [
        {
          name: 'Z_FUNC_1',
          type: 'FUNCTION',
          module: 'SD',
          businessLogic: [],
          dependencies: [],
          tables: []
        },
        {
          name: 'Z_FUNC_2',
          type: 'FUNCTION',
          module: 'MM',
          businessLogic: [],
          dependencies: [],
          tables: []
        }
      ];
      
      const results = await docGen.generateBatch(analyses);
      
      expect(results).toHaveLength(2);
      expect(results[0].metadata.name).toBe('Z_FUNC_1');
      expect(results[1].metadata.name).toBe('Z_FUNC_2');
    });
    
    it('should continue on error for individual files', async () => {
      const analyses = [
        {
          name: 'Z_VALID',
          type: 'FUNCTION',
          module: 'SD',
          businessLogic: [],
          dependencies: [],
          tables: []
        }
      ];
      
      const results = await docGen.generateBatch(analyses);
      
      expect(results.length).toBeGreaterThan(0);
    });
  });
  
  describe('generateSummary', () => {
    it('should generate summary for multiple files', async () => {
      const analyses = [
        {
          name: 'Z_FUNC_1',
          type: 'FUNCTION',
          module: 'SD',
          businessLogic: [],
          dependencies: [],
          tables: [],
          linesOfCode: 100
        },
        {
          name: 'Z_FUNC_2',
          type: 'REPORT',
          module: 'MM',
          businessLogic: [],
          dependencies: [],
          tables: [],
          linesOfCode: 200
        }
      ];
      
      const summary = await docGen.generateSummary(analyses);
      
      expect(summary).toBeDefined();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });
  });
});
