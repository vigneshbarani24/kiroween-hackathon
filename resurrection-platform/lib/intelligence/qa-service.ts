/**
 * Q&A Service (RAG - Retrieval Augmented Generation)
 * Answers questions about SAP custom code using semantic search + AI
 * 
 * Uses:
 * - VectorSearchService for finding relevant code
 * - OpenAI GPT-4 for generating answers
 */

import OpenAI from 'openai';
import { VectorSearchService } from './vector-search';

interface QAResponse {
  question: string;
  answer: string;
  sources: Array<{
    name: string;
    type: string;
    module: string;
    relevance: number;
  }>;
  confidence: 'high' | 'medium' | 'low';
}

export class QAService {
  private vectorSearch: VectorSearchService;
  private openai: OpenAI;
  
  constructor(vectorSearch: VectorSearchService) {
    this.vectorSearch = vectorSearch;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
  }
  
  /**
   * Answer a question about the SAP custom code
   */
  async answerQuestion(question: string): Promise<QAResponse> {
    try {
      // 1. Search for relevant code
      console.log(`🔍 Searching for: "${question}"`);
      const relevantCode = await this.vectorSearch.search(question, 5);
      
      if (relevantCode.length === 0) {
        return {
          question,
          answer: "I couldn't find any relevant code in the indexed ABAP files to answer this question. Please make sure the code has been uploaded and indexed.",
          sources: [],
          confidence: 'low'
        };
      }
      
      // 2. Build context from search results
      const context = relevantCode
        .map((match, i) => `
[Source ${i + 1}: ${match.metadata.name} (${match.metadata.type}, Module: ${match.metadata.module})]
Relevance: ${(match.score * 100).toFixed(1)}%

${match.metadata.documentation}
`)
        .join('\n\n---\n\n');
      
      // 3. Generate answer using RAG
      const prompt = this.buildPrompt(question, context);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an SAP expert assistant. Answer questions about SAP custom code based on the provided documentation. Be specific, technical, and cite sources.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });
      
      const answer = response.choices[0].message.content || 'Unable to generate answer.';
      
      // 4. Determine confidence based on relevance scores
      const avgRelevance = relevantCode.reduce((sum, m) => sum + m.score, 0) / relevantCode.length;
      const confidence = this.determineConfidence(avgRelevance);
      
      return {
        question,
        answer,
        sources: relevantCode.map(m => ({
          name: m.metadata.name,
          type: m.metadata.type,
          module: m.metadata.module,
          relevance: m.score
        })),
        confidence
      };
    } catch (error) {
      console.error('Error answering question:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to answer question: ${errorMessage}`);
    }
  }
  
  /**
   * Build the RAG prompt
   */
  private buildPrompt(question: string, context: string): string {
    return `
You are answering questions about SAP custom ABAP code based on documentation.

## Context from SAP Custom Code Documentation:

${context}

## Question:
${question}

## Instructions:
1. Answer the question based ONLY on the provided documentation
2. Be specific and technical - use SAP terminology
3. Cite specific code objects when relevant (e.g., "According to Z_CALCULATE_PRICE...")
4. If the documentation doesn't contain enough information, say so
5. If multiple sources are relevant, synthesize the information
6. Include relevant technical details (tables, modules, business logic)

## Answer:
`;
  }
  
  /**
   * Determine confidence level based on relevance scores
   */
  private determineConfidence(avgRelevance: number): 'high' | 'medium' | 'low' {
    if (avgRelevance >= 0.8) return 'high';
    if (avgRelevance >= 0.6) return 'medium';
    return 'low';
  }
  
  /**
   * Answer multiple questions in batch
   */
  async answerBatch(questions: string[]): Promise<QAResponse[]> {
    const results: QAResponse[] = [];
    
    for (const question of questions) {
      try {
        const answer = await this.answerQuestion(question);
        results.push(answer);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to answer: ${question}`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          question,
          answer: `Error: ${errorMessage}`,
          sources: [],
          confidence: 'low'
        });
      }
    }
    
    return results;
  }
  
  /**
   * Get suggested questions based on indexed code
   */
  async getSuggestedQuestions(): Promise<string[]> {
    // Get some sample code to generate questions
    const sampleQueries = [
      'pricing',
      'order',
      'customer',
      'validation',
      'calculation'
    ];
    
    const suggestions: string[] = [
      'What does the pricing calculation function do?',
      'Which functions access the VBAK table?',
      'How is customer credit limit validated?',
      'What business logic is implemented for discounts?',
      'Which modules have the most custom code?'
    ];
    
    return suggestions;
  }
}
