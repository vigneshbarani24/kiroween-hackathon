/**
 * Fit-to-Standard Service
 * 
 * Generates recommendations for replacing custom ABAP code with SAP standard functionality.
 * Implements Requirement 6.7: AI Fit-to-Standard recommendations.
 */

import { createPatternMatcher, type ABAPAnalysis, type PatternMatch } from './pattern-matcher';
import { getStandardById, type SAPStandard } from './sap-standards-kb';

export interface FitToStandardRecommendation {
  id: string;
  abapObjectId: string;
  abapObjectName: string;
  standardAlternative: string;
  standardType: 'BAPI' | 'TRANSACTION' | 'PATTERN' | 'API' | 'TABLE';
  confidence: number;
  description: string;
  benefits: string[];
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  potentialSavings: {
    locReduction: number;
    maintenanceReduction: number;
    complexityReduction: number;
  };
  implementationGuide: string;
  codeExample?: string;
  status: 'RECOMMENDED' | 'ACCEPTED' | 'REJECTED' | 'IMPLEMENTED';
  createdAt: Date;
}

export interface RecommendationOptions {
  minConfidence?: number;
  maxRecommendations?: number;
  includeCodeExamples?: boolean;
}

/**
 * Fit-to-Standard Service
 */
export class FitToStandardService {
  private patternMatcher = createPatternMatcher();
  
  /**
   * Generate fit-to-standard recommendations for ABAP code
   */
  async generateRecommendations(
    abapObjectId: string,
    abapObjectName: string,
    analysis: ABAPAnalysis,
    options: RecommendationOptions = {}
  ): Promise<FitToStandardRecommendation[]> {
    const {
      minConfidence = 0.5,
      maxRecommendations = 5,
      includeCodeExamples = true
    } = options;
    
    // Find standard alternatives
    const matches = await this.patternMatcher.findStandardAlternatives(analysis);
    
    // Filter by confidence
    const qualifiedMatches = matches.filter(m => m.confidence >= minConfidence);
    
    // Take top N recommendations
    const topMatches = qualifiedMatches.slice(0, maxRecommendations);
    
    // Generate detailed recommendations
    const recommendations: FitToStandardRecommendation[] = [];
    
    for (const match of topMatches) {
      const recommendation = await this.createRecommendation(
        abapObjectId,
        abapObjectName,
        analysis,
        match,
        includeCodeExamples
      );
      recommendations.push(recommendation);
    }
    
    return recommendations;
  }
  
  /**
   * Create a detailed recommendation from a pattern match
   */
  private async createRecommendation(
    abapObjectId: string,
    abapObjectName: string,
    analysis: ABAPAnalysis,
    match: PatternMatch,
    includeCodeExamples: boolean
  ): Promise<FitToStandardRecommendation> {
    const standard = match.standard;
    
    // Calculate potential savings
    const savings = this.calculateSavings(analysis, standard);
    
    // Estimate implementation effort
    const effort = this.estimateEffort(match.confidence, analysis);
    
    // Generate benefits
    const benefits = this.generateBenefits(standard, savings);
    
    // Generate implementation guide
    const implementationGuide = this.generateImplementationGuide(standard, analysis);
    
    // Generate code example if requested
    const codeExample = includeCodeExamples 
      ? this.generateCodeExample(standard, analysis)
      : undefined;
    
    return {
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      abapObjectId,
      abapObjectName,
      standardAlternative: standard.name,
      standardType: standard.type,
      confidence: match.confidence,
      description: this.generateDescription(standard, match),
      benefits,
      effort,
      potentialSavings: savings,
      implementationGuide,
      codeExample,
      status: 'RECOMMENDED',
      createdAt: new Date()
    };
  }
  
