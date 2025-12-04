/**
 * Environment Variable Validator
 * 
 * Validates required environment variables are set and provides
 * helpful error messages for missing configuration.
 */

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  invalid: string[];
  warnings: string[];
}

export interface EnvRequirement {
  name: string;
  required: boolean;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

/**
 * Environment Variable Validator
 */
export class EnvValidator {
  private requirements: EnvRequirement[] = [];

  /**
   * Add a required environment variable
   */
  require(name: string, validator?: (value: string) => boolean, errorMessage?: string): this {
    this.requirements.push({
      name,
      required: true,
      validator,
      errorMessage
    });
    return this;
  }

  /**
   * Add an optional environment variable (will warn if missing)
   */
  optional(name: string, validator?: (value: string) => boolean, errorMessage?: string): this {
    this.requirements.push({
      name,
      required: false,
      validator,
      errorMessage
    });
    return this;
  }

  /**
   * Validate all requirements
   */
  validate(): EnvValidationResult {
    const missing: string[] = [];
    const invalid: string[] = [];
    const warnings: string[] = [];

    for (const req of this.requirements) {
      const value = process.env[req.name];

      // Check if missing
      if (!value || value.trim() === '') {
        if (req.required) {
          missing.push(req.name);
        } else {
          warnings.push(`Optional variable ${req.name} is not set`);
        }
        continue;
      }

      // Validate format if validator provided
      if (req.validator && !req.validator(value)) {
        invalid.push(req.name);
        if (req.errorMessage) {
          warnings.push(`${req.name}: ${req.errorMessage}`);
        }
      }
    }

    return {
      valid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid,
      warnings
    };
  }

  /**
   * Validate and throw error if invalid
   */
  validateOrThrow(): void {
    const result = this.validate();

    if (!result.valid) {
      const errors: string[] = [];

      if (result.missing.length > 0) {
        errors.push(`Missing required environment variables: ${result.missing.join(', ')}`);
        errors.push('');
        errors.push('Please set these in your .env.local file:');
        for (const name of result.missing) {
          errors.push(`  ${name}=<your-value-here>`);
        }
      }

      if (result.invalid.length > 0) {
        errors.push('');
        errors.push(`Invalid environment variables: ${result.invalid.join(', ')}`);
      }

      if (result.warnings.length > 0) {
        errors.push('');
        errors.push('Warnings:');
        for (const warning of result.warnings) {
          errors.push(`  - ${warning}`);
        }
      }

      throw new Error(errors.join('\n'));
    }

    // Log warnings even if valid
    if (result.warnings.length > 0) {
      console.warn('[EnvValidator] Warnings:');
      for (const warning of result.warnings) {
        console.warn(`  - ${warning}`);
      }
    }
  }
}

/**
 * Validate resurrection platform environment variables
 */
export function validateResurrectionEnv(): void {
  const validator = new EnvValidator();

  // Required variables
  validator.require(
    'OPENAI_API_KEY',
    (value) => value.startsWith('sk-'),
    'Must start with "sk-". Get your API key from https://platform.openai.com/api-keys'
  );

  validator.require(
    'GITHUB_TOKEN',
    (value) => value.startsWith('ghp_') || value.startsWith('github_pat_'),
    'Must be a valid GitHub Personal Access Token. Create one at https://github.com/settings/tokens'
  );

  // Optional variables
  validator.optional(
    'SLACK_BOT_TOKEN',
    (value) => value.startsWith('xoxb-'),
    'Must start with "xoxb-". Get your token from https://api.slack.com/apps'
  );

  validator.optional('OPENAI_MODEL');
  validator.optional('OPENAI_TEMPERATURE');
  validator.optional('OPENAI_MAX_TOKENS');

  // Validate
  validator.validateOrThrow();

  console.log('[EnvValidator] ✅ All required environment variables are set');
}

/**
 * Get helpful setup instructions for missing variables
 */
export function getSetupInstructions(missing: string[]): string {
  const instructions: string[] = [
    '📝 Setup Instructions:',
    '',
    '1. Create or edit resurrection-platform/.env.local',
    '2. Add the following variables:',
    ''
  ];

  for (const name of missing) {
    switch (name) {
      case 'OPENAI_API_KEY':
        instructions.push(`   ${name}=sk-...`);
        instructions.push('   Get your API key from: https://platform.openai.com/api-keys');
        instructions.push('');
        break;

      case 'GITHUB_TOKEN':
        instructions.push(`   ${name}=ghp_...`);
        instructions.push('   Create a Personal Access Token at: https://github.com/settings/tokens');
        instructions.push('   Required scopes: repo (full control of private repositories)');
        instructions.push('');
        break;

      case 'SLACK_BOT_TOKEN':
        instructions.push(`   ${name}=xoxb-...`);
        instructions.push('   Get your bot token from: https://api.slack.com/apps');
        instructions.push('   (Optional - only needed for Slack notifications)');
        instructions.push('');
        break;

      default:
        instructions.push(`   ${name}=<your-value-here>`);
        instructions.push('');
    }
  }

  instructions.push('3. Restart the application');

  return instructions.join('\n');
}
