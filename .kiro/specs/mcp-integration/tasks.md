# Implementation Plan: MCP Integration for Resurrection Platform

## Overview

This task list breaks down the implementation of the fully MCP-powered resurrection platform into discrete, actionable coding tasks. Each task builds incrementally on previous tasks.

**MVP Focus:** Core workflow (ABAP → Analyze → Plan → Generate → Deploy → Notify) with basic UI. Tests marked as optional (*).

**Context Documents Available:**
- `.kiro/specs/mcp-integration/requirements.md` - All requirements with EARS criteria
- `.kiro/specs/mcp-integration/design.md` - Complete technical design
- `.kiro/specs/mcp-integration/MCP_SERVERS_READY.md` - MCP server testing results
- `.kiro/settings/mcp.json` - MCP server configuration

---

## Implementation Status

### ✅ Completed (Tasks 1-9, 14.5)
- **Core Infrastructure:** MCP clients, workflow engine, generators
- **Workflow Implementation:** All 5 steps (Analyze, Plan, Generate, Validate, Deploy)
- **UI Components:** Upload wizard, progress view, dashboard, detail pages
- **MCP Integration:** ABAP Analyzer, CAP, UI5, GitHub, Slack
- **Logging & Debugging:** Comprehensive MCP logging with debug mode
- **Database:** Prisma schema with all required models
- **Halloween Theme:** Fully applied across all pages

### 🔨 Remaining (Tasks 10-13, 14.1-14.4, 15)
- **Authentication:** NextAuth.js setup with OAuth providers
- **Testing:** Unit tests, property-based tests, integration tests
- **Performance:** Caching, optimization, batch operations
- **Polish:** Loading states, error messages, accessibility
- **Deployment:** Production deployment and monitoring

### 📊 Progress: ~70% Complete

The core resurrection workflow is fully functional. Remaining work focuses on production readiness: authentication, comprehensive testing, performance optimization, and deployment.

### 🎯 Current Implementation Notes

**What's Working:**
- ✅ Full 5-step workflow (Analyze → Plan → Generate → Validate → Deploy)
- ✅ Real MCP server integration (ABAP Analyzer, CAP, UI5, GitHub, Slack)
- ✅ Database persistence with Prisma (PostgreSQL)
- ✅ Real-time progress tracking with SSE
- ✅ Comprehensive MCP logging and debugging
- ✅ Halloween-themed UI across all pages
- ✅ Mock data generation for entities
- ✅ GitHub repository creation and file commits
- ✅ Slack notifications for workflow events

**Known Limitations:**
- ⚠️ No authentication (all resurrections use 'system' user)
- ⚠️ No test coverage (unit, property-based, or integration tests)
- ⚠️ No caching for MCP calls (performance optimization needed)
- ⚠️ No production deployment configuration
- ⚠️ Limited error recovery testing

**Next Priority:**
1. Add authentication (Task 10) - Critical for multi-user support
2. Write core unit tests (Task 2.8, 3.11, 5.6) - Ensure reliability
3. Implement property-based tests (Task 12) - Validate correctness properties
4. Add performance optimizations (Task 14.1) - Improve speed
5. Deploy to production (Task 14) - Make it live

---

## Tasks

- [x] 1. Set up project structure and core interfaces
  - Create directory structure for MCP client, workflow engine, and generators
  - Set up TypeScript configuration
  - Install dependencies: @modelcontextprotocol/sdk, fast-check, jest
  - _Requirements: 2.1, 2.7_

- [x] 2. Implement MCP Client Service





- [x] 2.1 Create MCPClient class with connection management


  - Implement `initializeConnections()` to start all 5 MCP servers
  - Implement `healthCheck()` to verify server connectivity
  - Implement generic `call(server, tool, params)` method
  - _Requirements: 4.1, 4.6_

- [x] 2.2 Add ABAP Analyzer MCP integration


  - Implement `analyzeABAP(code)` method
  - Call ABAP Analyzer MCP `analyzeCode` tool
  - Parse and return ABAPAnalysis interface
  - _Requirements: 5.3, 9.1_

- [x] 2.3 Add SAP CAP MCP integration (via Kiro)


  - Implement `searchCAPModel(query)` using mcp_sap_cap_search_model
  - Implement `searchCAPDocs(query)` using mcp_sap_cap_search_docs
  - _Requirements: 9.2_

