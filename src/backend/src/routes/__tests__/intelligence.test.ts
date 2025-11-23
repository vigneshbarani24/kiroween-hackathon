/**
 * Integration Tests for Intelligence API
 * Test-Driven Development approach
 */

import request from 'supertest';
import express from 'express';
import { intelligenceRouter } from '../intelligence';

const app = express();
app.use(express.json());
app.use('/api/intelligence', intelligenceRouter);

describe('Intelligence API', () => {
  describe('POST /api/intelligence/generate-docs', () => {
    it('should generate documentation', async () => {
      const response = await request(app)
        .post('/api/intelligence/generate-docs')
        .send({
          abapCode: 'FUNCTION z_test. ENDFUNCTION.',
          analysis: {
            name: 'Z_TEST',
            type: 'FUNCTION',
            module: 'SD',
            businessLogic: [],
            dependencies: [],
            tables: []
          }
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('documentation');
      expect(response.body).toHaveProperty('id');
    });
    
    it('should return 400 if analysis is missing', async () => {
      const response = await request(app)
        .post('/api/intelligence/generate-docs')
        .send({
          abapCode: 'FUNCTION z_test. ENDFUNCTION.'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /api/intelligence/qa', () => {
    it('should answer questions', async () => {
      const response = await request(app)
        .post('/api/intelligence/qa')
        .send({
          question: 'What does this function do?'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('question');
      expect(response.body).toHaveProperty('answer');
      expect(response.body).toHaveProperty('sources');
      expect(response.body).toHaveProperty('confidence');
    });
    
    it('should return 400 if question is missing', async () => {
      const response = await request(app)
        .post('/api/intelligence/qa')
        .send({});
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('POST /api/intelligence/search', () => {
    it('should search code semantically', async () => {
      const response = await request(app)
        .post('/api/intelligence/search')
        .send({
          query: 'pricing logic',
          topK: 5
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('query');
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });
  });
  
  describe('POST /api/intelligence/dependency-graph', () => {
    it('should build dependency graph', async () => {
      const response = await request(app)
        .post('/api/intelligence/dependency-graph')
        .send({
          objects: [
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
          ]
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('graph');
      expect(response.body).toHaveProperty('complexity');
      expect(response.body).toHaveProperty('criticalNodes');
    });
  });
  
  describe('POST /api/intelligence/redundancies', () => {
    it('should detect redundancies', async () => {
      const response = await request(app)
        .post('/api/intelligence/redundancies')
        .send({
          files: [
            {
              id: '1',
              name: 'Z_FUNC_A',
              content: 'FUNCTION z_test. ENDFUNCTION.',
              type: 'FUNCTION',
              module: 'SD',
              linesOfCode: 10
            },
            {
              id: '2',
              name: 'Z_FUNC_B',
              content: 'FUNCTION z_test. ENDFUNCTION.',
              type: 'FUNCTION',
              module: 'SD',
              linesOfCode: 10
            }
          ]
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('redundancies');
      expect(response.body).toHaveProperty('statistics');
      expect(response.body).toHaveProperty('consolidationPlan');
    });
  });
  
  describe('GET /api/intelligence/stats', () => {
    it('should return index statistics', async () => {
      const response = await request(app)
        .get('/api/intelligence/stats');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalVectorCount');
    });
  });
});
