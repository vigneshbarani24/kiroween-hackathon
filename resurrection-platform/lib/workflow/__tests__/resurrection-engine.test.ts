/**
 * ResurrectionEngine Tests
 * 
 * Basic tests for the ResurrectionEngine class
 */

import { ResurrectionEngine } from '../resurrection-engine';

// Mock the UnifiedMCPClient to avoid actual MCP connections
jest.mock('../../mcp/unified-mcp-client', () => {
  return {
    UnifiedMCPClient: jest.fn().mockImplementation(() => {
      return {
        initializeConnections: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        healthCheck: jest.fn().mockResolvedValue({
          abapAnalyzer: { connected: true, status: 'CONNECTED' },
          sapCAP: { connected: true, status: 'CONNECTED' },
          sapUI5: { connected: true, status: 'CONNECTED' },
          github: { connected: true, status: 'CONNECTED' },
          slack: { connected: true, status: 'CONNECTED' },
          allHealthy: true,
          timestamp: new Date()
        }),
        getStats: jest.fn().mockReturnValue({
          initialized: false,
          totalServers: 5,
          healthyServers: 0,
          servers: []
        })
      };
    })
  };
});

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        resurrection: {
          create: jest.fn(),
          findUnique: jest.fn(),
          update: jest.fn()
        },
        transformationLog: {
          create: jest.fn()
        },
        qualityReport: {
          create: jest.fn()
        },
        gitHubActivity: {
          create: jest.fn()
        }
      };
    })
  };
});

describe('ResurrectionEngine', () => {
  let engine: ResurrectionEngine;

  beforeEach(() => {
    engine = new ResurrectionEngine();
  });

  afterEach(async () => {
    if (engine) {
      await engine.shutdown();
    }
  });

  describe('Initialization', () => {
    it('should create an instance', () => {
      expect(engine).toBeInstanceOf(ResurrectionEngine);
    });

    it('should not be initialized on creation', () => {
      expect(engine.isInitialized).toBe(false);
    });

    it('should have event emitter capabilities', () => {
      expect(typeof engine.on).toBe('function');
      expect(typeof engine.emit).toBe('function');
      expect(typeof engine.removeAllListeners).toBe('function');
    });
  });

  describe('Event Emitters', () => {
    it('should emit stepStart event', (done) => {
      engine.on('stepStart', (event) => {
        expect(event).toHaveProperty('resurrectionId');
        expect(event).toHaveProperty('step');
        expect(event).toHaveProperty('message');
        expect(event).toHaveProperty('timestamp');
        done();
      });

      // Trigger a step start event (this would normally happen during execution)
      engine.emit('stepStart', {
        resurrectionId: 'test-id',
        step: 'ANALYZE',
        message: 'Starting analysis',
        timestamp: new Date()
      });
    });

    it('should emit progress event', (done) => {
      engine.on('progress', (event) => {
        expect(event).toHaveProperty('resurrectionId');
        expect(event).toHaveProperty('step');
        expect(event).toHaveProperty('status');
        expect(event).toHaveProperty('message');
        expect(event).toHaveProperty('timestamp');
        done();
      });

      // Trigger a progress event
      engine.emit('progress', {
        resurrectionId: 'test-id',
        step: 'ANALYZE',
        status: 'IN_PROGRESS',
        message: 'Analyzing ABAP code',
        progress: 50,
        timestamp: new Date()
      });
    });
  });

  describe('Utility Methods', () => {
    it('should return stats', () => {
      const stats = engine.getStats();
      expect(stats).toHaveProperty('initialized');
      expect(stats.initialized).toBe(false);
    });

    it('should shutdown gracefully', async () => {
      await expect(engine.shutdown()).resolves.not.toThrow();
    });
  });
});
