# Requirements Document: End-to-End User Flow & SAP BTP Deployment

## Introduction

This document defines the complete user journey for the SAP Nova AI Alternative platform, from uploading legacy ABAP code through analysis, modernization, and deployment to SAP BTP. The platform itself is built as a modern SAP CAP (Cloud Application Programming Model) application with SAP Fiori UI, deployed and running on SAP BTP. The system must provide a seamless experience that guides users through the entire modernization lifecycle with clear feedback and actionable outputs.

## Glossary

- **Platform**: The SAP Nova AI Alternative - a CAP application running on SAP BTP
- **User**: SAP developer or architect using the platform
- **ABAP Code**: Legacy SAP ABAP custom code to be analyzed and modernized
- **Intelligence Dashboard**: The Custom Code Intelligence interface for analysis and Q&A (Fiori UI)
- **Transformation Engine**: The AI Build component that converts ABAP to modern code
- **CAP Service**: SAP Cloud Application Programming model backend service (Node.js/Java)
- **CDS**: Core Data Services - SAP's modeling language for defining data models and services
- **SAP BTP**: SAP Business Technology Platform (where the platform runs and deploys to)
- **SAP HANA Cloud**: Cloud database service for storing analysis data, vectors, and metadata
- **MTA**: Multi-Target Application (SAP BTP deployment package format)
- **Fiori Elements**: SAP's metadata-driven UI framework for building enterprise applications
- **SAP AI Core**: Optional SAP BTP service for running AI/ML workloads
- **Destination Service**: SAP BTP service for managing external connections (OpenAI, Pinecone, etc.)
- **XSUAA**: SAP Authorization and Trust Management service for authentication
- **Fit-to-Standard**: AI analysis that recommends SAP standard alternatives to custom code
- **Resurrection**: A complete ABAP-to-CAP transformation project with its own GitHub repository
- **SAP Business Application Studio (BAS)**: SAP's cloud-based IDE for developing CAP applications
- **GitHub Integration**: Automated repository creation and management for each resurrection project

## Requirements

### Requirement 1: SAP BTP Platform Architecture

**User Story:** As a platform administrator, I want the entire SAP Nova AI Alternative to run as a native CAP application on SAP BTP, so that it leverages SAP's cloud-native services and integrates seamlessly with the SAP ecosystem.

#### Acceptance Criteria

1. WHEN the platform is deployed THEN the system SHALL run as a CAP Node.js service with CDS data models on SAP BTP Cloud Foundry
2. WHEN data persistence is required THEN the system SHALL use SAP HANA Cloud with HDI (HANA Deployment Infrastructure) containers for schema management
3. WHEN the UI is accessed THEN the system SHALL serve SAP Fiori Elements or Freestyle UI5 applications from the CAP service
4. WHEN external AI services are needed THEN the system SHALL use SAP BTP Destination service to securely connect to OpenAI, Pinecone, or SAP AI Core
5. WHEN users authenticate THEN the system SHALL use XSUAA (SAP Authorization and Trust Management) with role-based access control
6. WHEN vector search is required THEN the system SHALL use either SAP HANA Cloud Vector Engine or external Pinecone via Destination service
7. WHEN the platform scales THEN the system SHALL support horizontal scaling via Cloud Foundry application instances
8. WHEN monitoring is needed THEN the system SHALL integrate with SAP Cloud ALM or BTP monitoring services
9. WHEN the platform is packaged THEN the system SHALL use MTA (Multi-Target Application) format with mta.yaml descriptor
10. WHEN APIs are exposed THEN the system SHALL use OData V4 protocol for CAP service endpoints

### Requirement 1.5: MCP Server Configuration and Management

**User Story:** As a platform administrator, I want to configure and manage MCP servers for ABAP analysis and CAP generation, so that the resurrection engine has access to specialized AI capabilities.

#### Acceptance Criteria

