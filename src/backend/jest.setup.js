// Jest setup file
// Mock environment variables for testing
process.env.OPENAI_API_KEY = 'test-key';
process.env.PINECONE_API_KEY = 'test-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Increase timeout for API calls in tests
jest.setTimeout(30000);

// Mock OpenAI API calls
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: '# Test Documentation\n\n## Overview\nThis is test documentation.'
              }
            }]
          })
        }
      },
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{
            embedding: Array(1536).fill(0).map(() => Math.random())
          }]
        })
      }
    }))
  };
});

// Mock Pinecone
jest.mock('@pinecone-database/pinecone', () => {
  return {
    Pinecone: jest.fn().mockImplementation(() => ({
      listIndexes: jest.fn().mockResolvedValue({ indexes: [] }),
      createIndex: jest.fn().mockResolvedValue({}),
      index: jest.fn().mockReturnValue({
        upsert: jest.fn().mockResolvedValue({}),
        query: jest.fn().mockResolvedValue({
          matches: [
            {
              id: 'test-1',
              score: 0.95,
              metadata: {
                name: 'Z_TEST',
                type: 'FUNCTION',
                module: 'SD',
                documentation: 'Test documentation'
              }
            }
          ]
        }),
        deleteOne: jest.fn().mockResolvedValue({}),
        describeIndexStats: jest.fn().mockResolvedValue({
          namespaces: { '': { vectorCount: 10 } },
          dimension: 1536,
          indexFullness: 0.0001,
          totalVectorCount: 10
        })
      }))
    }))
  };
});
