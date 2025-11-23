# Implementation Plan: End-to-End User Flow & SAP BTP Deployment

## Task Overview

This implementation plan breaks down the SAP Nova AI Alternative platform into executable tasks. The platform is a complete CAP application running on SAP BTP with MCP integration, Kiro hooks, GitHub automation, and Slack notifications.

---

## Phase 1: CAP Project Foundation

- [ ] 1. Initialize CAP project structure
  - Create new CAP project with `cds init resurrection-platform`
  - Set up folder structure: `db/`, `srv/`, `app/`, `test/`
  - Configure package.json with CAP dependencies
  - Initialize Git repository
  - _Requirements: 1.1_

- [ ] 2. Define CDS data models
  - [ ] 2.1 Create core entities (Resurrections, ABAPObjects, Dependencies)
    - Define `db/schema.cds` with namespace `sap.resurrection`
    - Implement Resurrections entity with status enum and metrics
    - Implement ABAPObjects entity with vector embedding field
    - Implement Dependencies entity with relationship types
    - _Requirements: 1.2, 3_

  - [ ] 2.2 Create analysis entities (Redundancies, FitToStandardRecommendations)
    - Define Redundancies entity with similarity scoring
    - Define FitToStandardRecommendations entity
    - Add associations to ABAPObjects
    - _Requirements: 4_

  - [ ] 2.3 Create tracking entities (TransformationLogs, QualityReports, Deployments)
    - Define TransformationLogs for MCP audit trail
    - Define QualityReports with validation metrics
    - Define Deployments with environment tracking
    - _Requirements: 7, 8_

  - [ ] 2.4 Create integration entities (HookExecutions, SlackNotifications, GitHubActivities)
    - Define HookExecutions for hook tracking
    - Define SlackNotifications for message history
    - Define GitHubActivities for repo operations
    - _Requirements: 8, 15, 16_

- [ ] 3. Define CAP services
  - [ ] 3.1 Create ResurrectionService with OData V4
    - Define `srv/resurrection-service.cds`
    - Expose Resurrections, ABAPObjects, Dependencies entities
    - Add custom actions: startAnalysis, startTransformation, deployToBTP
    - Add custom functions: searchCode, getDependencyGraph, getResurrectionMetrics
    - _Requirements: 1.10, 2, 4_

  - [ ] 3.2 Create MCPService for MCP orchestration
    - Define `srv/mcp-service.cds`
    - Add actions: analyzeABAP, generateCAP, generateUI, createGitHubRepo, notifySlack
    - Add function: getMCPStatus
    - _Requirements: 1.5, 7_

  - [ ] 3.3 Create HookService for hook management
    - Define `srv/hook-service.cds`
    - Expose HookExecutions entity
    - Add actions: triggerHook, listAvailableHooks
    - _Requirements: 8_

---

## Phase 2: MCP Integration

- [ ] 4. Set up MCP configuration
  - Create `.kiro/settings/mcp.json` with server definitions
  - Configure ABAP Analyzer MCP server
  - Configure SAP CAP Generator MCP server
  - Configure SAP UI5 Generator MCP server
  - Configure GitHub MCP server with OAuth
  - Configure Slack MCP server with bot token
  - _Requirements: 1.5, 7_

- [ ] 5. Implement MCP client wrapper
  - [ ] 5.1 Create MCPClient base class
    - Implement connection management
    - Implement request/response handling
    - Implement streaming support for real-time progress
    - Add error handling and retry logic
    - _Requirements: 1.5, 7.6_

  - [ ] 5.2 Implement ABAP Analyzer MCP integration
    - Create `srv/lib/mcp/abap-analyzer-client.js`
    - Implement analyzeCode method
    - Implement extractBusinessLogic method
    - Implement findDependencies method
    - _Requirements: 7.1_

  - [ ] 5.3 Implement CAP Generator MCP integration
    - Create `srv/lib/mcp/cap-generator-client.js`
    - Implement generateCDSModels method
    - Implement generateServiceDefinitions method
    - Implement generateEventHandlers method
    - _Requirements: 7.3_

  - [ ] 5.4 Implement UI5 Generator MCP integration
    - Create `srv/lib/mcp/ui5-generator-client.js`
    - Implement generateFioriElements method
    - Implement generateFreestyleUI5 method
    - Implement generateManifest method
    - _Requirements: 7.4_

  - [ ] 5.5 Implement GitHub MCP integration
    - Create `srv/lib/mcp/github-client.js`
    - Implement createRepository method
    - Implement createOrUpdateFiles method
    - Implement createIssue method
    - Implement createRelease method
    - _Requirements: 15.1, 15.3_

  - [ ] 5.6 Implement Slack MCP integration
    - Create `srv/lib/mcp/slack-client.js`
    - Implement postMessage method
    - Implement postMessageWithAttachments method
    - Implement createThread method
    - _Requirements: 8 (Slack notifications)_