1. WHEN the platform initializes THEN the system SHALL load MCP configuration from `.kiro/settings/mcp.json` with servers: `abap-analyzer`, `sap-cap-generator`, `sap-ui5-generator`
2. WHEN MCP servers are configured THEN the system SHALL use SAP BTP Destination service to securely store API keys and connection details
3. WHEN an MCP server is called THEN the system SHALL use the Model Context Protocol to send requests with full context (ABAP code, SAP domain knowledge, transformation requirements)
4. WHEN MCP responses are received THEN the system SHALL stream results in real-time to show progress in the UI
5. WHEN MCP servers are unavailable THEN the system SHALL provide fallback behavior and clear error messages: "ABAP Analyzer MCP is offline. Resurrection paused."
6. WHEN new MCP servers are added THEN the system SHALL allow administrators to register them via UI: "Add MCP Server" with name, endpoint, and capabilities
7. WHEN MCP servers are tested THEN the system SHALL provide a health check endpoint that validates connectivity and response times
8. WHEN MCP usage is tracked THEN the system SHALL log all MCP calls with request/response payloads for debugging and audit
9. WHEN MCP costs are monitored THEN the system SHALL track token usage per resurrection and display cost estimates
10. WHEN MCP servers are updated THEN the system SHALL support hot-reloading without restarting the CAP service

### Requirement 2: Guided Onboarding Experience

**User Story:** As a first-time user, I want a guided onboarding experience that walks me through the resurrection process, so that I understand how to use the platform effectively.

#### Acceptance Criteria

1. WHEN a user first logs in THEN the system SHALL display a welcome wizard with 3 steps: "Upload ABAP", "Analyze & Understand", "Resurrect to CAP"
2. WHEN the wizard is shown THEN the system SHALL include video tutorials, sample ABAP files, and expected outcomes for each step
3. WHEN a user completes onboarding THEN the system SHALL offer to start with a sample resurrection using demo ABAP code
4. WHEN the sample resurrection completes THEN the system SHALL show the full journey: analysis → transformation → GitHub repo → BAS link
5. WHEN a user skips onboarding THEN the system SHALL provide a "Help" button that reopens the wizard at any time
6. WHEN a user returns THEN the system SHALL show a dashboard with "Continue where you left off" and recent resurrections
7. WHEN tooltips are needed THEN the system SHALL provide contextual help on every major UI element

### Requirement 3: ABAP Code Upload and Analysis

**User Story:** As a SAP developer, I want to upload my legacy ABAP code files with clear guidance, so that the system can analyze them and provide insights about my custom code landscape.

#### Acceptance Criteria

1. WHEN a user visits the upload page THEN the system SHALL display a Fiori-styled upload zone with drag-and-drop, file browser, and GitHub import options
2. WHEN a user hovers over the upload zone THEN the system SHALL show accepted formats (.abap, .txt, .zip) and size limits
3. WHEN a user uploads ABAP files THEN the system SHALL show real-time validation with green checkmarks for valid files and red errors for invalid ones
4. WHEN parsing starts THEN the system SHALL display an animated progress indicator with current step: "Parsing syntax", "Extracting metadata", "Analyzing dependencies"
5. WHEN parsing completes THEN the system SHALL show a success animation and automatically navigate to the Intelligence Dashboard
6. WHEN multiple files are uploaded THEN the system SHALL show a file list with individual progress bars and estimated time remaining
7. WHEN errors occur THEN the system SHALL provide clear error messages with suggestions: "Line 45: Invalid ABAP syntax. Try removing special characters"
8. WHEN upload completes THEN the system SHALL send a notification: "✅ 15 ABAP objects analyzed. View insights now?"

### Requirement 4: Interactive Intelligence Dashboard

**User Story:** As a SAP architect, I want to explore my custom code landscape through an intuitive, guided dashboard, so that I can quickly understand what code exists, how it's connected, and what actions to take.

#### Acceptance Criteria