- [x] 2.4 Add SAP UI5 MCP integration (via Kiro)


  - Implement `createUI5App(config)` using mcp_sap_ui5_create_ui5_app
  - Implement `lintUI5Project(path)` using mcp_sap_ui5_run_ui5_linter
  - Implement `getUI5APIReference(query)` using mcp_sap_ui5_get_api_reference
  - _Requirements: 9.3_

- [x] 2.5 Add GitHub MCP integration

  - Implement `createRepository(name, description)` 
  - Implement `commitFiles(repo, files)`
  - Handle GITHUB_TOKEN from environment
  - _Requirements: 10.2, 10.3_

- [x] 2.6 Add Slack MCP integration

  - Implement `postMessage(channel, message)`
  - Handle SLACK_BOT_TOKEN from environment
  - _Requirements: 4.9_

- [x] 2.7 Implement error handling with retries


  - Create MCPErrorHandler class
  - Implement retry logic with exponential backoff (3 attempts)
  - Implement fallback strategies for each MCP server
  - _Requirements: 9.8, 9.9_

- [ ]* 2.8 Write unit tests for MCP Client
  - Test connection initialization
  - Test each MCP tool call with mocked responses
  - Test error handling and retries
  - _Requirements: 4.5_

-

- [ ] 3. Implement Resurrection Workflow Engine

- [x] 3.1 Create ResurrectionEngine class


  - Implement main `execute(abapCode, config)` method
  - Set up workflow step tracking
  - Implement event emitters for progress updates
  - _Requirements: 3.1, 3.7_

- [x] 3.2 Implement Step 1: Analyze


  - Call ABAP Analyzer MCP via MCPClient
  - Store analysis results in database
  - Emit progress event
  - _Requirements: 3.2, 5.3_

- [x] 3.3 Implement Step 2: Plan


  - Use Kiro AI to create transformation plan
  - Call CAP MCP for patterns and examples
  - Generate CDS entity definitions
  - Store plan in database
  - _Requirements: 3.3_

- [x] 3.4 Implement Step 3: Generate CAP Project


  - Use `cds init` to create project structure
  - Generate CDS models from plan
  - Generate service definitions
  - Call UI5 MCP to create Fiori app
  - _Requirements: 3.4, 9.2, 9.3, 12.1_

- [x] 3.5 Implement Step 3b: Generate Mock Data


  - Create MockDataGenerator class
  - Generate CSV files for each entity (10-50 records)
  - Ensure referential integrity
  - Use faker.js for realistic data
  - _Requirements: 16.3, 16.4_

- [ ]* 3.6 Write property test for mock data integrity
  - **Property 5: Mock Data Referential Integrity**
  - **Validates: Requirements 16.4**

- [x] 3.7 Implement Step 4: Validate


  - Call UI5 MCP linter
  - Validate CDS syntax
  - Check CAP structure completeness
  - _Requirements: 3.5, 9.9_

- [x] 3.8 Implement Step 5: Deploy to GitHub


  - Call GitHub MCP to create repository
  - Commit all generated files
  - Add repository topics
  - Generate README with deployment instructions
  - _Requirements: 3.6, 10.2, 10.3, 10.7_

- [x] 3.9 Implement Step 5b: Send Slack Notification



  - Call Slack MCP with completion message
  - Include repo URL and summary
  - Handle Slack MCP failures gracefully
  - _Requirements: 3.10, 10.11_

- [ ]* 3.10 Write property test for workflow step ordering
  - **Property 3: Workflow Step Ordering**
  - **Validates: Requirements 3.1**

- [ ]* 3.11 Write unit tests for workflow engine
  - Test each step independently with mocked MCP client
  - Test error propagation between steps
  - Test progress event emission
  - _Requirements: 3.7, 3.8_

- [x] 4. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.


- [x] 5. Set up database and API routes






- [x] 5.1 Create Prisma schema

  - Define Resurrection model
  - Define WorkflowStep model
  - Define MCPLog model
  - Run migrations
  - _Requirements: 2.2_


- [x] 5.2 Create API route: POST /api/resurrections

  - Accept ABAP code upload
  - Validate input
  - Start resurrection workflow
  - Return resurrection ID
  - _Requirements: 5.1, 5.2_


- [x] 5.3 Create API route: GET /api/resurrections/[id]

  - Return resurrection status and metadata
  - Include workflow steps
  - Include MCP logs
  - _Requirements: 14.1, 14.2_