- [ ] 6. Implement MCP Orchestration Service
  - Create `srv/lib/mcp-orchestration-service.js`
  - Implement MCP server lifecycle management
  - Implement request routing to appropriate MCP servers
  - Implement streaming response handling
  - Add MCP health check functionality
  - _Requirements: 1.5, 7_

---

## Phase 3: Kiro Hooks Implementation

- [ ] 7. Set up hooks infrastructure
  - Create `.kiro/hooks/resurrection-hooks.json` configuration
  - Implement hook registry and loader
  - Implement hook trigger mechanism
  - Add hook execution logging to HookExecutions entity
  - _Requirements: 8_

- [ ] 8. Implement core resurrection hooks
  - [ ] 8.1 Implement on-resurrection-start hook
    - Trigger Slack notification to #resurrections channel
    - Trigger GitHub repository creation
    - Log hook execution
    - _Requirements: 8.1, 15.1_

  - [ ] 8.2 Implement on-resurrection-complete hook
    - Trigger quality validation agent execution
    - Create GitHub issue with validation results
    - Send Slack notification with results
    - _Requirements: 8.1, 8.2_

  - [ ] 8.3 Implement on-quality-validation-failed hook
    - Send Slack alert with error details
    - Create GitHub issue with "bug" label
    - Assign issue to resurrection owner
    - _Requirements: 8.5_

  - [ ] 8.4 Implement on-deployment-success hook
    - Send Slack celebration message
    - Create GitHub release with deployment URL
    - Update resurrection status to DEPLOYED
    - _Requirements: 8.6_

  - [ ] 8.5 Write property test for hook execution
    - **Property 6: Hook Execution Guarantee**
    - **Validates: Requirements 8.1**

---

## Phase 4: SAP BTP Services Integration

- [ ] 9. Configure XSUAA authentication
  - Create `xs-security.json` with role templates
  - Define scopes: ResurrectionAdmin, ResurrectionUser, ResurrectionViewer
  - Configure role collections
  - Implement authentication middleware in CAP
  - _Requirements: 1.5_

- [ ] 10. Configure Destination service
  - [ ] 10.1 Create destinations for external APIs
    - Create OpenAI API destination for embeddings
    - Create GitHub API destination with OAuth
    - Create Slack API destination with bot token
    - Store MCP server endpoints as destinations
    - _Requirements: 1.4, 1.5_

  - [ ] 10.2 Implement destination service client
    - Create `srv/lib/destination-client.js`
    - Implement getDestination method
    - Implement credential caching
    - Add error handling for missing destinations
    - _Requirements: 1.4_

- [ ] 11. Set up HANA Cloud database
  - [ ] 11.1 Configure HDI container
    - Create `mta.yaml` with HDI resource definition
    - Configure database connection in `package.json`
    - Set up HDI deployment configuration
    - _Requirements: 1.2_

  - [ ] 11.2 Implement vector search with HANA
    - Add REAL_VECTOR column to ABAPObjects entity
    - Implement COSINE_SIMILARITY search function
    - Create CDS view for semantic search
    - Add indexing for vector columns
    - _Requirements: 1.6, 3_

  - [ ] 11.3 Write property test for vector embeddings
    - **Property 12: Vector Embedding Consistency**
    - **Validates: Requirements 3**

---

## Phase 5: Core Business Logic