1. WHEN a user navigates to the Intelligence Dashboard THEN the system SHALL display a hero section with key metrics in large, colorful cards: "50 Objects", "12,500 LOC", "8 Redundancies Found", "3 Fit-to-Standard Opportunities"
2. WHEN metrics are shown THEN the system SHALL include trend indicators (↑ 15% from last upload) and actionable buttons: "View Redundancies", "See Recommendations"
3. WHEN a user views the dependency graph THEN the system SHALL render an interactive D3.js visualization with zoom, pan, and search capabilities
4. WHEN a user hovers over a node THEN the system SHALL show a tooltip with object name, type, module, LOC, and quick actions: "View Details", "Start Resurrection"
5. WHEN a user clicks on a node THEN the system SHALL open a side panel with full documentation, dependencies, dependents, and impact analysis
6. WHEN the graph is complex THEN the system SHALL provide filter options: "Show only SD module", "Hide low-impact objects", "Highlight redundancies"
7. WHEN a user searches for code THEN the system SHALL show a smart search bar with autocomplete and semantic suggestions
8. WHEN search results appear THEN the system SHALL rank by relevance with highlighted keywords and preview snippets
9. WHEN redundant code is detected THEN the system SHALL show a "Redundancy Alert" banner with similarity scores and one-click consolidation recommendations
10. WHEN the dashboard loads THEN the system SHALL provide a guided tour: "👋 Let's explore your code landscape. Click here to see dependencies..."

### Requirement 5: Conversational Q&A Interface

**User Story:** As a business analyst, I want to have a natural conversation about the custom code, so that I can understand what the code does without reading ABAP syntax.

#### Acceptance Criteria

1. WHEN a user opens the Q&A interface THEN the system SHALL display a chat-like interface with suggested starter questions: "What pricing logic exists?", "Show me all SD module functions"
2. WHEN a user types a question THEN the system SHALL show typing indicators and use RAG to retrieve relevant code context
3. WHEN an answer is provided THEN the system SHALL format it with markdown, code snippets, and confidence badges (🟢 High, 🟡 Medium, 🔴 Low)
4. WHEN confidence is high THEN the system SHALL include expandable source references with "View in Dashboard" links
5. WHEN confidence is low THEN the system SHALL say "I'm not confident about this. Here are related questions you might ask:" with 3 suggestions
6. WHEN a user clicks on a source reference THEN the system SHALL open a modal with full ABAP code, documentation, and "Add to Resurrection" button
7. WHEN the conversation continues THEN the system SHALL maintain context and allow follow-up questions: "Tell me more about that function"
8. WHEN answers include technical terms THEN the system SHALL provide inline tooltips with definitions from the SAP glossary
9. WHEN a user asks about business impact THEN the system SHALL provide insights: "This function is used by 5 other objects. Changing it affects order processing."
10. WHEN the Q&A session is useful THEN the system SHALL offer to save the conversation as a PDF report

### Requirement 4: Fit-to-Standard Analysis

**User Story:** As a SAP architect, I want the system to recommend SAP standard alternatives to my custom code, so that I can reduce my custom code footprint and achieve Clean Core compliance.

#### Acceptance Criteria

1. WHEN custom code is analyzed THEN the system SHALL compare business logic against SAP standard BAPIs, transactions, and patterns
2. WHEN a standard alternative exists THEN the system SHALL recommend it with confidence score and implementation guidance
3. WHEN no standard alternative exists THEN the system SHALL mark the custom code as "required custom extension"
4. WHEN recommendations are generated THEN the system SHALL prioritize by impact (lines of code saved, complexity reduction)
5. WHEN a user accepts a recommendation THEN the system SHALL mark that code for standard replacement instead of modernization

### Requirement 6: Smart Resurrection Wizard

**User Story:** As a SAP developer, I want a guided wizard that helps me select and configure my resurrection project, so that I make informed decisions about what to modernize.

#### Acceptance Criteria

