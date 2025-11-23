/**
 * Documentation Generator Service
 * Generates comprehensive markdown documentation from ABAP code analysis
 * 
 * Uses:
 * - ABAP Analyzer MCP for parsing
 * - OpenAI GPT-4 for documentation generation
 */

import OpenAI from 'openai';

interface ABAPAnalysis {
  name: string;
  type: string;
  module: string;
  businessLogic: any[];
  dependencies: any[];
  tables: any[];
  linesOfCode?: number;
  complexity?: number;
}

interface Documentation {
  markdown: string;
  metadata: ABAPAnalysis;
  generatedAt: Date;
}

export class DocumentationGenerator {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  /**
   * Generate comprehensive documentation from ABAP analysis
   */
  async generateDocumentation(analysis: ABAPAnalysis): Promise<Documentation> {
    const prompt = this.buildPrompt(analysis);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an SAP expert technical writer. Generate clear, comprehensive documentation for SAP ABAP code.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });
      
      const markdown = response.choices[0].message.content || '';
      
      return {
        markdown,
        metadata: analysis,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating documentation:', error);
      throw new Error(`Failed to generate documentation: ${error.message}`);
    }
  }
  
  /**
   * Build the prompt for documentation generation
   */
  private buildPrompt(analysis: ABAPAnalysis): string {
    return `
Generate comprehensive technical documentation for this SAP ABAP code.

## ABAP Object Information
- **Name:** ${analysis.name}
- **Type:** ${analysis.type}
- **Module:** ${analysis.module}
- **Lines of Code:** ${analysis.linesOfCode || 'Unknown'}
- **Complexity:** ${analysis.complexity || 'Unknown'}

## Business Logic
${JSON.stringify(analysis.businessLogic, null, 2)}

## Dependencies
${JSON.stringify(analysis.dependencies, null, 2)}

## Database Tables
${JSON.stringify(analysis.tables, null, 2)}

---

Generate markdown documentation with these sections:

# ${analysis.name}

## Overview
Brief description of what this code does and its purpose in the SAP system.

## Business Logic
Detailed explanation of the business logic implemented. Explain:
- What business process this supports
- Key calculations or validations
- Business rules enforced
- Any pricing, discount, or authorization logic

## Technical Details
- Type: ${analysis.type}
- Module: ${analysis.module}
- Complexity: ${analysis.complexity || 'Medium'}

## Dependencies
List and explain dependencies:
- What other ABAP objects this calls
- What tables it accesses
- External systems or BAPIs used

## Database Operations
Detail all database operations:
- Tables accessed (SELECT, INSERT, UPDATE, DELETE)
- Key fields used
- Performance considerations

## Usage
How this code is typically used:
- When is it called?
- What are the inputs?
- What are the outputs?
- Example usage scenarios

## Modernization Notes
Recommendations for modernizing this code:
- Can it use SAP standard functionality?
- Suggested modern SAP CAP equivalent
- Migration complexity estimate
- Business logic that must be preserved

## Related Objects
- Similar functions or programs
- Dependent objects
- Replacement candidates

---

Be specific and technical. Use SAP terminology. Focus on business value and modernization path.
`;
  }
  
  /**
   * Generate documentation for multiple ABAP objects
   */
  async generateBatch(analyses: ABAPAnalysis[]): Promise<Documentation[]> {
    const results: Documentation[] = [];
    
    for (const analysis of analyses) {
      try {
        const doc = await this.generateDocumentation(analysis);
        results.push(doc);
        
        // Rate limiting: wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to generate docs for ${analysis.name}:`, error);
        // Continue with next item
      }
    }
    
    return results;
  }
  
  /**
   * Generate a summary documentation for a collection of ABAP objects
   */
  async generateSummary(analyses: ABAPAnalysis[]): Promise<string> {
    const prompt = `
Generate a summary documentation for this SAP custom code inventory:

Total Objects: ${analyses.length}

Objects by Type:
${this.groupByType(analyses)}

Objects by Module:
${this.groupByModule(analyses)}

Total Lines of Code: ${this.sumLinesOfCode(analyses)}

---

Generate a markdown summary with:
1. Executive Summary
2. Code Inventory Overview
3. Module Breakdown
4. Complexity Analysis
5. Modernization Priorities
6. Recommendations

Be concise but informative.
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500
    });
    
    return response.choices[0].message.content || '';
  }
  
  private groupByType(analyses: ABAPAnalysis[]): string {
    const groups = analyses.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(groups)
      .map(([type, count]) => `- ${type}: ${count}`)
      .join('\n');
  }
  
  private groupByModule(analyses: ABAPAnalysis[]): string {
    const groups = analyses.reduce((acc, a) => {
      acc[a.module] = (acc[a.module] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(groups)
      .map(([module, count]) => `- ${module}: ${count}`)
      .join('\n');
  }
  
  private sumLinesOfCode(analyses: ABAPAnalysis[]): number {
    return analyses.reduce((sum, a) => sum + (a.linesOfCode || 0), 0);
  }
}
