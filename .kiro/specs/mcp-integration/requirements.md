# Requirements Document: MCP Server Integration & Workflow

## Introduction

This document defines the requirements for making the 5 configured MCP servers (ABAP Analyzer, SAP CAP, SAP UI5, GitHub, Slack) work properly and integrating them into the resurrection workflow. The goal is to replace fake/mock implementations with real MCP server calls that provide actual ABAP parsing, CAP generation, and automation capabilities.

## Glossary

- **MCP (Model Context Protocol)**: Protocol for connecting AI agents to specialized servers
- **ABAP Analyzer MCP**: Python-based server that parses ABAP code and extracts metadata
- **SAP CAP MCP**: Node.js server that provides CAP patterns, templates, and generation guidance
- **SAP UI5 MCP**: Node.js server that provides UI5 component templates and Fiori patterns
- **GitHub MCP**: Python-based server for automating GitHub repository operations
- **Slack MCP**: Node.js server for sending team notifications
- **MCP Tool**: A callable function exposed by an MCP server (e.g., `parse_abap`, `create_repository`)
- **MCP Context**: Additional information passed to MCP servers (ABAP code, requirements, domain knowledge)
- **Resurrection Workflow**: Multi-step process that transforms ABAP to CAP using MCP servers
- **Real Workflow**: Implementation that calls actual MCP servers (not fake/mock data)
- **Hybrid Workflow**: Temporary implementation using CAP CLI and GitHub API while MCP servers are being fixed

## Requirements

### Requirement 1: MCP Server Health & Connectivity

**User Story:** As a platform administrator, I want to verify all MCP servers are running and accessible, so that the workflow can use them reliably.

#### Acceptance Criteria

1. WHEN the platform starts THEN the system SHALL check connectivity to all 5 MCP servers
2. WHEN an MCP server is unreachable THEN the system SHALL log detailed error with server name and connection details
3. WHEN MCP health check runs THEN the system SHALL call a test tool from each server to verify functionality
4. WHEN all servers are healthy THEN the system SHALL display green status indicators in admin dashboard
5. WHEN a server fails health check THEN the system SHALL display red status with error message and retry button
6. WHEN MCP configuration changes THEN the system SHALL reload connections without requiring platform restart
7. WHEN environment variables are missing THEN the system SHALL provide clear error: "GITHUB_TOKEN not set for GitHub MCP"
8. WHEN Python MCP servers fail THEN the system SHALL check Python version and suggest: "Requires Python 3.8+"
9. WHEN Node MCP servers fail THEN the system SHALL check if npx can access packages
10. WHEN MCP servers are working THEN the system SHALL log successful connection with available tools list

### Requirement 2: ABAP Analyzer MCP Integration

**User Story:** As a developer, I want the ABAP Analyzer MCP to parse real ABAP code and extract accurate metadata, so that resurrections are based on actual code structure.

#### Acceptance Criteria

1. WHEN ABAP code is uploaded THEN the system SHALL call `parse_abap` tool from ABAP Analyzer MCP
2. WHEN `parse_abap` is called THEN the system SHALL pass complete ABAP source code as parameter
3. WHEN parsing completes THEN the system SHALL receive structured JSON with: program name, type, tables used, function calls, data structures
4. WHEN `detect_sap_patterns` is called THEN the system SHALL receive identified patterns: pricing logic, authorization checks, batch processing
5. WHEN `extract_data_model` is called THEN the system SHALL receive entity definitions with fields, types, and relationships
6. WHEN ABAP Analyzer returns results THEN the system SHALL store parsed metadata in database for later use
7. WHEN parsing fails THEN the system SHALL receive error with line number and syntax issue description
8. WHEN multiple ABAP files are processed THEN the system SHALL call MCP in parallel with rate limiting
9. WHEN ABAP Analyzer is unavailable THEN the system SHALL display error: "ABAP Analyzer MCP not responding" with fallback option
10. WHEN parsing succeeds THEN the system SHALL log: "✅ Parsed Z_PRICING: 450 LOC, 3 tables, 2 function calls"

### Requirement 3: SAP CAP MCP Integration

**User Story:** As a developer, I want the SAP CAP MCP to provide accurate CAP patterns and templates, so that generated code follows SAP best practices.

#### Acceptance Criteria