1. WHEN a user clicks "Start Resurrection" THEN the system SHALL launch a multi-step wizard: "Select Objects" → "Review Dependencies" → "Configure Output" → "Name Project"
2. WHEN selecting objects THEN the system SHALL display a smart table with filters, sorting, and AI recommendations: "⭐ Recommended: High impact, low complexity"
3. WHEN a user selects an object THEN the system SHALL show a preview card with: LOC, complexity score, dependencies, estimated transformation time
4. WHEN dependencies exist THEN the system SHALL auto-select them with a visual indicator: "🔗 Auto-included: 3 dependencies"
5. WHEN conflicts are detected THEN the system SHALL show warnings: "⚠️ Z_FUNCTION_A depends on Z_FUNCTION_B which is not selected. Add it?"
6. WHEN the user proceeds THEN the system SHALL show a dependency graph visualization of selected objects with impact analysis
7. WHEN configuring output THEN the system SHALL offer templates: "Fiori Elements List Report", "Freestyle UI5", "API-only CAP service"
8. WHEN naming the project THEN the system SHALL suggest names based on module and function: "resurrection-sd-pricing-logic" with validation for GitHub naming rules
9. WHEN the wizard completes THEN the system SHALL show a summary: "Ready to resurrect 5 objects (1,200 LOC) → Estimated time: 3 minutes"
10. WHEN the user confirms THEN the system SHALL show an animated "Resurrection in Progress" screen with live updates

### Requirement 7: MCP-Powered AI Transformation Engine

**User Story:** As a SAP developer, I want the system to leverage Model Context Protocol (MCP) servers for intelligent code transformation, so that I get accurate, context-aware CAP applications with Clean Core compliance.

#### Acceptance Criteria

1. WHEN transformation is initiated THEN the system SHALL invoke the ABAP Analyzer MCP server to parse legacy code structure, extract business logic, and identify SAP patterns
2. WHEN ABAP parsing completes THEN the system SHALL use the MCP context to understand SAP domain knowledge (pricing procedures, authorization objects, number ranges)
3. WHEN generating CAP backend THEN the system SHALL invoke the SAP CAP MCP server to create CDS models, service definitions, and event handlers
4. WHEN generating UI THEN the system SHALL invoke the SAP UI5 MCP server to create Fiori Elements annotations or Freestyle UI5 components
5. WHEN business logic is transformed THEN the system SHALL preserve all calculations, validations, and workflows exactly using MCP's code understanding
6. WHEN MCP servers are called THEN the system SHALL use streaming responses to show real-time progress: "Analyzing ABAP structure...", "Generating CDS models..."
7. WHEN multiple MCP servers are needed THEN the system SHALL orchestrate them in sequence: ABAP Analyzer → CAP Generator → UI5 Generator
8. WHEN MCP context is insufficient THEN the system SHALL prompt the user for clarification: "This ABAP code uses custom table ZCUSTOM. What entity should this map to?"
9. WHEN transformation completes THEN the system SHALL generate a complete CAP project with package.json, mta.yaml, CDS files, handlers, and UI
10. WHEN MCP errors occur THEN the system SHALL provide detailed error messages with MCP server logs and retry options

### Requirement 8: Kiro Hooks for Quality Validation

**User Story:** As a quality engineer, I want automated Kiro hooks to validate transformed code quality, so that every resurrection meets standards without manual intervention.

#### Acceptance Criteria

1. WHEN transformation completes THEN the system SHALL trigger a Kiro hook: "on-resurrection-complete" that runs automated quality checks
2. WHEN the quality hook runs THEN the system SHALL validate: CDS syntax, CAP service structure, Clean Core compliance, and business logic completeness
3. WHEN business logic is transformed THEN the system SHALL trigger a hook: "generate-tests" that creates unit tests for key calculations and workflows
4. WHEN the GitHub repo is created THEN the system SHALL trigger a hook: "setup-ci-cd" that configures GitHub Actions for continuous validation
5. WHEN quality issues are detected THEN the system SHALL trigger a hook: "quality-report" that generates a detailed report with line numbers and suggested fixes
6. WHEN all checks pass THEN the system SHALL trigger a hook: "mark-ready-for-deployment" that updates resurrection status and notifies the user
7. WHEN checks fail THEN the system SHALL trigger a hook: "request-review" that creates a GitHub issue with validation errors and assigns it to the user
8. WHEN a user saves changes in BAS THEN the system SHALL trigger a hook: "validate-on-save" that runs linting and type checking
9. WHEN hooks are configured THEN the system SHALL allow users to customize hook behavior via `.kiro/hooks/resurrection-hooks.json`
10. WHEN hooks execute THEN the system SHALL log all hook activity in the resurrection dashboard with timestamps and outcomes