- [ ] 12. Implement ABAP upload and parsing
  - [ ] 12.1 Create file upload handler
    - Implement multipart/form-data handling
    - Validate ABAP file format (.abap, .txt)
    - Store uploaded files temporarily
    - Create ABAPObjects records
    - _Requirements: 3.2_

  - [ ] 12.2 Implement ABAP analysis workflow
    - Call ABAP Analyzer MCP for each file
    - Extract metadata (functions, tables, dependencies)
    - Generate AI documentation
    - Create vector embeddings
    - Store results in HANA Cloud
    - _Requirements: 3.3, 3.4_

  - [ ] 12.3 Write property test for ABAP validation
    - **Property 1: ABAP File Validation Consistency**
    - **Validates: Requirements 3.1**

- [ ] 13. Implement Intelligence Dashboard backend
  - [ ] 13.1 Implement dashboard metrics calculation
    - Create getResurrectionMetrics function
    - Calculate total objects, LOC, complexity
    - Calculate redundancy statistics
    - Calculate fit-to-standard opportunities
    - _Requirements: 4.1_

  - [ ] 13.2 Implement dependency graph generation
    - Create getDependencyGraph function
    - Build graph from Dependencies entity
    - Calculate critical nodes
    - Export as JSON for D3.js visualization
    - _Requirements: 4.3_

  - [ ] 13.3 Implement semantic search
    - Create searchCode function
    - Generate query embedding via OpenAI
    - Perform HANA vector similarity search
    - Rank results by relevance
    - _Requirements: 4.4_

  - [ ] 13.4 Write property test for dashboard metrics
    - **Property 2: Dashboard Metrics Accuracy**
    - **Validates: Requirements 4.1**

  - [ ] 13.5 Write property test for dependency graph
    - **Property 10: Dependency Graph Completeness**
    - **Validates: Requirements 4.3**

- [ ] 14. Implement Q&A interface backend
  - [ ] 14.1 Create RAG-based Q&A service
    - Implement askQuestion action
    - Perform semantic search for relevant code
    - Build context from top results
    - Call OpenAI with context for answer generation
    - _Requirements: 5.1_

  - [ ] 14.2 Implement confidence scoring
    - Calculate confidence based on relevance scores
    - Classify as high/medium/low
    - Include source references with relevance
    - _Requirements: 5.2_

  - [ ] 14.3 Write property test for Q&A responses
    - **Property 3: Q&A Response Completeness**
    - **Validates: Requirements 5.2**

- [ ] 15. Implement code transformation workflow
  - [ ] 15.1 Create transformation orchestration
    - Implement startTransformation action
    - Orchestrate MCP calls: ABAP Analyzer → CAP Generator → UI5 Generator
    - Stream progress updates to client
    - Handle transformation errors
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 15.2 Implement CAP code generation
    - Call CAP Generator MCP with business logic
    - Generate CDS models from ABAP structures
    - Generate service definitions
    - Generate event handlers
    - _Requirements: 7.3_

  - [ ] 15.3 Implement UI generation
    - Call UI5 Generator MCP with service definition
    - Generate Fiori Elements annotations
    - Generate manifest.json
    - Generate UI5 components
    - _Requirements: 7.4_

  - [ ] 15.4 Implement MTA packaging
    - Generate package.json with dependencies
    - Generate mta.yaml with modules and resources
    - Generate xs-security.json
    - Package all files for deployment
    - _Requirements: 7.5_

  - [ ] 15.5 Write property test for MCP invocation
    - **Property 4: MCP Invocation Reliability**
    - **Validates: Requirements 7.1**

  - [ ] 15.6 Write property test for transformation output
    - **Property 5: Transformation Output Completeness**
    - **Validates: Requirements 7.5**

---

## Phase 6: GitHub Integration