- [x] 5.4 Create API route: GET /api/resurrections/[id]/steps

  - Return real-time workflow step progress
  - Stream updates using Server-Sent Events (SSE)
  - _Requirements: 3.7_


- [x] 5.5 Create API route: GET /api/mcp/health

  - Check health of all 5 MCP servers
  - Return status for each server
  - _Requirements: 4.6_

- [ ]* 5.6 Write API integration tests
  - Test resurrection creation
  - Test status retrieval
  - Test SSE streaming
  - _Requirements: 2.8_

- [x] 6. Build Upload Wizard UI




- [x] 6.1 Create ABAP upload component


  - Drag-and-drop file upload
  - File validation (.abap, .txt)
  - Real-time validation feedback
  - _Requirements: 5.1, 5.2_

- [x] 6.2 Create resurrection wizard flow


  - Step 1: Upload ABAP
  - Step 2: Review analysis
  - Step 3: Configure options (name, template)
  - Step 4: Confirm and start
  - _Requirements: 8.1, 8.7_

- [x] 6.3 Apply Halloween theme to wizard


  - Use Shadcn UI components
  - Dark theme with orange accents
  - Spooky animations and icons
  - _Requirements: 17.1, 17.2, 17.8_


- [x] 7. Build Workflow Progress View
- [x] 7.1 Create workflow progress component
  - Display 5 workflow steps
  - Show current step with animation
  - Display step duration
  - _Requirements: 3.7, 8.9_

- [x] 7.2 Implement real-time updates
  - Connect to SSE endpoint
  - Update UI as steps complete
  - Show MCP call logs
  - _Requirements: 3.7, 4.4_

- [x] 7.3 Display generated code preview
  - Show CDS models
  - Show service definitions
  - Show UI5 app structure
  - _Requirements: 3.9_

- [x] 7.4 Apply Halloween theme to progress view
  - Resurrection ritual progress indicator
  - Floating ghost animations
  - Tombstone-shaped step cards
  - _Requirements: 17.8, 17.10_

- [x] 8. Build Resurrection Dashboard
- [x] 8.1 Create resurrection list component
  - Display all resurrections with status
  - Show GitHub repo links
  - Show creation date and module
  - _Requirements: 14.1, 14.2_

- [x] 8.2 Implement filtering and search
  - Filter by status (in-progress, completed, failed)
  - Filter by module (SD, MM, FI, CUSTOM)
  - Search by name
  - _Requirements: 14.3_

- [x] 8.3 Display aggregate metrics
  - Total resurrections
  - Total LOC saved
  - Average complexity
  - Success rate
  - _Requirements: 14.10_

- [x] 8.4 Apply Halloween theme to dashboard
  - Tombstone-shaped cards
  - Spider web graphs for metrics
  - Bat-wing progress bars
  - _Requirements: 17.10, 17.12_

- [x] 9. Implement MCP Logging and Debugging
- [x] 9.1 Create MCP logger service
  - Log all MCP calls with timestamp, server, tool, params
  - Log responses and errors
  - Store in database (mcp_logs table)
  - _Requirements: 12.1, 12.2_

- [x] 9.2 Create MCP logs viewer UI
  - Display logs for each resurrection
  - Filter by server, tool, status
  - Search log content
  - Export logs as JSON
  - _Requirements: 12.5, 12.7_

- [x] 9.3 Implement debug mode
  - Log full request/response payloads
  - Enable via environment variable
  - _Requirements: 12.8_

- [ ] 10. Add authentication and authorization
- [ ] 10.1 Set up NextAuth.js
  - Configure GitHub OAuth provider
  - Configure Google OAuth provider
  - Set up JWT tokens
  - _Requirements: 2.5_

- [ ] 10.2 Implement authorization checks
  - Users can only see their own resurrections
  - Admin role can see all resurrections
  - Update API routes with auth checks
  - _Requirements: 2.5, 14.7_

- [ ] 10.3 Add user context to workflow
  - Pass authenticated user ID to resurrection engine
  - Link resurrections to authenticated users
  - Update UI to show user-specific data
  - _Requirements: 14.7_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 12. Write property-based tests for correctness properties
- [ ]* 12.1 Write property test: ABAP Analysis Completeness
  - **Feature: mcp-integration, Property 1: ABAP Analysis Completeness**
  - For any valid ABAP code, the ABAP Analyzer MCP should extract at least one of: business logic patterns, database tables, or SAP patterns
  - **Validates: Requirements 2.1, 5.3**