### Requirement 8: SAP BTP Deployment Package Generation

**User Story:** As a DevOps engineer, I want the system to generate a complete SAP BTP deployment package, so that I can deploy the modernized application without manual configuration.

#### Acceptance Criteria

1. WHEN a user requests deployment package THEN the system SHALL generate an MTA (Multi-Target Application) structure with mta.yaml descriptor
2. WHEN generating mta.yaml THEN the system SHALL include all required modules (CAP service, UI5 app, database) and resources (HDI container, destination, XSUAA)
3. WHEN database artifacts exist THEN the system SHALL generate proper db/ folder with CDS schema definitions
4. WHEN authentication is required THEN the system SHALL configure XSUAA service with appropriate scopes and role templates
5. WHEN the package is complete THEN the system SHALL create a downloadable .zip file containing the entire MTA project

### Requirement 9: Local Testing and Preview

**User Story:** As a SAP developer, I want to test the modernized application locally before deploying to BTP, so that I can verify functionality in a safe environment.

#### Acceptance Criteria

1. WHEN a user requests local preview THEN the system SHALL provide instructions for running `cds watch` locally
2. WHEN the CAP application runs locally THEN the system SHALL use SQLite for database and mock authentication
3. WHEN a user accesses the local preview THEN the system SHALL display the Fiori UI connected to the CAP service
4. WHEN test data is needed THEN the system SHALL generate sample CSV files in the db/data/ folder
5. WHEN local testing completes THEN the system SHALL provide a checklist of functionality to verify before BTP deployment

### Requirement 10: SAP BTP Deployment Instructions

**User Story:** As a DevOps engineer, I want clear step-by-step instructions for deploying to SAP BTP, so that I can successfully deploy the modernized application to production.

#### Acceptance Criteria

1. WHEN a user requests deployment instructions THEN the system SHALL provide a detailed guide including prerequisites (Cloud Foundry CLI, MTA plugin, BTP account)
2. WHEN deployment steps are shown THEN the system SHALL include exact commands: `cf login`, `mbt build`, `cf deploy mta_archives/*.mtar`
3. WHEN BTP services are required THEN the system SHALL list all services to create (HANA HDI, XSUAA, destination) with creation commands
4. WHEN deployment completes THEN the system SHALL provide the application URL and instructions for accessing the Fiori launchpad
5. WHEN errors occur THEN the system SHALL provide troubleshooting guidance for common deployment issues

### Requirement 11: Deployment Status Tracking

**User Story:** As a project manager, I want to track the status of multiple modernization projects, so that I can monitor progress and identify blockers.

#### Acceptance Criteria

1. WHEN multiple projects exist THEN the system SHALL display a dashboard showing status of each (uploaded, analyzed, transformed, deployed)
2. WHEN a project status changes THEN the system SHALL update the dashboard in real-time
3. WHEN a user clicks on a project THEN the system SHALL show detailed history including timestamps, user actions, and transformation logs
4. WHEN errors occur THEN the system SHALL highlight failed projects with error details
5. WHEN a project completes THEN the system SHALL show success metrics (lines of code reduced, complexity score, deployment time)

### Requirement 12: Export and Documentation

**User Story:** As a SAP architect, I want to export comprehensive documentation of the modernization process, so that I can share results with stakeholders and maintain audit trails.

#### Acceptance Criteria

1. WHEN a user requests export THEN the system SHALL generate a PDF report including original ABAP analysis, transformation decisions, and final CAP structure
2. WHEN exporting code THEN the system SHALL include both the original ABAP files and the modernized CAP code in a structured .zip file
3. WHEN generating documentation THEN the system SHALL include dependency graphs, redundancy analysis, and fit-to-standard recommendations
4. WHEN transformation logs exist THEN the system SHALL include them in the export with timestamps and AI decision rationale
5. WHEN the export completes THEN the system SHALL provide a download link valid for 7 days

### Requirement 13: Rollback and Version Control