  /**
   * Calculate potential savings from using standard
   */
  private calculateSavings(analysis: ABAPAnalysis, standard: SAPStandard): {
    locReduction: number;
    maintenanceReduction: number;
    complexityReduction: number;
  } {
    // Estimate LOC in custom code
    const customLOC = analysis.code.split('\n').length;
    
    // Standard BAPIs typically reduce code by 60-80%
    // Transactions reduce by 40-60%
    // Patterns reduce by 30-50%
    let locReductionPercent = 0;
    
    switch (standard.type) {
      case 'BAPI':
        locReductionPercent = 0.7; // 70% reduction
        break;
      case 'TRANSACTION':
        locReductionPercent = 0.5; // 50% reduction
        break;
      case 'PATTERN':
        locReductionPercent = 0.4; // 40% reduction
        break;
      default:
        locReductionPercent = 0.3; // 30% reduction
    }
    
    const locReduction = Math.round(customLOC * locReductionPercent);
    
    // Maintenance reduction (standard code requires less maintenance)
    const maintenanceReduction = Math.round(locReductionPercent * 100);
    
    // Complexity reduction
    const complexityReduction = Math.round(locReductionPercent * 80);
    
    return {
      locReduction,
      maintenanceReduction,
      complexityReduction
    };
  }
  
  /**
   * Estimate implementation effort
   */
  private estimateEffort(confidence: number, analysis: ABAPAnalysis): 'LOW' | 'MEDIUM' | 'HIGH' {
    const customLOC = analysis.code.split('\n').length;
    
    // High confidence + small code = LOW effort
    if (confidence > 0.8 && customLOC < 100) {
      return 'LOW';
    }
    
    // Medium confidence or medium code = MEDIUM effort
    if (confidence > 0.6 || customLOC < 300) {
      return 'MEDIUM';
    }
    
    // Low confidence or large code = HIGH effort
    return 'HIGH';
  }
  
  /**
   * Generate benefits list
   */
  private generateBenefits(standard: SAPStandard, savings: any): string[] {
    const benefits: string[] = [];
    
    // LOC reduction benefit
    if (savings.locReduction > 0) {
      benefits.push(`Reduce code by ${savings.locReduction} lines (${savings.maintenanceReduction}% less maintenance)`);
    }
    
    // Clean Core compliance
    if (standard.cleanCoreCompliant) {
      benefits.push('Clean Core compliant - easier SAP upgrades');
    }
    
    // Standard support
    benefits.push('SAP-supported standard functionality');
    benefits.push('Reduced testing effort (standard is pre-tested)');
    
    // Type-specific benefits
    switch (standard.type) {
      case 'BAPI':
        benefits.push('API-first architecture for integration');
        benefits.push('Consistent error handling');
        break;
      case 'TRANSACTION':
        benefits.push('User-friendly standard UI');
        benefits.push('Built-in validations and workflows');
        break;
      case 'PATTERN':
        benefits.push('Configurable without code changes');
        benefits.push('Industry best practices built-in');
        break;
    }
    
    // Complexity reduction
    if (savings.complexityReduction > 0) {
      benefits.push(`${savings.complexityReduction}% complexity reduction`);
    }
    
    return benefits;
  }
  
  /**
   * Generate description
   */
  private generateDescription(standard: SAPStandard, match: PatternMatch): string {
    return `Replace custom ${standard.module} logic with SAP standard ${standard.type} '${standard.name}'. ${match.reasoning}`;
  }
  