1. WHEN CAP generation starts THEN the system SHALL call `cap_lookup_pattern` to find matching CAP patterns for ABAP logic
2. WHEN `cap_lookup_pattern` is called THEN the system SHALL pass business logic description and receive CAP pattern recommendations
3. WHEN `cap_validate_cds` is called THEN the system SHALL pass generated CDS code and receive validation results
4. WHEN `cap_get_service_template` is called THEN the system SHALL receive complete service template with annotations
5. WHEN CAP MCP returns patterns THEN the system SHALL use them to guide CDS model generation
6. WHEN validation fails THEN the system SHALL receive specific errors: "Missing @readonly annotation on calculated field"
7. WHEN CAP MCP is unavailable THEN the system SHALL fall back to using `cds init` and built-in templates
8. WHEN multiple patterns match THEN the system SHALL rank by relevance and present top 3 options
9. WHEN CAP generation completes THEN the system SHALL validate output using `cap_validate_cds`
10. WHEN CAP MCP succeeds THEN the system SHALL log: "✅ Generated CDS model using 'managed-service' pattern"

### Requirement 4: SAP UI5 MCP Integration

**User Story:** As a developer, I want the SAP UI5 MCP to provide Fiori templates and UI5 components, so that generated UIs follow SAP design guidelines.

#### Acceptance Criteria

1. WHEN UI generation starts THEN the system SHALL call `ui5_get_component` to get base component structure
2. WHEN `ui5_lookup_control` is called THEN the system SHALL pass UI requirements and receive recommended UI5 controls
3. WHEN `ui5_generate_view` is called THEN the system SHALL receive complete XML view with proper control hierarchy
4. WHEN Fiori Elements is selected THEN the system SHALL use UI5 MCP to get List Report or Object Page templates
5. WHEN Freestyle UI5 is selected THEN the system SHALL use UI5 MCP to get custom view templates
6. WHEN UI5 MCP returns components THEN the system SHALL validate against UI5 version compatibility
7. WHEN UI5 MCP is unavailable THEN the system SHALL fall back to basic Fiori Elements template
8. WHEN UI generation completes THEN the system SHALL validate manifest.json structure
9. WHEN UI5 controls are selected THEN the system SHALL ensure proper data binding to CDS entities
10. WHEN UI5 MCP succeeds THEN the system SHALL log: "✅ Generated Fiori List Report with sap.m.Table"

### Requirement 5: GitHub MCP Integration

**User Story:** As a developer, I want the GitHub MCP to automate repository creation and file commits, so that resurrection outputs are automatically stored in GitHub.

#### Acceptance Criteria

1. WHEN resurrection completes THEN the system SHALL call `create_repository` from GitHub MCP
2. WHEN `create_repository` is called THEN the system SHALL pass repo name, description, and visibility (public/private)
3. WHEN repository is created THEN the system SHALL receive repo URL and clone URL
4. WHEN files need to be committed THEN the system SHALL call `create_or_update_file` for each generated file
5. WHEN `push_files` is called THEN the system SHALL commit all files in a single batch operation
6. WHEN README needs creation THEN the system SHALL call `create_or_update_file` with markdown content
7. WHEN topics need to be added THEN the system SHALL call `add_repository_topics` with: sap-cap, abap-resurrection, clean-core
8. WHEN GitHub MCP fails THEN the system SHALL provide export option: "Download as .zip for manual git push"
9. WHEN GITHUB_TOKEN is invalid THEN the system SHALL display clear error: "GitHub authentication failed - check token"
10. WHEN GitHub operations succeed THEN the system SHALL log: "✅ Created repo: resurrection-sd-pricing (https://github.com/...)"

### Requirement 6: Slack MCP Integration

**User Story:** As a team member, I want Slack notifications for resurrection events, so that the team stays informed about progress and completions.

#### Acceptance Criteria

