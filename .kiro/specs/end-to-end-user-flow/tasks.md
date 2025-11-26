# Implementation Plan: SAP Nova AI Alternative - Resurrection Platform (MVP)

## Overview

This MVP implementation focuses on the core end-to-end resurrection flow: Landing page → ABAP Upload → 5-Step Workflow → GitHub Repository Creation + Custom Code Intelligence.

**MVP Scope:**
- ✅ Halloween-themed landing page with Shadcn UI
- ✅ ABAP file upload
- ✅ 5-step workflow (ANALYZE → PLAN → GENERATE → VALIDATE → DEPLOY)
- ✅ MCP integration (ABAP Analyzer, CAP Generator, UI5 Generator, GitHub)
- ✅ GitHub repository creation with complete CAP project
- ✅ Dashboard with filtering and stats
- ✅ Intelligence services (documentation, dependency graph, redundancy detection, vector search, Q&A)
- 🚧 Intelligence Dashboard UI integration
- ❌ Slack notifications (post-MVP)
- ❌ Advanced UI features (post-MVP)

**Current Status:**
- ✅ Database schema complete
- ✅ API endpoints created
- ✅ Workflow engine implemented
- ✅ Intelligence services available
- 🔧 **CRITICAL**: Make end-to-end flow actually work
- 🔧 **CRITICAL**: Test ABAP upload → Transformation → GitHub repo
- 🔧 Fix: Ensure OpenAI responses parse correctly
- 🔧 Fix: GitHub repo creation with actual token

---

## 🚨 CRITICAL: Make It Work (Priority 1)

- [x] 34. Test end-to-end workflow





  - [x] 34.1 Upload sample ABAP file via API


    - Test with `src/abap-samples/sales-order-processing.abap`
    - Verify ABAPObject created in database
    - _Requirements: 5.1, 5.2_
  
  - [x] 34.2 Create resurrection via API

    - Link ABAP object to resurrection
    - Verify resurrection record created
    - _Requirements: 8.1_
  
  - [x] 34.3 Start transformation workflow

    - Call `/api/resurrections/:id/start`
    - Verify workflow executes all 5 steps
    - Check logs for errors
    - _Requirements: 3.1, 3.7_
  
  - [x] 34.4 Verify transformation output

    - Check ANALYZE step extracts business logic
    - Check PLAN step creates architecture
    - Check GENERATE step creates CAP code
    - Check VALIDATE step runs quality checks
    - Check DEPLOY step creates GitHub repo
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [x] 34.5 Fix any blocking issues


    - OpenAI API key configured
    - GitHub token configured
    - Database connections working
    - Error handling robust
    - _Requirements: All_
- [-] 35. Ensure OpenAI responses parse correctly