  /**
   * Generate implementation guide
   */
  private generateImplementationGuide(standard: SAPStandard, analysis: ABAPAnalysis): string {
    let guide = `# Implementation Guide: ${standard.name}\n\n`;
    
    guide += `## Overview\n`;
    guide += `${standard.description}\n\n`;
    
    guide += `## Current Custom Code\n`;
    guide += `- **Module:** ${analysis.module}\n`;
    guide += `- **Function:** ${analysis.functionName || 'N/A'}\n`;
    guide += `- **Tables Used:** ${analysis.tables.join(', ')}\n\n`;
    
    guide += `## Recommended Standard\n`;
    guide += `- **Type:** ${standard.type}\n`;
    guide += `- **Name:** ${standard.name}\n`;
    guide += `- **Clean Core:** ${standard.cleanCoreCompliant ? 'Yes ✅' : 'No'}\n\n`;
    
    // Type-specific implementation steps
    switch (standard.type) {
      case 'BAPI':
        guide += this.generateBAPIGuide(standard);
        break;
      case 'TRANSACTION':
        guide += this.generateTransactionGuide(standard);
        break;
      case 'PATTERN':
        guide += this.generatePatternGuide(standard);
        break;
    }
    
    guide += `\n## Testing\n`;
    guide += `1. Test with sample data in development\n`;
    guide += `2. Compare results with custom code output\n`;
    guide += `3. Validate error handling\n`;
    guide += `4. Performance testing\n`;
    guide += `5. User acceptance testing\n\n`;
    
    guide += `## Rollback Plan\n`;
    guide += `Keep custom code as backup until standard is fully validated.\n\n`;
    
    if (standard.sapDocUrl) {
      guide += `## Documentation\n`;
      guide += `[SAP Official Documentation](${standard.sapDocUrl})\n`;
    }
    
    return guide;
  }
  
  /**
   * Generate BAPI implementation guide
   */
  private generateBAPIGuide(standard: SAPStandard): string {
    let guide = `## Implementation Steps\n\n`;
    guide += `### 1. Identify BAPI Parameters\n`;
    
    if (standard.parameters) {
      guide += `Required parameters:\n`;
      for (const [param, desc] of Object.entries(standard.parameters)) {
        guide += `- **${param}**: ${desc}\n`;
      }
      guide += `\n`;
    }
    
    guide += `### 2. Map Custom Data to BAPI Structure\n`;
    guide += `Map your custom data structures to BAPI input parameters.\n\n`;
    
    guide += `### 3. Call BAPI\n`;
    guide += `\`\`\`abap\n`;
    guide += `CALL FUNCTION '${standard.name}'\n`;
    guide += `  EXPORTING\n`;
    guide += `    " Add your parameters here\n`;
    guide += `  IMPORTING\n`;
    guide += `    " Add return parameters\n`;
    guide += `  TABLES\n`;
    guide += `    return = lt_return.\n`;
    guide += `\n`;
    guide += `" Check for errors\n`;
    guide += `LOOP AT lt_return INTO ls_return WHERE type = 'E'.\n`;
    guide += `  " Handle error\n`;
    guide += `ENDLOOP.\n`;
    guide += `\`\`\`\n\n`;
    
    guide += `### 4. Commit Work\n`;
    guide += `\`\`\`abap\n`;
    guide += `CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'\n`;
    guide += `  EXPORTING\n`;
    guide += `    wait = 'X'.\n`;
    guide += `\`\`\`\n\n`;
    
    return guide;
  }
  
  /**
   * Generate transaction implementation guide
   */
  private generateTransactionGuide(standard: SAPStandard): string {
    let guide = `## Implementation Steps\n\n`;
    guide += `### 1. Use Standard Transaction\n`;
    guide += `Replace custom program with transaction code: **${standard.name}**\n\n`;
    
    guide += `### 2. Configure Transaction\n`;
    guide += `- Set up default values\n`;
    guide += `- Configure field properties\n`;
    guide += `- Set up authorization\n\n`;
    
    guide += `### 3. Train Users\n`;
    guide += `Provide training on standard transaction usage.\n\n`;
    
    guide += `### 4. Batch Input (if needed)\n`;
    guide += `For automated processing, use Batch Input or BAPI alternative.\n\n`;
    
    return guide;
  }
  
