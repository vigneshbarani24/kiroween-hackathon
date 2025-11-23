/**
 * Redundancy Detector Service
 * Finds duplicate and similar code using embeddings
 * 
 * Features:
 * - Code similarity detection
 * - Duplicate finder
 * - Consolidation recommendations
 * - Clustering similar code
 */

import OpenAI from 'openai';

interface ABAPFile {
  id: string;
  name: string;
  content: string;
  type: string;
  module: string;
  linesOfCode: number;
}

interface Redundancy {
  file1: ABAPFile;
  file2: ABAPFile;
  similarity: number;
  recommendation: string;
  potentialSavings: {
    linesOfCode: number;
    effort: string;
  };
}

interface RedundancyCluster {
  files: ABAPFile[];
  averageSimilarity: number;
  recommendation: string;
}

export class RedundancyDetector {
  private openai: OpenAI;
  private similarityThreshold = 0.85;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
  }
  
  /**
   * Find all duplicate and similar code
   */
  async findRedundancies(files: ABAPFile[]): Promise<Redundancy[]> {
    console.log(`🔍 Analyzing ${files.length} files for redundancies...`);
    
    const redundancies: Redundancy[] = [];
    
    // Generate embeddings for all files
    const embeddings = await this.generateEmbeddings(files);
    
    // Compare all pairs
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const similarity = this.cosineSimilarity(
          embeddings[i].embedding,
          embeddings[j].embedding
        );
        
        if (similarity >= this.similarityThreshold) {
          const recommendation = await this.generateRecommendation(
            files[i],
            files[j],
            similarity
          );
          
          redundancies.push({
            file1: files[i],
            file2: files[j],
            similarity,
            recommendation,
            potentialSavings: this.calculateSavings(files[i], files[j])
          });
        }
      }
    }
    
    // Sort by similarity (highest first)
    redundancies.sort((a, b) => b.similarity - a.similarity);
    
    console.log(`✅ Found ${redundancies.length} redundancies`);
    return redundancies;
  }
  
  /**
   * Generate embeddings for all files
   */
  private async generateEmbeddings(
    files: ABAPFile[]
  ): Promise<Array<{ file: ABAPFile; embedding: number[] }>> {
    const results: Array<{ file: ABAPFile; embedding: number[] }> = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async file => ({
          file,
          embedding: await this.getEmbedding(file.content)
        }))
      );
      
      results.push(...batchResults);
      
      // Rate limiting
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
  
  /**
   * Get embedding for text
   */
  private async getEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000) // Limit to 8K chars
    });
    
    return response.data[0].embedding;
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }
  
  /**
   * Generate consolidation recommendation
   */
  private async generateRecommendation(
    file1: ABAPFile,
    file2: ABAPFile,
    similarity: number
  ): Promise<string> {
    const prompt = `
These two ABAP files are ${(similarity * 100).toFixed(1)}% similar:

File 1: ${file1.name} (${file1.type}, ${file1.linesOfCode} LOC)
${file1.content.substring(0, 500)}

File 2: ${file2.name} (${file2.type}, ${file2.linesOfCode} LOC)
${file2.content.substring(0, 500)}

Provide a brief, actionable recommendation on how to consolidate them.
Focus on:
1. What functionality is duplicated
2. How to merge them
3. Estimated effort

Keep it under 100 words.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 150
      });
      
      return response.choices[0].message.content || 'Unable to generate recommendation.';
    } catch (error) {
      console.error('Error generating recommendation:', error);
      return `These files are ${(similarity * 100).toFixed(1)}% similar. Consider consolidating to reduce duplication.`;
    }
  }
  
  /**
   * Calculate potential savings from consolidation
   */
  private calculateSavings(file1: ABAPFile, file2: ABAPFile): {
    linesOfCode: number;
    effort: string;
  } {
    // Estimate: can save ~60% of smaller file's LOC
    const smallerLOC = Math.min(file1.linesOfCode, file2.linesOfCode);
    const savings = Math.floor(smallerLOC * 0.6);
    
    // Estimate effort based on total LOC
    const totalLOC = file1.linesOfCode + file2.linesOfCode;
    let effort = 'Low';
    if (totalLOC > 500) effort = 'High';
    else if (totalLOC > 200) effort = 'Medium';
    
    return {
      linesOfCode: savings,
      effort
    };
  }
  
  /**
   * Find clusters of similar files
   */
  async findClusters(files: ABAPFile[]): Promise<RedundancyCluster[]> {
    const redundancies = await this.findRedundancies(files);
    
    // Build clusters using simple grouping
    const clusters: RedundancyCluster[] = [];
    const processed = new Set<string>();
    
    redundancies.forEach(red => {
      if (!processed.has(red.file1.id) && !processed.has(red.file2.id)) {
        // Start new cluster
        const clusterFiles = [red.file1, red.file2];
        processed.add(red.file1.id);
        processed.add(red.file2.id);
        
        // Find other files similar to these
        redundancies.forEach(other => {
          if (
            (other.file1.id === red.file1.id || other.file1.id === red.file2.id) &&
            !processed.has(other.file2.id)
          ) {
            clusterFiles.push(other.file2);
            processed.add(other.file2.id);
          }
        });
        
        if (clusterFiles.length >= 2) {
          clusters.push({
            files: clusterFiles,
            averageSimilarity: 0.9, // Simplified
            recommendation: `Consider consolidating these ${clusterFiles.length} similar files into a single reusable component.`
          });
        }
      }
    });
    
    return clusters;
  }
  
  /**
   * Get redundancy statistics
   */
  getStatistics(redundancies: Redundancy[]): {
    totalRedundancies: number;
    highSimilarity: number;
    mediumSimilarity: number;
    totalPotentialSavings: number;
    byModule: Record<string, number>;
    byType: Record<string, number>;
  } {
    const high = redundancies.filter(r => r.similarity >= 0.95).length;
    const medium = redundancies.filter(r => r.similarity >= 0.85 && r.similarity < 0.95).length;
    
    const totalSavings = redundancies.reduce(
      (sum, r) => sum + r.potentialSavings.linesOfCode,
      0
    );
    
    const byModule: Record<string, number> = {};
    const byType: Record<string, number> = {};
    
    redundancies.forEach(r => {
      byModule[r.file1.module] = (byModule[r.file1.module] || 0) + 1;
      byType[r.file1.type] = (byType[r.file1.type] || 0) + 1;
    });
    
    return {
      totalRedundancies: redundancies.length,
      highSimilarity: high,
      mediumSimilarity: medium,
      totalPotentialSavings: totalSavings,
      byModule,
      byType
    };
  }
  
  /**
   * Generate consolidation plan
   */
  async generateConsolidationPlan(
    redundancies: Redundancy[]
  ): Promise<{
    priority: 'high' | 'medium' | 'low';
    items: Array<{
      files: string[];
      similarity: number;
      effort: string;
      savings: number;
      action: string;
    }>;
    totalSavings: number;
    estimatedEffort: string;
  }> {
    // Sort by potential savings
    const sorted = [...redundancies].sort(
      (a, b) => b.potentialSavings.linesOfCode - a.potentialSavings.linesOfCode
    );
    
    const items = sorted.slice(0, 10).map(r => ({
      files: [r.file1.name, r.file2.name],
      similarity: r.similarity,
      effort: r.potentialSavings.effort,
      savings: r.potentialSavings.linesOfCode,
      action: r.recommendation
    }));
    
    const totalSavings = redundancies.reduce(
      (sum, r) => sum + r.potentialSavings.linesOfCode,
      0
    );
    
    let priority: 'high' | 'medium' | 'low' = 'low';
    if (totalSavings > 1000) priority = 'high';
    else if (totalSavings > 500) priority = 'medium';
    
    const estimatedEffort = `${Math.ceil(redundancies.length * 2)} hours`;
    
    return {
      priority,
      items,
      totalSavings,
      estimatedEffort
    };
  }
}
