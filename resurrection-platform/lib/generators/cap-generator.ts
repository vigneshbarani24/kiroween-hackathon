/**
 * CAP Project Generator
 * 
 * Generates SAP CAP project structure and files
 */

import { CDSEntity, CDSService, CAPProject, ProjectFile } from './types';

export class CAPGenerator {
  /**
   * Generate a complete CAP project
   */
  async generateProject(
    name: string,
    entities: CDSEntity[],
    services: CDSService[]
  ): Promise<CAPProject> {
    const files: ProjectFile[] = [];

    // Generate package.json
    files.push(this.generatePackageJson(name));

    // Generate CDS schema
    files.push(this.generateSchema(entities));

    // Generate services
    for (const service of services) {
      files.push(this.generateService(service, entities));
    }

    // Generate mta.yaml
    files.push(this.generateMtaYaml(name));

    // Generate README
    files.push(this.generateReadme(name, entities, services));

    return {
      name,
      files,
      structure: {
        db: ['schema.cds'],
        srv: services.map(s => `${s.name}.cds`),
        app: [],
        root: ['package.json', 'mta.yaml', 'README.md']
      }
    };
  }

  /**
   * Generate package.json
   */
  private generatePackageJson(name: string): ProjectFile {
    const content = {
      name,
      version: '1.0.0',
      description: `SAP CAP application - ${name}`,
      repository: '<Add your repository here>',
      license: 'UNLICENSED',
      private: true,
      dependencies: {
        '@sap/cds': '^7',
        'express': '^4'
      },
      devDependencies: {
        '@cap-js/sqlite': '^1',
        '@sap/cds-dk': '^7'
      },
      scripts: {
        start: 'cds-serve'
      },
      cds: {
        requires: {
          db: {
            kind: 'sqlite',
            credentials: {
              database: ':memory:'
            }
          }
        }
      }
    };

    return {
      path: 'package.json',
      content: JSON.stringify(content, null, 2)
    };
  }

  /**
   * Generate CDS schema
   */
  private generateSchema(entities: CDSEntity[]): ProjectFile {
    let content = 'namespace com.sap.resurrection;\n\n';

    for (const entity of entities) {
      content += this.generateEntityDefinition(entity);
      content += '\n\n';
    }

    return {
      path: 'db/schema.cds',
      content
    };
  }

  /**
   * Generate entity definition
   */
  private generateEntityDefinition(entity: CDSEntity): string {
    let def = `entity ${entity.name} {\n`;

    // Add fields
    for (const field of entity.fields) {
      def += `  ${field.name} : ${field.type}`;
      if (field.key) def += ' @key';
      if (field.notNull) def += ' not null';
      if (field.default !== undefined) def += ` default ${field.default}`;
      def += ';\n';
    }

    // Add associations
    for (const assoc of entity.associations) {
      def += `  ${assoc.name} : Association to ${assoc.cardinality === 'many' ? 'many' : 'one'} ${assoc.target}`;
      if (assoc.on) def += ` on ${assoc.on}`;
      def += ';\n';
    }

    def += '}';

    // Add annotations
    if (entity.annotations && Object.keys(entity.annotations).length > 0) {
      def += '\n';
      for (const [key, value] of Object.entries(entity.annotations)) {
        def += `annotate ${entity.name} with @${key}`;
        if (typeof value === 'string') {
          def += ` : '${value}'`;
        } else {
          def += ` : ${JSON.stringify(value)}`;
        }
        def += ';\n';
      }
    }

    return def;
  }

  /**
   * Generate service definition
   */
  private generateService(service: CDSService, entities: CDSEntity[]): ProjectFile {
    let content = `using { com.sap.resurrection as db } from '../db/schema';\n\n`;
    content += `service ${service.name} {\n`;

    // Expose entities
    for (const entityName of service.entities) {
      content += `  entity ${entityName} as projection on db.${entityName};\n`;
    }

    // Add actions
    if (service.actions) {
      for (const action of service.actions) {
        content += `  action ${action.name}(`;
        content += action.params.map(p => `${p.name}: ${p.type}`).join(', ');
        content += ')';
        if (action.returns) content += ` returns ${action.returns}`;
        content += ';\n';
      }
    }

    // Add functions
    if (service.functions) {
      for (const func of service.functions) {
        content += `  function ${func.name}(`;
        content += func.params.map(p => `${p.name}: ${p.type}`).join(', ');
        content += `) returns ${func.returns};\n`;
      }
    }

    content += '}\n';

    return {
      path: `srv/${service.name}.cds`,
      content
    };
  }

  /**
   * Generate mta.yaml
   */
  private generateMtaYaml(name: string): ProjectFile {
    const content = `_schema-version: '3.1'
ID: ${name}
version: 1.0.0
description: "SAP CAP application - ${name}"
parameters:
  enable-parallel-deployments: true
build-parameters:
  before-all:
    - builder: custom
      commands:
        - npm ci
        - npx cds build --production
modules:
  - name: ${name}-srv
    type: nodejs
    path: gen/srv
    parameters:
      buildpack: nodejs_buildpack
    build-parameters:
      builder: npm
    provides:
      - name: srv-api
        properties:
          srv-url: \${default-url}
    requires:
      - name: ${name}-db

  - name: ${name}-db-deployer
    type: hdb
    path: gen/db
    parameters:
      buildpack: nodejs_buildpack
    requires:
      - name: ${name}-db

resources:
  - name: ${name}-db
    type: com.sap.xs.hdi-container
    parameters:
      service: hana
      service-plan: hdi-shared
`;

    return {
      path: 'mta.yaml',
      content
    };
  }

  /**
   * Generate README
   */
  private generateReadme(
    name: string,
    entities: CDSEntity[],
    services: CDSService[]
  ): ProjectFile {
    const content = `# ${name}

SAP CAP application generated from ABAP code.

## Project Structure

- \`db/\` - Database schema and data models
- \`srv/\` - Service definitions
- \`app/\` - UI applications

## Entities

${entities.map(e => `- **${e.name}**: ${e.fields.length} fields`).join('\n')}

## Services

${services.map(s => `- **${s.name}**: Exposes ${s.entities.join(', ')}`).join('\n')}

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Run locally
npm start
\`\`\`

## Deployment

\`\`\`bash
# Build for production
npm run build

# Deploy to SAP BTP
cf deploy mta_archives/${name}_1.0.0.mtar
\`\`\`

## Generated by Resurrection Platform

This project was automatically generated from legacy ABAP code using the Resurrection Platform.
`;

    return {
      path: 'README.md',
      content
    };
  }
}