1. WHEN resurrection starts THEN the system SHALL call `slack_post_message` with: "🚀 New resurrection: sd-pricing-logic"
2. WHEN resurrection completes THEN the system SHALL call `slack_post_message` with: "✅ Resurrection complete: [repo link]"
3. WHEN resurrection fails THEN the system SHALL call `slack_post_message` with: "❌ Resurrection failed: [error details]"
4. WHEN batch processing runs THEN the system SHALL send progress updates: "Batch: 5/10 completed"
5. WHEN quality validation fails THEN the system SHALL send alert: "⚠️ Quality check failed for [project]"
6. WHEN deployment succeeds THEN the system SHALL send: "🎉 Deployed to BTP: [app URL]"
7. WHEN Slack MCP is unavailable THEN the system SHALL log notifications locally without blocking workflow
8. WHEN SLACK_BOT_TOKEN is invalid THEN the system SHALL display warning but continue workflow
9. WHEN Slack channel is configured THEN the system SHALL post to specified channel (default: #resurrections)
10. WHEN Slack notifications succeed THEN the system SHALL log: "✅ Slack notification sent to #resurrections"

### Requirement 7: Real Workflow Implementation

**User Story:** As a developer, I want the resurrection workflow to use real MCP server calls, so that transformations are accurate and not based on fake data.

#### Acceptance Criteria

1. WHEN resurrection workflow runs THEN the system SHALL use RealResurrectionWorkflow class (not fake/hybrid)
2. WHEN Step 1 (Analyze) executes THEN the system SHALL call ABAP Analyzer MCP `parse_abap` and `extract_data_model`
3. WHEN Step 2 (Plan) executes THEN the system SHALL use parsed metadata to create transformation plan
4. WHEN Step 3 (Generate) executes THEN the system SHALL call SAP CAP MCP and SAP UI5 MCP for code generation
5. WHEN Step 4 (Validate) executes THEN the system SHALL call CAP MCP `cap_validate_cds` to check generated code
6. WHEN Step 5 (Deploy) executes THEN the system SHALL call GitHub MCP to create repository and commit files
7. WHEN any MCP call fails THEN the system SHALL pause workflow and display error with retry option
8. WHEN workflow completes THEN the system SHALL call Slack MCP to send completion notification
9. WHEN workflow is in progress THEN the system SHALL stream real-time updates from MCP servers to UI
10. WHEN workflow uses MCP THEN the system SHALL log all MCP calls with timestamps and parameters for debugging

### Requirement 8: MCP Context & Domain Knowledge

**User Story:** As a developer, I want MCP servers to receive full context (ABAP code, SAP domain knowledge, requirements), so that they make informed decisions.

#### Acceptance Criteria

1. WHEN calling ABAP Analyzer THEN the system SHALL pass complete ABAP source code (not truncated)
2. WHEN calling CAP MCP THEN the system SHALL pass parsed ABAP metadata and business logic description
3. WHEN calling UI5 MCP THEN the system SHALL pass CDS entity definitions and UI requirements
4. WHEN calling any MCP THEN the system SHALL include SAP domain knowledge from steering documents
5. WHEN context is large THEN the system SHALL chunk appropriately while maintaining coherence
6. WHEN MCP needs clarification THEN the system SHALL provide interactive prompts to user
7. WHEN multiple ABAP files are related THEN the system SHALL pass dependency information to MCP
8. WHEN business rules are complex THEN the system SHALL pass validation logic to ensure preservation
9. WHEN MCP returns results THEN the system SHALL validate completeness before proceeding
10. WHEN context is passed THEN the system SHALL log context size and key elements for debugging

### Requirement 9: MCP Error Handling & Fallbacks

**User Story:** As a developer, I want graceful error handling when MCP servers fail, so that the workflow doesn't completely break.

#### Acceptance Criteria

1. WHEN an MCP server is unreachable THEN the system SHALL retry 3 times with exponential backoff
2. WHEN retries fail THEN the system SHALL offer fallback: "Use hybrid workflow (CAP CLI + GitHub API)?"
3. WHEN ABAP Analyzer fails THEN the system SHALL offer: "Upload pre-parsed metadata JSON"
4. WHEN CAP MCP fails THEN the system SHALL fall back to `cds init` with basic template
5. WHEN UI5 MCP fails THEN the system SHALL fall back to minimal Fiori Elements template
6. WHEN GitHub MCP fails THEN the system SHALL offer: "Export as .zip for manual git push"
7. WHEN Slack MCP fails THEN the system SHALL continue workflow and log notifications locally
8. WHEN errors occur THEN the system SHALL display user-friendly message with technical details in expandable section
9. WHEN fallback is used THEN the system SHALL log: "⚠️ Using fallback: CAP CLI (MCP unavailable)"
10. WHEN workflow recovers THEN the system SHALL resume from last successful step

### Requirement 10: MCP Testing & Validation

**User Story:** As a developer, I want to test MCP servers independently, so that I can verify they work before using them in the workflow.

#### Acceptance Criteria

1. WHEN admin opens MCP dashboard THEN the system SHALL display "Test" button for each MCP server
2. WHEN "Test ABAP Analyzer" is clicked THEN the system SHALL call `parse_abap` with sample ABAP code
3. WHEN "Test SAP CAP" is clicked THEN the system SHALL call `cap_lookup_pattern` with sample business logic
4. WHEN "Test SAP UI5" is clicked THEN the system SHALL call `ui5_get_component` with sample requirements
5. WHEN "Test GitHub" is clicked THEN the system SHALL call GitHub API to verify token (without creating repo)
6. WHEN "Test Slack" is clicked THEN the system SHALL send test message: "🧪 MCP test from Resurrection Platform"
7. WHEN test succeeds THEN the system SHALL display: "✅ ABAP Analyzer: parse_abap returned 15 fields"
8. WHEN test fails THEN the system SHALL display: "❌ GitHub MCP: 401 Unauthorized - check GITHUB_TOKEN"
9. WHEN all tests pass THEN the system SHALL enable "Run Real Workflow" button
10. WHEN tests are run THEN the system SHALL log results for troubleshooting

### Requirement 11: MCP Configuration Management

**User Story:** As a platform administrator, I want to manage MCP server configuration easily, so that I can update settings without editing JSON files manually.

#### Acceptance Criteria

1. WHEN admin opens MCP settings THEN the system SHALL display form with all 5 MCP servers
2. WHEN editing a server THEN the system SHALL show fields: command, args, environment variables, enabled/disabled
3. WHEN environment variables are edited THEN the system SHALL validate format: ${VAR_NAME}
4. WHEN saving configuration THEN the system SHALL write to `.kiro/settings/mcp.json`
5. WHEN configuration is saved THEN the system SHALL reload MCP connections without restart
6. WHEN adding a new MCP server THEN the system SHALL provide template with required fields
7. WHEN disabling a server THEN the system SHALL set `disabled: true` and show warning: "Workflow will use fallback"
8. WHEN auto-approve tools are configured THEN the system SHALL allow selecting from available tools list
9. WHEN configuration is invalid THEN the system SHALL display validation errors before saving
10. WHEN configuration is exported THEN the system SHALL provide downloadable JSON for backup

### Requirement 12: MCP Logging & Debugging

**User Story:** As a developer, I want detailed logs of all MCP interactions, so that I can debug issues when transformations fail.

#### Acceptance Criteria

1. WHEN any MCP tool is called THEN the system SHALL log: timestamp, server name, tool name, parameters (truncated if large)
2. WHEN MCP returns results THEN the system SHALL log: response size, key fields, execution time
3. WHEN MCP errors occur THEN the system SHALL log: full error message, stack trace, retry attempts
4. WHEN workflow runs THEN the system SHALL create log file: `logs/resurrection-{id}-{timestamp}.log`
5. WHEN logs are viewed THEN the system SHALL provide UI with filtering: by server, by tool, by status (success/error)
6. WHEN logs are searched THEN the system SHALL support text search across all log entries
7. WHEN logs are exported THEN the system SHALL provide downloadable file for support tickets
8. WHEN debug mode is enabled THEN the system SHALL log full request/response payloads (not truncated)
9. WHEN logs are old THEN the system SHALL archive logs older than 30 days
10. WHEN logs are displayed THEN the system SHALL use syntax highlighting for JSON responses

### Requirement 13: MCP Performance Optimization

**User Story:** As a developer, I want MCP calls to be fast and efficient, so that resurrections complete quickly.

#### Acceptance Criteria

1. WHEN multiple ABAP files are processed THEN the system SHALL call ABAP Analyzer MCP in parallel (max 5 concurrent)
2. WHEN MCP responses are large THEN the system SHALL stream results instead of waiting for complete response
3. WHEN MCP calls are repeated THEN the system SHALL cache results for 1 hour
4. WHEN cache is used THEN the system SHALL log: "✅ Using cached result for parse_abap(Z_PRICING)"
5. WHEN MCP servers are slow THEN the system SHALL display progress indicator with elapsed time
6. WHEN timeout occurs THEN the system SHALL cancel request after 60 seconds and show error
7. WHEN network is slow THEN the system SHALL compress large payloads before sending to MCP
8. WHEN MCP is called frequently THEN the system SHALL implement rate limiting to avoid overwhelming servers
9. WHEN performance is measured THEN the system SHALL track average response time per MCP server
10. WHEN performance degrades THEN the system SHALL alert: "⚠️ ABAP Analyzer response time: 15s (usually 2s)"

### Requirement 14: MCP Documentation & Help

**User Story:** As a new developer, I want clear documentation on how MCP servers work, so that I can understand and troubleshoot the workflow.

#### Acceptance Criteria

1. WHEN help is accessed THEN the system SHALL display MCP overview with architecture diagram
2. WHEN a specific MCP server is selected THEN the system SHALL show: purpose, available tools, example calls
3. WHEN tool documentation is viewed THEN the system SHALL show: parameters, return values, example usage
4. WHEN troubleshooting guide is opened THEN the system SHALL provide common errors and solutions
5. WHEN setup instructions are needed THEN the system SHALL provide step-by-step guide for each MCP server
6. WHEN Python MCP setup is shown THEN the system SHALL include: Python version, pip install, test command
7. WHEN Node MCP setup is shown THEN the system SHALL include: npx usage, package names, test command
8. WHEN GitHub token setup is shown THEN the system SHALL include: token creation, required scopes, security best practices
9. WHEN Slack setup is shown THEN the system SHALL include: bot creation, token generation, channel configuration
10. WHEN documentation is updated THEN the system SHALL version it and show "Last updated: 2024-11-26"

### Requirement 15: MCP Server Local Testing

**User Story:** As a developer, I want to test each MCP server locally and independently before integrating into the workflow, so that I understand what they actually do and verify they work.

#### Acceptance Criteria

1. WHEN testing ABAP Analyzer THEN the system SHALL run it locally with sample ABAP code and display parsed output
2. WHEN testing SAP CAP MCP THEN the system SHALL call available tools and display what patterns/templates it provides
3. WHEN testing SAP UI5 MCP THEN the system SHALL call available tools and display what components it can generate
4. WHEN testing GitHub MCP THEN the system SHALL verify authentication and list available operations
5. WHEN testing Slack MCP THEN the system SHALL send a test message to verify connectivity
6. WHEN local tests pass THEN the system SHALL document what each MCP server actually returns
7. WHEN local tests fail THEN the system SHALL provide clear error messages and setup instructions
8. WHEN MCP servers are verified THEN the system SHALL create integration plan based on actual capabilities
9. WHEN testing is complete THEN the system SHALL update workflow to use verified MCP tools
10. WHEN MCP servers work locally THEN the system SHALL proceed with workflow integration

### Requirement 16: Mock Data Generation

**User Story:** As a developer, I want the platform to generate realistic mock data for each resurrection, so that the CAP apps look good and demonstrate functionality with sample data.

#### Acceptance Criteria

1. WHEN ABAP code is analyzed THEN the system SHALL identify data structures and generate matching mock data
2. WHEN CDS entities are created THEN the system SHALL generate CSV files in `db/data/` with sample records
3. WHEN mock data is generated THEN the system SHALL create 10-50 realistic records per entity
4. WHEN entities have relationships THEN the system SHALL ensure referential integrity in mock data
5. WHEN ABAP contains business logic THEN the system SHALL generate data that exercises that logic
6. WHEN mock data is created THEN the system SHALL use realistic values (names, dates, amounts) not "test1", "test2"
7. WHEN CAP app is deployed THEN the system SHALL include mock data so UI shows populated tables
8. WHEN mock data is insufficient THEN the system SHALL provide instructions for adding more data
9. WHEN data privacy is needed THEN the system SHALL use faker libraries to generate synthetic data
10. WHEN mock data is generated THEN the system SHALL document data model in README with sample queries

### Requirement 17: MCP Server Development & Extension

**User Story:** As a platform developer, I want to add new MCP servers easily, so that the platform can support additional capabilities.

#### Acceptance Criteria

1. WHEN adding a new MCP server THEN the system SHALL support standard MCP protocol (stdio, SSE, or HTTP)
2. WHEN a new server is configured THEN the system SHALL auto-discover available tools via MCP introspection
3. WHEN tools are discovered THEN the system SHALL display them in admin dashboard with descriptions
4. WHEN a custom MCP server is added THEN the system SHALL validate it implements required MCP methods
5. WHEN MCP server code is updated THEN the system SHALL support hot-reload without platform restart
6. WHEN developing MCP servers THEN the system SHALL provide test harness for local development
7. WHEN MCP protocol changes THEN the system SHALL support multiple protocol versions
8. WHEN community MCP servers exist THEN the system SHALL provide marketplace/registry for discovery
9. WHEN MCP servers are shared THEN the system SHALL support importing configuration from URL
10. WHEN extending platform THEN the system SHALL provide TypeScript types for MCP client integration