- [ ] 16. Implement GitHub repository creation
  - [ ] 16.1 Create resurrection repository workflow
    - Generate repository name: `resurrection-{project}-{timestamp}`
    - Call GitHub MCP createRepository
    - Initialize with README, .gitignore, LICENSE
    - Add topics: sap-cap, abap-resurrection, clean-core
    - _Requirements: 15.1, 15.6_

  - [ ] 16.2 Implement file commit workflow
    - Prepare all generated files
    - Call GitHub MCP createOrUpdateFiles
    - Use commit message: "🔄 Resurrection: ABAP to CAP transformation complete"
    - Log GitHub activity
    - _Requirements: 15.3_

  - [ ] 16.3 Implement CI/CD setup
    - Generate GitHub Actions workflow file
    - Commit .github/workflows/ci.yml
    - Configure build, test, deploy jobs
    - _Requirements: 15.10_

  - [ ] 16.4 Write property test for GitHub repo creation
    - **Property 7: GitHub Repository Creation**
    - **Validates: Requirements 15.1**

  - [ ] 16.5 Write property test for commit message
    - **Property 8: Git Commit Message Consistency**
    - **Validates: Requirements 15.3**

- [ ] 17. Implement SAP BAS integration
  - [ ] 17.1 Generate BAS deep links
    - Create generateBASLink function
    - Format: `https://bas.{region}.hana.ondemand.com/?gitClone={repo_url}`
    - Validate URL format
    - Store in Resurrections entity
    - _Requirements: 16.1_

  - [ ] 17.2 Create BAS workspace configuration
    - Generate .vscode/extensions.json with SAP extensions
    - Generate .vscode/settings.json
    - Create RESURRECTION.md with context
    - _Requirements: 16.5, 16.8_

  - [ ] 17.3 Write property test for BAS link generation
    - **Property 9: BAS Deep Link Generation**
    - **Validates: Requirements 16.1**

---

## Phase 7: Fiori UI Development

- [ ] 18. Create Fiori Elements UI
  - [ ] 18.1 Generate Fiori Elements List Report for Resurrections
    - Create `app/resurrections/` folder
    - Generate manifest.json
    - Add Fiori Elements annotations to Resurrections entity
    - Configure navigation and actions
    - _Requirements: 1.3, 2.1_

  - [ ] 18.2 Generate Fiori Elements Object Page for Resurrection details
    - Add facets for ABAP Objects, Dependencies, Quality Reports
    - Configure actions: Start Analysis, Start Transformation, Deploy
    - Add charts for metrics visualization
    - _Requirements: 4.1_

  - [ ] 18.3 Create custom Freestyle UI5 components
    - Create dependency graph visualization (D3.js)
    - Create Q&A chat interface
    - Create resurrection wizard
    - Create onboarding wizard
    - _Requirements: 2, 4.3, 5, 6_

- [ ] 19. Implement UI navigation and routing
  - Configure Fiori launchpad integration
  - Set up routing between List Report and Object Page
  - Add navigation to custom UI5 components
  - _Requirements: 1.3_

---

## Phase 8: Deployment and DevOps

- [ ] 20. Create MTA deployment package
  - [ ] 20.1 Configure mta.yaml
    - Define CAP service module
    - Define UI5 app module
    - Define HDI container resource
    - Define XSUAA resource
    - Define Destination resource
    - _Requirements: 1.9_

  - [ ] 20.2 Build and deploy to BTP
    - Run `mbt build` to create MTAR
    - Deploy to Cloud Foundry: `cf deploy mta_archives/*.mtar`
    - Verify all services are running
    - Test application URL
    - _Requirements: 10.2_

- [ ] 21. Set up monitoring and logging
  - Configure Cloud Logging service
  - Implement structured logging in CAP
  - Set up alerts for critical errors
  - Integrate with SAP Cloud ALM (optional)
  - _Requirements: 1.8_

---

## Phase 9: Testing and Quality

- [ ] 22. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 10: Documentation and Launch

- [ ] 23. Create platform documentation
  - Write README.md with setup instructions
  - Document MCP server configuration
  - Document hook configuration
  - Create user guide for resurrection workflow
  - _Requirements: All_

- [ ] 24. Final deployment and launch
  - Deploy to production BTP environment
  - Configure custom domain (optional)
  - Set up GitHub organization for resurrections
  - Configure Slack workspace integration
  - Announce platform launch
  - _Requirements: All_

