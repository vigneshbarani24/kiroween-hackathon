# Requirements Document

## Introduction

The resurrection platform workflow completes all steps (ANALYZE, PLAN, GENERATE, VALIDATE) successfully, but the DEPLOY step fails when attempting to create a GitHub repository. The workflow is designed to handle this gracefully by marking the resurrection as completed with a local file path, but the error messages clutter the logs and the user doesn't get the full GitHub deployment experience.

## Glossary

- **Resurrection Platform**: The SAP ABAP to CAP transformation platform
- **Hybrid Workflow**: The workflow engine that orchestrates ABAP analysis and CAP generation
- **GitHub Deployment**: The process of creating a GitHub repository and pushing generated CAP code
- **GITHUB_TOKEN**: Personal Access Token for GitHub API authentication

## Requirements

### Requirement 1

**User Story:** As a platform user, I want the GitHub deployment step to work reliably, so that my resurrected CAP projects are automatically pushed to GitHub repositories.

#### Acceptance Criteria

1. WHEN the workflow reaches the DEPLOY step THEN the system SHALL validate the GITHUB_TOKEN before attempting API calls
2. WHEN the GITHUB_TOKEN is missing or invalid THEN the system SHALL provide clear error messages to the user
3. WHEN the GITHUB_TOKEN is valid THEN the system SHALL successfully create a GitHub repository
4. WHEN the GitHub repository is created THEN the system SHALL push all generated CAP files to the repository
5. WHEN the deployment completes THEN the system SHALL store the GitHub URL and BAS deep link in the database

### Requirement 2

**User Story:** As a platform administrator, I want clear visibility into deployment failures, so that I can troubleshoot GitHub integration issues.

#### Acceptance Criteria

1. WHEN GitHub deployment fails THEN the system SHALL log the specific error reason
2. WHEN the GITHUB_TOKEN is invalid THEN the system SHALL indicate token validation failure
3. WHEN the GitHub API returns an error THEN the system SHALL log the HTTP status code and error message
4. WHEN deployment fails THEN the system SHALL still mark the resurrection as completed with local file path
5. WHEN viewing resurrection details THEN the system SHALL display deployment status and error messages

### Requirement 3

**User Story:** As a developer, I want proper environment variable configuration, so that GitHub tokens are loaded correctly.

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL load environment variables from .env.local
2. WHEN multiple GITHUB_TOKEN entries exist THEN the system SHALL use the first valid entry
3. WHEN the GITHUB_TOKEN has formatting issues THEN the system SHALL sanitize and validate the token
4. WHEN the token is missing THEN the system SHALL log a warning but continue with local-only deployment
5. WHEN the token is present THEN the system SHALL validate it has required GitHub API permissions

### Requirement 4

**User Story:** As a platform user, I want to see deployment progress in real-time, so that I know what's happening during the resurrection process.

#### Acceptance Criteria

1. WHEN the DEPLOY step starts THEN the system SHALL update the UI with "Deploying to GitHub" status
2. WHEN creating the GitHub repository THEN the system SHALL show "Creating repository..." progress
3. WHEN pushing files THEN the system SHALL show "Pushing files (X/Y)..." progress
4. WHEN deployment completes THEN the system SHALL show the GitHub URL and BAS link
5. WHEN deployment fails THEN the system SHALL show the error message and local file path fallback
