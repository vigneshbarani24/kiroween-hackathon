# Generators Module

This module contains code generators for creating SAP CAP projects, UI5 applications, and mock data.

## Structure

```
generators/
├── types.ts                  # Type definitions for all generators
├── mock-data-generator.ts    # Generates realistic CSV mock data
├── cap-generator.ts          # Generates SAP CAP project structure
├── ui5-generator.ts          # Generates SAP Fiori / UI5 applications
└── index.ts                  # Exports all generators
```

## Usage

### Mock Data Generator

```typescript
import { MockDataGenerator } from './generators';

const generator = new MockDataGenerator();
const csvFiles = await generator.generateForEntities(entities, {
  recordsPerEntity: 25,
  preserveReferentialIntegrity: true
});
```

### CAP Generator

```typescript
import { CAPGenerator } from './generators';

const generator = new CAPGenerator();
const project = await generator.generateProject(
  'my-cap-app',
  entities,
  services
);
```

### UI5 Generator

```typescript
import { UI5Generator } from './generators';

const generator = new UI5Generator();
const files = await generator.generateUI5App({
  type: 'Fiori Elements',
  namespace: 'com.example.app',
  entities: ['SalesOrder', 'Customer']
});
```

## Features

### Mock Data Generator
- Generates realistic data using field name heuristics
- Supports all common data types (string, integer, decimal, date, boolean)
- Ensures referential integrity across entities
- Configurable number of records per entity
- Outputs CSV format for db/data/ folder

### CAP Generator
- Generates complete CAP project structure
- Creates CDS entity definitions with annotations
- Generates service definitions
- Creates package.json with dependencies
- Generates mta.yaml for deployment
- Includes README with documentation

### UI5 Generator
- Supports Fiori Elements and Freestyle UI5
- Generates manifest.json with OData V4 configuration
- Creates views and controllers
- Includes routing configuration
- Generates package.json for UI5 tooling

## Type Definitions

All generators use shared type definitions from `types.ts`:

- `CDSEntity` - CDS entity definition
- `CDSService` - CDS service definition
- `MockDataConfig` - Mock data configuration
- `UIConfig` - UI5 application configuration
- `TransformationPlan` - Complete transformation plan
- `CAPProject` - Generated CAP project structure

## Testing

Unit tests for generators are located in `__tests__/generators/`:

```bash
npm test -- generators
```

## Requirements

This module implements requirements from `.kiro/specs/mcp-integration/requirements.md`:

- Requirement 16: Mock Data Generation
- Requirement 12: CAP Project Structure
- Requirement 9.3: UI5 Application Generation