**User Story:** As a SAP developer, I want to version control my transformations and rollback if needed, so that I can experiment safely and recover from mistakes.

#### Acceptance Criteria

1. WHEN a transformation completes THEN the system SHALL save a versioned snapshot including input ABAP, output CAP, and transformation parameters
2. WHEN multiple versions exist THEN the system SHALL display a version history with timestamps and change summaries
3. WHEN a user selects a previous version THEN the system SHALL allow downloading that version's artifacts
4. WHEN a user wants to retry transformation THEN the system SHALL allow re-running with different AI parameters or manual adjustments
5. WHEN versions are compared THEN the system SHALL show a diff view highlighting changes between versions

### Requirement 14: Spec-Driven Resurrection Planning

**User Story:** As a SAP architect, I want to use Kiro specs to plan complex resurrection projects, so that I can define requirements, design, and tasks before executing transformations.

#### Acceptance Criteria

1. WHEN a user starts a complex resurrection THEN the system SHALL offer to create a Kiro spec: "Plan this resurrection with a spec?"
2. WHEN a spec is created THEN the system SHALL generate `.kiro/specs/resurrection-{project-name}/requirements.md` with EARS-formatted acceptance criteria
3. WHEN requirements are defined THEN the system SHALL use AI to generate a design document with CDS models, CAP services, and UI architecture
4. WHEN the design is approved THEN the system SHALL generate a task list with checkboxes for: "Parse ABAP", "Generate CDS", "Create UI", "Write tests", "Deploy to BTP"
5. WHEN tasks are executed THEN the system SHALL use Kiro's task execution workflow to track progress and mark tasks complete
6. WHEN a task involves MCP THEN the system SHALL reference the appropriate MCP server in the task description: "Use ABAP Analyzer MCP to parse Z_PRICING"
7. WHEN a task involves hooks THEN the system SHALL configure hooks in the task: "Set up quality validation hook after transformation"
8. WHEN the spec is complete THEN the system SHALL commit it to the GitHub resurrection repo for documentation
9. WHEN multiple resurrections use similar patterns THEN the system SHALL offer spec templates: "SD Pricing Resurrection", "MM Procurement Resurrection"
10. WHEN a user wants to review THEN the system SHALL provide a spec summary view showing requirements coverage, task completion, and quality metrics

### Requirement 15: Batch Processing and Automation

**User Story:** As a SAP architect, I want to process hundreds of ABAP programs in batch using specs and hooks, so that I can modernize large codebases efficiently with quality controls.

#### Acceptance Criteria

1. WHEN a user uploads a folder of ABAP files THEN the system SHALL offer to create a batch resurrection spec with requirements for all files
2. WHEN batch processing runs THEN the system SHALL execute resurrections in parallel with MCP orchestration and show real-time progress
3. WHEN individual files fail THEN the system SHALL trigger a hook: "on-resurrection-failed" that logs errors and continues processing others
4. WHEN batch completes THEN the system SHALL trigger a hook: "batch-summary-report" that generates a comprehensive report with success rate and savings
5. WHEN automation is configured THEN the system SHALL allow scheduling batch jobs via API or CLI with spec-based configuration
6. WHEN a batch resurrection uses a spec THEN the system SHALL track task completion across all files and show aggregate progress
7. WHEN hooks are needed for batch THEN the system SHALL configure batch-level hooks: "on-batch-start", "on-batch-complete", "on-batch-error"

### Requirement 15: GitHub Resurrection Repository Creation

**User Story:** As a SAP developer, I want each ABAP resurrection to automatically create a new GitHub repository, so that I can clone it into SAP Business Application Studio and continue development with full version control.

#### Acceptance Criteria