- [ ] 35. Ensure OpenAI responses parse correctly

  - [ ] 35.1 Test JSON extraction from markdown


    - Handle ```json code blocks
    - Handle plain JSON responses
    - Add fallback for malformed responses
    - _Requirements: 3.2, 3.3_
  
  - [ ] 35.2 Add response validation
    - Validate required fields present
    - Provide meaningful error messages
    - Log raw responses for debugging
    - _Requirements: 3.8_

- [ ] 36. Make GitHub repo creation work


  - [ ] 36.1 Verify GitHub token
    - Check GITHUB_TOKEN environment variable
    - Test token has repo creation permissions
    - _Requirements: 10.2_
  
  - [ ] 36.2 Test repo creation
    - Create test repository
    - Commit sample CAP files
    - Verify repo accessible
    - _Requirements: 10.3, 10.4_
  
  - [ ] 36.3 Add fallback for manual creation
    - Generate .zip export if GitHub fails
    - Provide git instructions
    - _Requirements: 10.5, 10.6_

---

## 🎯 MVP PHASE 1: Foundation ✅ COMPLETE

- [x] 1. Initialize Next.js project with TypeScript and Tailwind
- [x] 2. Set up Prisma with PostgreSQL database
- [x] 3. Create database schema (User, ABAPObject, Resurrection, TransformationLog, etc.)
- [x] 4. Write property test for database schema
  - _Requirements: 14.1_

---

## 🎯 MVP PHASE 2: MCP Client Infrastructure

- [ ] 8. Build MCP client foundation

  - [x] 8.1 Create base MCP client (`lib/mcp/mcp-client.ts`)





    - Implement connection management
    - Implement request/response handling
    - Add basic error handling and retry logic
    - _Requirements: 2.4, 4.3_

  - [x] 8.2 Create MCP orchestrator (`lib/mcp/orchestrator.ts`)





    - Manage multiple MCP server connections
    - Route requests to appropriate servers
    - Handle MCP server lifecycle
    - _Requirements: 4.1, 4.4_

- [x] 9. Implement MCP client wrappers (MVP: 4 servers only)





  - [x] 9.1 ABAP Analyzer client (`lib/mcp/abap-analyzer-client.ts`)


    - Implement `analyzeCode()` method
    - Parse ABAP syntax and extract metadata
    - _Requirements: 3.2, 5.3, 9.1_

  - [x] 9.2 CAP Generator client (`lib/mcp/cap-generator-client.ts`)


    - Implement `generateCDSModels()` method
    - Implement `generateServiceDefinitions()` method
    - _Requirements: 3.4, 9.2, 9.3_

  - [x] 9.3 UI5 Generator client (`lib/mcp/ui5-generator-client.ts`)


    - Implement `generateFioriElements()` method
    - Generate Fiori UI with manifest.json
    - _Requirements: 3.4, 9.3, 9.4_

  - [x] 9.4 GitHub client (`lib/mcp/github-client.ts`)


    - Implement `createRepository()` method
    - Implement `createOrUpdateFiles()` method
    - _Requirements: 3.6, 10.2, 10.3, 10.4_

---

## 🎯 MVP PHASE 4: 5-Step Workflow Engine

- [x] 10. Build resurrection workflow engine





  - [x] 10.1 Create workflow engine core (`lib/workflow/resurrection-workflow.ts`)


    - Implement `ResurrectionWorkflow` class
    - Implement 5-step execution: ANALYZE → PLAN → GENERATE → VALIDATE → DEPLOY
    - Add status tracking and progress updates
    - Add error handling for each step
    - _Requirements: 3.1, 3.7_

  - [x] 10.2 Implement Step 1: ANALYZE

    - Call ABAP Analyzer MCP with uploaded code
    - Extract business logic, dependencies, metadata
    - Store analysis results in database
    - _Requirements: 3.2, 5.3_

  - [x] 10.3 Implement Step 2: PLAN

    - Use LLM to create transformation plan
    - Generate CDS model designs and architecture
    - Store plan in database
    - _Requirements: 3.3_

  - [x] 10.4 Implement Step 3: GENERATE

    - Call CAP Generator MCP for CDS models and services
    - Call UI5 Generator MCP for Fiori UI
    - Generate supporting files (package.json, mta.yaml, README)
    - _Requirements: 3.4, 9.2, 9.3, 9.4, 9.5_

  - [x] 10.5 Implement Step 4: VALIDATE

    - Validate CDS syntax
    - Validate CAP structure completeness
    - Generate quality report
    - _Requirements: 3.5, 9.9_

  - [x] 10.6 Implement Step 5: DEPLOY

    - Call GitHub MCP to create repository
    - Commit all generated CAP files
    - Generate BAS deep link
    - Update resurrection status to COMPLETED
    - _Requirements: 3.6, 10.2, 10.4, 13.1_

- [x] 11. Create LLM service for planning (`lib/llm/llm-service.ts`)





  - Implement `createTransformationPlan()` method
  - Use OpenAI with SAP domain knowledge
  - _Requirements: 3.3_

---

## 🎯 MVP PHASE 5: API Endpoints

- [x] 12. Create core API routes




  - [x] 12.1 ABAP upload endpoint (`app/api/abap/upload/route.ts`)


    - Handle multipart/form-data file upload
    - Validate ABAP file format (.abap, .txt)
    - Store file temporarily and create ABAPObject record
    - _Requirements: 5.1, 5.2_

  - [x] 12.2 Resurrection endpoints


    - `POST /api/resurrections` - Create new resurrection
    - `POST /api/resurrections/:id/start` - Start 5-step workflow
    - `GET /api/resurrections/:id` - Get resurrection details
    - `GET /api/resurrections/:id/status` - Get workflow status
    - _Requirements: 3.1, 8.1, 8.7_

  - [x] 12.3 Export endpoint (`app/api/resurrections/:id/export/route.ts`)


    - Generate .zip file with complete CAP project
    - Include git instructions in README
    - _Requirements: 10.5, 10.6_

---

## 🎯 MVP PHASE 6: Frontend (Minimal Halloween Theme)

- [x] 13. Create ABAP upload page (`app/upload/page.tsx`)






  - Implement drag-and-drop upload zone with Halloween styling
  - Add file browser option
  - Show validation feedback with spooky messages
  - Display upload progress with ghost animation
  - _Requirements: 5.1, 5.2, 17.4_

- [x] 14. Create resurrection wizard


  - [x] 14.1 Build wizard component (`components/ResurrectionWizard.tsx`)



    - Implement multi-step flow: Select Objects → Configure → Name Project
    - Show progress steps at top with Halloween icons
    - Use Shadcn Dialog and Form components
    - _Requirements: 8.1, 8.2, 17.8_


  - [x] 14.2 Implement progress screen component (`components/ResurrectionProgress.tsx`)






    - Show animated "Resurrection in Progress" with floating ghosts
    - Display live workflow step updates: ANALYZE → PLAN → GENERATE → VALIDATE → DEPLOY
    - Show current step with progress bar (bat-wing style)
    - Display estimated time remaining
    - Integrate with workflow engine progress events
    - _Requirements: 3.7, 8.9, 17.10_

- [x] 15. Create resurrection results page (`app/resurrections/[id]/page.tsx`)





  - Display resurrection details in tombstone-styled cards
  - Show GitHub repo link
  - Show BAS deep link
  - Display transformation metrics (LOC saved, quality score)
  - Add "Export .zip" button
  - _Requirements: 10.1, 10.2, 13.1, 14.1, 17.10_

---

## 🎯 MVP PHASE 7: Testing & Polish

- [ ] 16. Write essential tests
  - [ ]* 16.1 Unit tests for MCP clients
    - Test ABAP Analyzer client
    - Test CAP Generator client
    - Test GitHub client
    - _Requirements: All_

  - [ ]* 16.2 Integration test for end-to-end flow
    - Test complete resurrection lifecycle
    - Upload ABAP → Start workflow → Verify GitHub repo created
    - _Requirements: All_

  - [ ]* 16.3 Property-based tests for correctness properties
    - Test Property 1: Workflow Step Sequence
    - Test Property 9: CAP Package.json Completeness
    - Test Property 11: GitHub Repository File Completeness
    - Test Property 19: Halloween Color Palette Consistency
    - _Requirements: 3.1, 9.5, 10.2, 17.2_

- [x] 17. Final MVP polish





  - [x] 17.1 Add loading states and error messages


    - Implement toast notifications with Halloween theme (haunted errors)
    - Add error boundaries
    - _Requirements: 1.5, 1.6, 17.13_

  - [x] 17.2 Test with sample ABAP code


    - Use sample from `src/abap-samples/sales-order-processing.abap`
    - Verify complete workflow executes successfully
    - Verify GitHub repo is created with all files
    - _Requirements: All_

  - [x] 17.3 Create MVP documentation


    - Write README with setup instructions
    - Document MCP server configuration
    - Document workflow architecture
    - _Requirements: All_

- [x] 18. MVP Checkpoint - Demo ready!



  - [x] 18.1 Complete task 14.2 - Implement progress screen component

    - Create `components/ResurrectionProgress.tsx` with live workflow updates
    - Integrate with workflow engine progress events
    - Add Halloween-themed animations (floating ghosts, progress indicators)
    - _Requirements: 3.7, 8.9, 17.10_
  
  - [x] 18.2 Test end-to-end resurrection flow

    - Upload sample ABAP code from `src/abap-samples/sales-order-processing.abap`
    - Start resurrection wizard and configure project
    - Verify all 5 workflow steps execute successfully
    - Confirm GitHub repository is created with all required files
    - Validate BAS deep link is generated correctly
    - _Requirements: All_
  
  - [x] 18.3 Cross-browser testing

    - Test on Chrome, Firefox, Safari, Edge
    - Verify Halloween theme renders correctly on all browsers
    - Check responsive design on mobile and tablet
    - Validate all animations work smoothly
    - _Requirements: 1.9, 17.1, 17.2_
  
  - [x] 18.4 Prepare demo script and documentation

    - Create step-by-step demo walkthrough
    - Document known limitations and workarounds
    - Prepare troubleshooting guide for common issues
    - Create video demo (optional)
    - _Requirements: All_
  
  - [x] 18.5 Final MVP validation

    - Verify all MVP success criteria are met
    - Ensure all critical paths work without errors
    - Validate Halloween theme is consistent throughout
    - Confirm documentation is complete and accurate
    - **MVP COMPLETE! 🎃🚀**

---

---

## 🎯 CRITICAL: Complete Transformation Examples


- [-] 34. Create complete ABAP-to-CAP transformation examples



  - [x] 34.1 Create example: Sales Order Calculation

    - Input: `src/abap-samples/examples/sales-order-calculation.abap` (complete ABAP function)
    - Output: Complete CAP project with:
      - `db/schema.cds` - CDS entities (SalesOrders, SalesOrderItems, Customers, PricingConditions)
      - `srv/sales-service.cds` - Service definition with calculateSalesOrder function
      - `srv/sales-service.js` - Full implementation with ALL business logic preserved
      - `test/sales-service.test.js` - Unit tests validating business rules
      - `mta.yaml` - Deployment configuration
    - Document transformation in `TRANSFORMATION_EXAMPLES.md`
    - Show side-by-side comparison: ABAP → CAP
    - Highlight preserved business logic: discounts, credit limits, validations
    - _Requirements: 3.4, 9.2, 9.3, 9.7, 12.1_

  - [ ] 34.2 Create example: Customer Credit Check
    - Input: ABAP function with credit limit validation
    - Output: CAP service with preserved validation logic
    - Include test cases for edge cases
    - _Requirements: 9.7, 12.1_

  - [ ] 34.3 Create example: Pricing Procedure
    - Input: ABAP pricing logic with condition types (PR00, K004, K007, MWST)
    - Output: CAP pricing engine with strategy pattern
    - Preserve exact calculation sequence
    - _Requirements: 9.7, 12.1_

  - [ ] 34.4 Create KIRO_IN_ACTION.md demonstration
    - Show complete workflow: Specs → Steering → MCP → Hooks
    - Document how each Kiro feature was used
    - Include actual conversation examples
    - Show validation output from hooks
    - _Requirements: All_

  - [ ] 34.5 Create demo script for judges
    - Step-by-step walkthrough
    - Visual demo instructions
    - Key talking points
    - Before/after comparisons
    - _Requirements: All_

---

## 📦 POST-MVP FEATURES (Future Phases)

These features will be added after MVP is complete and validated:

### Post-MVP Phase 1: Enhanced UX
- [ ] 19. Implement authentication
  - [ ] 19.1 Set up NextAuth.js with GitHub OAuth
  - [ ] 19.2 Add uct API routes with authentication
  - [ ] 19.4 Create user profile page
  - _Requirements: 2.5_

- [x] 20. Build user dashboard





  - [x] 20.1 Create dashboard page with all user resurrections


  - [x] 20.2 Add filtering and sorting capabilities

  - [x] 20.3 Display resurrection statistics and metrics

  - [x] 20.4 Add quick actions (view, export, delete)

  - _Requirements: 14.1, 14.2_

- [ ] 21. Enhance Halloween theme
  - [ ] 21.1 Add fog effect animations
  - [ ] 21.2 Implement pulsing pumpkin animations
  - [ ] 21.3 Add sound effects (optional)fessional)
  - _Requirements: 17.5, 17.9_

- [ ] 22. Improve accessibility and responsiveness
  - [ ] 22.1 Implement WCAG 2.1 AA compliance
  - [ ] 22.2 Add keyboard navigation support
  - [ ] 22.3 Optimize for mobile and tablet
  - [ ] 22.4 Add screen reader support
  - _Requirements: 1.9, 1.10_
igence)
- [ ] 23. Set up vector search infrastructure
  - [ ] 23.1 Integrate Pinecone or Weaviate vector database
  - [ ] 23.2 Create embedding generation service
  - [ ] 23.3 Implement semantic search API
  - [ ] 23.4 Add vector storage for ABAP objects
  - _Requirements: 2.6, 5.4, 6.5_

- [x] 24. Build Intelligence Dashboard





  - [x] 24.1 Create dashboard page with key metrics


  - [x] 24.2 Implement D3.js dependency graph visualization


  - [x] 24.3 Add redundancy detection and display


  - [x] 24.4 Show fit-to-standard recommendations


  - [x] 24.5 Add interactive filtering and drill-down


  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7_

- [ ] 25. Implement Q&A interface with RAG
  - [ ] 25.1 Create chat interface component
  - [ ] 25.2 Implement RAG (Retrieval Augmented Generation)
  - [ ] 25.3 Add confidence scoring for answers
  - [ ] 25.4 Display source references
  - [ ] 25.5 Add suggested starter questions
  - [ ] 25.6 Implement conversation history
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 26. Build redundancy detection service




  - [x] 26.1 Implement code similarity algorithms


  - [x] 26.2 Create redundancy detection API


  - [x] 26.3 Generate consolidation recommendations


  - [x] 26.4 Calculate potential savings


  - _Requirements: 6.6_
-


- [x] 27. Implement fit-to-standard recommendations



  - [x] 27.1 Build SAP standard knowledge base


  - [x] 27.2 Create pattern matching service


  - [x] 27.3 Generate standard alternative recommendations


  - [x] 27.4 Add implementation guides


  - _Requirements: 6.7_

### Post-MVP Phase 3: Collaboration & Notifications
- [ ] 28. Integrate Slack MCP (already configured)
  - [ ] 28.1 Enable Slack notifications for resurrection events
  - [ ] 28.2 Add Slack channel configuration
  - [ ] 28.3 Implement threaded conversations
  - [ ] 28.4 Add interactive Slack buttons
  - _Requirements: 4.9, 5.8, 6.10, 8.10, 10.11_

- [x] 29. Implement Kiro Hooks automation





  - [x] 29.1 Create hook configuration UI


  - [x] 29.2 Implement hook execution engine


  - [x] 29.3 Add quality validation hooks


  - [x] 29.4 Create CI/CD setup hooks


  - [x] 29.5 Add deployment success hooks


  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_

- [ ] 30. Add batch resurrection processing
  - [ ] 30.1 Create batch upload interface
  - [ ] 30.2 Implement parallel processing
  - [ ] 30.3 Add batch progress tracking
  - [ ] 30.4 Generate batch summary reports
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.9, 16.10_

###-Post-MVP Phase 4: Advanced Features
- [x] 31. Integrate Kiro Specs for complex resurrections

- [x] 31. Integrate Kiro Specs for complex resurrections



  - [x] 31.1 Add "Plan with Kiro spec" option


  - [x] 31.2 Generate requirements.md from ABAP analysis


  - [x] 31.3 Create design.md with AI assistance

  - [x] 31.4 Generate tasks.md with MCP references

  - [x] 31.5 Track spec completion progress


  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10_

- [ ] 32. Automate CI/CD and deployment
  - [ ] 32.1 Generate GitHub Actions workflows
  - [ ] 32.2 Add SAP BTP deployment automation
  - [ ] 32.3 Configure SAP BAS workspace
  - [ ] 32.4 Add deployment health checks
  - _Requirements: 10.10, 13.7, 18.3, 18.4, 18.5, 18.6_

- [ ] 33. Implement comprehensive testing
  - [ ]* 33.1 Write property-based tests for all correctness properties
    - Use fast-check framework
    - Run 100+ iterations per property
    - _Requirements: All_
  
  - [ ]* 33.2 Add integration tests for MCP servers
    - Test ABAP Analyzer integration
    - Test CAP Generator integration
    - Test UI5 Generator integration
    - Test GitHub MCP integration
    - Test Slack MCP integration
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 33.3 Implement end-to-end testing with Playwright
    - Test complete user flows
    - Test error scenarios
    - Test edge cases
    - Add visual regression testing
    - _Requirements: All_    - **Property 1-21**: Implement all design document pro
### Post-MVP Phase 2: Intelligence Features (Custom Code Int
- [ ] Quality validation hooks
- [ ] Property-based testing for all correctness properties

---

## 📝 Notes

**MVP Success Criteria:**
- ✅ User can upload ABAP code
- ✅ System executes 5-step workflow automatically
- ✅ System creates GitHub repository with complete CAP project
- ✅ User can download .zip export
- ✅ Halloween theme is applied throughout
- ✅ End-to-end flow completes in < 5 minutes

**Technical Debt to Address Post-MVP:**
- Add comprehensive error handling
- Implement retry logic for MCP calls
- Add rate limiting for API endpoints
- Implement proper logging and monitoring
- Add database migrations for schema changes
- Optimize performance for large ABAP files
- Add WebSocket support for real-time progress updates

**MCP Servers Required for MVP:**
1. ABAP Analyzer MCP (parsing and analysis)
2. SAP CAP Generator MCP (CDS models and services)
3. SAP UI5 Generator MCP (Fiori UI)
4. GitHub MCP (repository creation)

**MCP Servers for Post-MVP:**
5. Slack MCP (notifications)
