/**
 * Mock Data Generator
 * 
 * Generates realistic CSV data for db/data/ folder using MCP + AI
 */

import { CDSEntity, CDSField, MockDataConfig, MockDataRecord, CSVFiles } from './types';

export class MockDataGenerator {
  private llmService: any;
  private mcpClient: any;

  constructor(llmService?: any, mcpClient?: any) {
    this.llmService = llmService;
    this.mcpClient = mcpClient;
  }
  /**
   * Generate mock data for all entities
   */
  async generateForEntities(
    entities: CDSEntity[],
    config?: Partial<MockDataConfig>
  ): Promise<CSVFiles> {
    const defaultConfig: MockDataConfig = {
      entities: entities.map(e => e.name),
      recordsPerEntity: 25,
      preserveReferentialIntegrity: true,
      ...config
    };

    const csvFiles: CSVFiles = {};

    for (const entity of entities) {
      if (defaultConfig.entities.includes(entity.name)) {
        const records = await this.generateRecords(entity, defaultConfig.recordsPerEntity);
        const validRecords = this.ensureIntegrity(records, entities);
        csvFiles[`${entity.name}.csv`] = this.toCSV(entity, validRecords);
      }
    }

    return csvFiles;
  }

  /**
   * Generate records for a single entity using AI + MCP
   */
  private async generateRecords(
    entity: CDSEntity,
    count: number
  ): Promise<MockDataRecord[]> {
    // Try AI-powered generation first
    if (this.llmService && this.mcpClient) {
      try {
        return await this.generateRecordsWithAI(entity, count);
      } catch (error) {
        console.warn(`[MockDataGenerator] AI generation failed for ${entity.name}, using fallback:`, error);
      }
    }

    // Fallback to basic generation
    return this.generateRecordsBasic(entity, count);
  }

  /**
   * Generate records using AI based on entity schema and SAP context
   */
  private async generateRecordsWithAI(
    entity: CDSEntity,
    count: number
  ): Promise<MockDataRecord[]> {
    console.log(`[MockDataGenerator] Generating ${count} records for ${entity.name} using AI...`);

    // Use MCP to search for SAP table documentation
    let sapContext = '';
    try {
      const capDocs = await this.mcpClient.searchCAPDocs(`${entity.name} SAP table structure`);
      if (capDocs && capDocs.results && capDocs.results.length > 0) {
        sapContext = capDocs.results[0].content;
      }
    } catch (error) {
      console.warn(`[MockDataGenerator] MCP docs search failed:`, error);
    }

    // Build AI prompt
    const fieldDescriptions = entity.fields.map(f => 
      `- ${f.name}: ${f.type}${f.key ? ' (key)' : ''}`
    ).join('\n');

    const prompt = `Generate ${count} realistic mock data records for SAP entity ${entity.name}.

**Entity Schema:**
${fieldDescriptions}

**SAP Context:**
${sapContext || 'Standard SAP table'}

**Requirements:**
- Generate realistic SAP-style data
- Use proper SAP formats (10-digit IDs, dates, amounts)
- Maintain referential integrity
- Reflect real business scenarios
- Return as JSON array

Example format:
[
  { "field1": "value1", "field2": "value2" },
  { "field1": "value3", "field2": "value4" }
]

Generate ${count} records now:`;

    // Call AI
    const response = await this.callAI(prompt);
    
    // Parse JSON response
    try {
      const records = JSON.parse(response);
      console.log(`[MockDataGenerator] ✅ Generated ${records.length} records using AI`);
      return records;
    } catch (parseError) {
      console.error(`[MockDataGenerator] Failed to parse AI response:`, parseError);
      throw new Error('AI response parsing failed');
    }
  }

  /**
   * Basic record generation (fallback)
   */
  private generateRecordsBasic(
    entity: CDSEntity,
    count: number
  ): MockDataRecord[] {
    const records: MockDataRecord[] = [];

    for (let i = 0; i < count; i++) {
      const record: MockDataRecord = {};

      for (const field of entity.fields) {
        record[field.name] = this.generateFieldValue(field, i);
      }

      records.push(record);
    }

    return records;
  }

  /**
   * Call AI service
   */
  private async callAI(prompt: string): Promise<string> {
    if (!this.llmService) {
      throw new Error('LLM service not configured');
    }

    // This would call the actual LLM service
    // For now, throw to use fallback
    throw new Error('AI generation not yet implemented');
  }

  /**
   * Generate a value for a specific field
   */
  private generateFieldValue(field: CDSField, index: number): any {
    // Key fields get sequential IDs
    if (field.key) {
      return `${field.name.toUpperCase()}_${String(index + 1).padStart(6, '0')}`;
    }

    // Type-based generation
    const type = field.type.toLowerCase();

    if (type.includes('string') || type.includes('char')) {
      return this.generateString(field.name);
    }

    if (type.includes('integer') || type.includes('int')) {
      return Math.floor(Math.random() * 1000);
    }

    if (type.includes('decimal') || type.includes('number')) {
      return (Math.random() * 10000).toFixed(2);
    }

    if (type.includes('date')) {
      return this.generateDate();
    }

    if (type.includes('boolean') || type.includes('bool')) {
      return Math.random() > 0.5;
    }

    if (type.includes('timestamp')) {
      return new Date().toISOString();
    }

    return null;
  }

  /**
   * Generate realistic string values based on field name
   */
  private generateString(fieldName: string): string {
    const name = fieldName.toLowerCase();

    if (name.includes('name')) {
      const names = ['John Smith', 'Jane Doe', 'Bob Johnson', 'Alice Williams', 'Charlie Brown'];
      return names[Math.floor(Math.random() * names.length)];
    }

    if (name.includes('email')) {
      const domains = ['example.com', 'test.com', 'demo.com'];
      return `user${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    }

    if (name.includes('description')) {
      const descriptions = [
        'High quality product',
        'Premium service',
        'Standard item',
        'Special offer',
        'Limited edition'
      ];
      return descriptions[Math.floor(Math.random() * descriptions.length)];
    }

    if (name.includes('status')) {
      const statuses = ['ACTIVE', 'PENDING', 'COMPLETED', 'CANCELLED'];
      return statuses[Math.floor(Math.random() * statuses.length)];
    }

    return `${fieldName}_${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Generate a random date
   */
  private generateDate(): string {
    const start = new Date(2023, 0, 1);
    const end = new Date();
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
  }

  /**
   * Ensure referential integrity across entities
   */
  private ensureIntegrity(
    records: MockDataRecord[],
    entities: CDSEntity[]
  ): MockDataRecord[] {
    // TODO: Implement referential integrity checks
    // For now, return records as-is
    return records;
  }

  /**
   * Validate referential integrity
   */
  validateIntegrity(mockData: CSVFiles): boolean {
    // TODO: Implement validation logic
    return true;
  }

  /**
   * Convert records to CSV format
   */
  private toCSV(entity: CDSEntity, records: MockDataRecord[]): string {
    if (records.length === 0) {
      return '';
    }

    // Header row
    const headers = entity.fields.map(f => f.name).join(',');

    // Data rows
    const rows = records.map(record => {
      return entity.fields.map(field => {
        const value = record[field.name];
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',');
    });

    return [headers, ...rows].join('\n');
  }
}