1. WHEN a transformation completes successfully THEN the system SHALL create a new GitHub repository with naming pattern `resurrection-{project-name}-{timestamp}`
2. WHEN the GitHub repo is created THEN the system SHALL initialize it with the complete CAP project structure including README.md, .gitignore, and all source files
3. WHEN the repository is initialized THEN the system SHALL commit all generated files with message "🔄 Resurrection: ABAP to CAP transformation complete"
4. WHEN the repo is ready THEN the system SHALL provide a direct "Open in SAP BAS" link that clones the repo into Business Application Studio
5. WHEN GitHub authentication is required THEN the system SHALL use OAuth GitHub App integration with user consent
6. WHEN the repository is created THEN the system SHALL add topics/tags: `sap-cap`, `abap-resurrection`, `clean-core`, `sap-btp`
7. WHEN the README is generated THEN the system SHALL include original ABAP context, transformation summary, deployment instructions, and BAS setup guide
8. WHEN multiple resurrections exist THEN the system SHALL display a gallery view showing all GitHub repos with clone/BAS links
9. WHEN a user wants to update a resurrection THEN the system SHALL create a new branch or new repo version instead of overwriting
10. WHEN the repo is created THEN the system SHALL optionally configure GitHub Actions for CI/CD (build, test, deploy to BTP)

### Requirement 16: SAP Business Application Studio Integration

**User Story:** As a SAP developer, I want seamless integration with SAP Business Application Studio, so that I can immediately start working on resurrected code in SAP's native cloud IDE.

#### Acceptance Criteria

1. WHEN a user clicks "Open in BAS" THEN the system SHALL generate a deep link that opens SAP Business Application Studio with the resurrection repo
2. WHEN BAS opens THEN the system SHALL automatically clone the GitHub repository into a new dev space
3. WHEN the project is cloned THEN the system SHALL detect it as a CAP project and suggest installing dependencies (`npm install`)
4. WHEN dependencies are installed THEN the system SHALL provide a "Run" button that executes `cds watch` for local testing
5. WHEN BAS is configured THEN the system SHALL include recommended extensions in `.vscode/extensions.json` (SAP CDS Language Support, SAP Fiori tools)
6. WHEN the user wants to deploy THEN the system SHALL provide BAS terminal commands for `cf login` and `cf deploy`
7. WHEN multiple resurrections exist THEN the system SHALL allow opening them in separate BAS dev spaces
8. WHEN BAS workspace is opened THEN the system SHALL include a `RESURRECTION.md` file with context about the original ABAP code

### Requirement 17: Resurrection Project Management

**User Story:** As a project manager, I want to track all resurrection projects in a centralized dashboard, so that I can monitor the portfolio of modernized applications.

#### Acceptance Criteria

1. WHEN the resurrection dashboard is opened THEN the system SHALL display all resurrection projects with status (in-progress, completed, deployed)
2. WHEN a resurrection is listed THEN the system SHALL show GitHub repo link, BAS link, original ABAP files, transformation date, and deployment status
3. WHEN a user searches resurrections THEN the system SHALL filter by module (SD, MM, FI), status, or date range
4. WHEN a resurrection is selected THEN the system SHALL show detailed metrics: lines of code reduced, complexity score, test coverage, deployment history
5. WHEN GitHub repo is updated THEN the system SHALL sync status back to the platform dashboard
6. WHEN a resurrection is deployed to BTP THEN the system SHALL display the live application URL and health status
7. WHEN multiple team members work on resurrections THEN the system SHALL show who created each project and current contributors
8. WHEN a resurrection is archived THEN the system SHALL mark it as archived but keep the GitHub repo accessible

### Requirement 18: API and CLI Access

**User Story:** As a DevOps engineer, I want to access platform functionality via API and CLI, so that I can integrate modernization into CI/CD pipelines.

#### Acceptance Criteria

1. WHEN API documentation is requested THEN the system SHALL provide OpenAPI/Swagger documentation for all endpoints
2. WHEN a user authenticates via API THEN the system SHALL use API keys or OAuth tokens for secure access
3. WHEN CLI is installed THEN the system SHALL provide commands for upload, analyze, transform, and deploy operations
4. WHEN CLI commands run THEN the system SHALL provide structured output (JSON) suitable for scripting
5. WHEN API rate limits are exceeded THEN the system SHALL return appropriate HTTP 429 status with retry-after headers
6. WHEN CLI creates a resurrection THEN the system SHALL return the GitHub repo URL and BAS link for automation
