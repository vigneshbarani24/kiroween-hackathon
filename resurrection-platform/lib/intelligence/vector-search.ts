/**
 * Vector Search Service
 * Enables semantic search across ABAP code using Pinecone vector database
 * 
 * Uses:
 * - OpenAI text-embedding-3-small for embeddings
 * - Pinecone for vector storage and search
 */

import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

interface IndexMetadata {
  name: string;
  type: string;
  module: string;
  documentation: string;
  filename?: string;
}

interface SearchResult {
  id: string;
  score: number;
  metadata: IndexMetadata;
}

export class VectorSearchService {
  private pinecone: Pinecone;
  private openai: OpenAI;
  private indexName = 'abap-code';
  
  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!
    });
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
  }
  
  /**
   * Initialize Pinecone index (call once on startup)
   */
  async initialize(): Promise<void> {
    try {
      // Check if index exists
      const indexes = await this.pinecone.listIndexes();
      const indexExists = indexes.indexes?.some(i => i.name === this.indexName);
      
      if (!indexExists) {
        console.log(`Creating Pinecone index: ${this.indexName}`);
        
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536, // text-embedding-3-small dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        
        console.log('✅ Pinecone index created');
        
        // Wait for index to be ready
        await new Promise(resolve => setTimeout(resolve, 10000));
      } else {
        console.log('✅ Pinecone index already exists');
      }
    } catch (error) {
      console.error('Error initializing Pinecone:', error);
      throw error;
    }
  }
  
  /**
   * Index ABAP code and documentation for search
   */
  async indexCode(
    id: string,
    abapCode: string,
    documentation: string,
    metadata: {
      name: string;
      type: string;
      module: string;
      filename?: string;
    }
  ): Promise<void> {
    try {
      // Generate embedding for code + documentation
      const textToEmbed = `${abapCode}\n\n${documentation}`;
      
      const embedding = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: textToEmbed.substring(0, 8000) // Limit to 8K chars
      });
      
      // Store in Pinecone
      const index = this.pinecone.index(this.indexName);
      
      await index.upsert([{
        id,
        values: embedding.data[0].embedding,
        metadata: {
          name: metadata.name,
          type: metadata.type,
          module: metadata.module,
          filename: metadata.filename || metadata.name,
          documentation: documentation.substring(0, 1000) // First 1000 chars
        }
      }]);
      
      console.log(`✅ Indexed: ${metadata.name}`);
    } catch (error) {
      console.error(`Error indexing ${metadata.name}:`, error);
      throw error;
    }
  }
  
  /**
   * Search for relevant code using natural language query
   */
  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    try {
      // Generate query embedding
      const queryEmbedding = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query
      });
      
      // Search Pinecone
      const index = this.pinecone.index(this.indexName);
      
      const results = await index.query({
        vector: queryEmbedding.data[0].embedding,
        topK,
        includeMetadata: true
      });
      
      return results.matches.map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata as unknown as IndexMetadata
      }));
    } catch (error) {
      console.error('Error searching:', error);
      throw error;
    }
  }
  
  /**
   * Search with filters (e.g., by module or type)
   */
  async searchWithFilter(
    query: string,
    filter: { module?: string; type?: string },
    topK: number = 5
  ): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query
      });
      
      const index = this.pinecone.index(this.indexName);
      
      // Build Pinecone filter
      const pineconeFilter: any = {};
      if (filter.module) {
        pineconeFilter.module = { $eq: filter.module };
      }
      if (filter.type) {
        pineconeFilter.type = { $eq: filter.type };
      }
      
      const results = await index.query({
        vector: queryEmbedding.data[0].embedding,
        topK,
        filter: Object.keys(pineconeFilter).length > 0 ? pineconeFilter : undefined,
        includeMetadata: true
      });
      
      return results.matches.map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata as unknown as IndexMetadata
      }));
    } catch (error) {
      console.error('Error searching with filter:', error);
      throw error;
    }
  }
  
  /**
   * Delete indexed code
   */
  async deleteCode(id: string): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      await index.deleteOne(id);
      console.log(`✅ Deleted: ${id}`);
    } catch (error) {
      console.error(`Error deleting ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get index statistics
   */
  async getStats(): Promise<any> {
    try {
      const index = this.pinecone.index(this.indexName);
      const stats = await index.describeIndexStats();
      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }
}