- [ ]* 12.2 Write property test: MCP Server Health
  - **Feature: mcp-integration, Property 2: MCP Server Health**
  - For any resurrection workflow execution, all required MCP servers should be reachable before starting
  - **Validates: Requirements 4.5, 4.6**

- [ ]* 12.3 Write property test: Workflow Step Ordering
  - **Feature: mcp-integration, Property 3: Workflow Step Ordering**
  - For any resurrection, workflow steps should execute in order: Analyze → Plan → Generate → Validate → Deploy
  - **Validates: Requirements 3.1, 3.7**

- [ ]* 12.4 Write property test: GitHub Repository Creation
  - **Feature: mcp-integration, Property 4: GitHub Repository Creation**
  - For any completed resurrection, if GitHub MCP is used, a repository should be created with a valid URL
  - **Validates: Requirements 10.2, 10.3**

- [ ]* 12.5 Write property test: Mock Data Referential Integrity
  - **Feature: mcp-integration, Property 5: Mock Data Referential Integrity**
  - For any generated mock data, all foreign key references should point to existing records in related entities
  - **Validates: Requirements 16.4**

- [ ]* 12.6 Write property test: CAP Project Structure
  - **Feature: mcp-integration, Property 6: CAP Project Structure**
  - For any generated CAP project, the folder structure should include db/, srv/, app/, package.json, and mta.yaml
  - **Validates: Requirements 12.1, 12.5, 12.6**

- [ ]* 12.7 Write property test: Slack Notification Delivery
  - **Feature: mcp-integration, Property 7: Slack Notification Delivery**
  - For any resurrection that completes, a Slack notification should be sent if Slack MCP is configured
  - **Validates: Requirements 3.10, 8.10**

- [ ]* 12.8 Write property test: Error Recovery
  - **Feature: mcp-integration, Property 8: Error Recovery**
  - For any MCP server failure, the workflow should either retry (up to 3 times) or provide a clear error message with fallback options
  - **Validates: Requirements 9.8, 9.9**

- [ ]* 12.9 Write property test: ABAP Business Logic Preservation
  - **Feature: mcp-integration, Property 9: ABAP Business Logic Preservation**
  - For any ABAP code with pricing calculations, the generated CDS model should preserve the calculation logic in service handlers
  - **Validates: Requirements 9.7**

- [ ]* 12.10 Write property test: UI5 Linting Pass
  - **Feature: mcp-integration, Property 10: UI5 Linting Pass**
  - For any generated UI5 application, running the UI5 linter should return zero critical errors
  - **Validates: Requirements 4.4**

- [ ] 13. Write integration tests
- [ ]* 13.1 Test end-to-end resurrection workflow
  - Upload ABAP → Analyze → Plan → Generate → Validate → Deploy
  - Verify all steps complete successfully
  - Verify GitHub repo is created
  - Verify Slack notification is sent
  - _Requirements: 3.1_

- [ ]* 13.2 Test error scenarios
  - Test ABAP Analyzer MCP failure
  - Test GitHub MCP failure with fallback
  - Test Slack MCP failure (should not block workflow)
  - _Requirements: 9.8, 9.9_

- [ ]* 13.3 Test performance
  - Measure end-to-end duration (should be 45-80s)
  - Test concurrent resurrections (5 simultaneous)
  - _Requirements: Performance goals_

- [ ] 14. Polish and optimize
- [ ] 14.1 Optimize MCP call performance
  - Implement caching for CAP docs (1 hour TTL)
  - Implement caching for UI5 API reference (1 hour TTL)
  - Batch GitHub file commits
  - _Requirements: Performance optimization_

- [ ] 14.2 Add loading states and animations
  - Skeleton screens for dashboard
  - Loading animations for workflow steps
  - Toast notifications for actions
  - _Requirements: 1.2, 1.4, 1.5_

- [ ] 14.3 Improve error messages
  - User-friendly error messages
  - Actionable next steps
  - Technical details in expandable section
  - _Requirements: 1.6, 9.8_

- [ ] 14.4 Add accessibility features
  - Keyboard navigation
  - Screen reader support
  - WCAG 2.1 AA compliance
  - _Requirements: 1.10_

- [x] 14.5 Add resurrection detail page
  - Create `/resurrections/[id]` page
  - Display full resurrection details
  - Show quality report
  - Show transformation logs
  - Link to GitHub repo and BAS
  - _Requirements: 14.1, 14.2_

- [ ] 15. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