  /**
   * Generate pattern implementation guide
   */
  private generatePatternGuide(standard: SAPStandard): string {
    let guide = `## Implementation Steps\n\n`;
    
    if (standard.id === 'PRICING_PROCEDURE') {
      guide += `### 1. Configure Pricing Procedure\n`;
      guide += `- Transaction: V/08 (Pricing Procedures)\n`;
      guide += `- Define condition types\n`;
      guide += `- Set up calculation schema\n\n`;
      
      guide += `### 2. Maintain Condition Records\n`;
      guide += `- Transaction: VK11 (Create Condition)\n`;
      guide += `- Enter pricing data\n\n`;
      
      guide += `### 3. Assign to Sales Area\n`;
      guide += `- Link pricing procedure to sales organization\n\n`;
    } else if (standard.id === 'AUTHORIZATION_OBJECT') {
      guide += `### 1. Define Authorization Object\n`;
      guide += `- Transaction: SU21\n`;
      guide += `- Create authorization object\n\n`;
      
      guide += `### 2. Create Roles\n`;
      guide += `- Transaction: PFCG\n`;
      guide += `- Assign authorization object to roles\n\n`;
      
      guide += `### 3. Implement Checks\n`;
      guide += `Replace custom checks with AUTHORITY-CHECK statements.\n\n`;
    } else if (standard.id === 'NUMBER_RANGE') {
      guide += `### 1. Define Number Range Object\n`;
      guide += `- Transaction: SNRO\n`;
      guide += `- Create number range object\n\n`;
      
      guide += `### 2. Configure Intervals\n`;
      guide += `- Set up number ranges\n`;
      guide += `- Define external/internal numbering\n\n`;
      
      guide += `### 3. Use in Code\n`;
      guide += `Replace custom logic with NUMBER_GET_NEXT function.\n\n`;
    }
    
    return guide;
  }
  
  /**
   * Generate code example
   */
  private generateCodeExample(standard: SAPStandard, analysis: ABAPAnalysis): string {
    if (standard.type === 'BAPI') {
      return this.generateBAPIExample(standard);
    } else if (standard.type === 'PATTERN') {
      return this.generatePatternExample(standard);
    }
    
    return '';
  }
  
  /**
   * Generate BAPI code example
   */
  private generateBAPIExample(standard: SAPStandard): string {
    let example = `*&---------------------------------------------------------------------*\n`;
    example += `*& Example: Using ${standard.name}\n`;
    example += `*&---------------------------------------------------------------------*\n\n`;
    
    example += `DATA: lt_return TYPE TABLE OF bapiret2.\n\n`;
    
    example += `CALL FUNCTION '${standard.name}'\n`;
    example += `  EXPORTING\n`;
    example += `    " Add your parameters\n`;
    example += `  TABLES\n`;
    example += `    return = lt_return.\n\n`;
    
    example += `" Check for errors\n`;
    example += `READ TABLE lt_return WITH KEY type = 'E' TRANSPORTING NO FIELDS.\n`;
    example += `IF sy-subrc = 0.\n`;
    example += `  " Handle error\n`;
    example += `  MESSAGE 'Error occurred' TYPE 'E'.\n`;
    example += `ELSE.\n`;
    example += `  " Commit\n`;
    example += `  CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'\n`;
    example += `    EXPORTING\n`;
    example += `      wait = 'X'.\n`;
    example += `ENDIF.\n`;
    
    return example;
  }
  
  /**
   * Generate pattern code example
   */
  private generatePatternExample(standard: SAPStandard): string {
    if (standard.id === 'AUTHORIZATION_OBJECT') {
      return `AUTHORITY-CHECK OBJECT 'V_VBAK_VKO'
  ID 'VKORG' FIELD sales_org
  ID 'VTWEG' FIELD distribution_channel
  ID 'SPART' FIELD division
  ID 'ACTVT' FIELD '02'.  "Change authority

IF sy-subrc <> 0.
  MESSAGE 'No authorization' TYPE 'E'.
ENDIF.`;
    } else if (standard.id === 'NUMBER_RANGE') {
      return `CALL FUNCTION 'NUMBER_GET_NEXT'
  EXPORTING
    nr_range_nr = '01'
    object      = 'VBELN'
  IMPORTING
    number      = order_number
  EXCEPTIONS
    OTHERS      = 1.

IF sy-subrc <> 0.
  MESSAGE 'Number range error' TYPE 'E'.
ENDIF.`;
    }
    
    return '';
  }
}

/**
 * Create a new fit-to-standard service instance
 */
export function createFitToStandardService(): FitToStandardService {
  return new FitToStandardService();
}
