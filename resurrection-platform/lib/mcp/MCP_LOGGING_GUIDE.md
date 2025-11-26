# MCP Logging and Debugging Guide

## Overview

The MCP Logging system provides comprehensive logging and debugging capabilities for all Model Context Protocol (MCP) server interactions in the Resurrection Platform.

**Requirements Implemented:**
- 12.1: Log all MCP calls with timestamp, server, tool, params
- 12.2: Log responses and errors
- 12.5: Display logs with filtering
- 12.6: Search log content
- 12.7: Export logs as JSON
- 12.8: Debug mode for full payloads
- 12.9: Archive old logs

## Architecture

### Components

1. **MCPLogger Service** (`lib/mcp/mcp-logger.ts`)
   - Core logging service
   - Database persistence
   - In-memory caching
   - Debug mode support

2. **API Routes**
   - `/api/mcp/logs` - Get all logs with filtering
   - `/api/resurrections/[id]/logs` - Get logs for specific resurrection
   - `/api/mcp/debug` - Toggle debug mode

3. **UI Components**
   - `MCPLogsViewer` - Display and filter logs
   - `MCPDebugToggle` - Toggle debug mode

## Usage

### Logging MCP Calls

```typescript
import { mcpLogger } from '@/lib/mcp/mcp-logger';

// Log a successful MCP call
await mcpLogger.logCall(
  resurrectionId,
  'abap-analyzer',
  'analyzeCode',
  { code: abapCode },
  { businessLogic: [...], tables: [...] },
  undefined,
  1234 // duration in ms
);

// Log a failed MCP call
await mcpLogger.logCall(
  resurrectionId,
  'github',
  'createRepository',
  { name: 'my-repo' },
  undefined,
  'Authentication failed: Invalid token',
  567
);
```

### Fetching Logs

```typescript
// Get logs for a specific resurrection
const logs = await mcpLogger.getLogsForResurrection(resurrectionId);

// Get all logs with filtering
const logs = await mcpLogger.getAllLogs({
  serverName: 'abap-analyzer',
  status: 'error',
  limit: 50
});

// Search logs
const logs = await mcpLogger.searchLogs('authentication', {
  serverName: 'github'
});

// Get statistics
const stats = await mcpLogger.getLogStats(resurrectionId);
```

### Debug Mode

Debug mode enables full request/response payload logging without truncation.

**Enable via Environment Variable:**
```bash
MCP_DEBUG_MODE=true
```

**Enable via API:**
```typescript
// Enable debug mode
await fetch('/api/mcp/debug', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ enabled: true })
});

// Check debug mode status
const response = await fetch('/api/mcp/debug');
const { debugMode } = await response.json();
```

**Enable via Code:**
```typescript
import { mcpLogger } from '@/lib/mcp/mcp-logger';

mcpLogger.setDebugMode(true);
```

## API Reference

### GET /api/mcp/logs

Get all MCP logs with optional filtering.

**Query Parameters:**
- `resurrectionId` - Filter by resurrection ID
- `serverName` - Filter by MCP server name
- `toolName` - Filter by tool name
- `status` - Filter by status (success/error)
- `limit` - Maximum number of logs (default: 100)
- `offset` - Pagination offset (default: 0)
- `startDate` - Filter logs after this date
- `endDate` - Filter logs before this date
- `search` - Search term for content search
- `export` - Set to "json" to export logs

**Example:**
```bash
# Get all logs
curl http://localhost:3000/api/mcp/logs

# Get error logs from GitHub MCP
curl "http://localhost:3000/api/mcp/logs?serverName=github&status=error"

# Export logs as JSON
curl "http://localhost:3000/api/mcp/logs?export=json" > logs.json
```

### GET /api/resurrections/[id]/logs

Get MCP logs for a specific resurrection.

**Query Parameters:**
Same as `/api/mcp/logs` except `resurrectionId` is in the URL path.

**Example:**
```bash
# Get logs for resurrection
curl http://localhost:3000/api/resurrections/abc123/logs

# Export resurrection logs
curl "http://localhost:3000/api/resurrections/abc123/logs?export=json" > resurrection-logs.json
```

### GET /api/mcp/debug

Get current debug mode status.

**Response:**
```json
{
  "success": true,
  "debugMode": false,
  "message": "Debug mode is disabled - payloads are truncated for performance"
}
```

### POST /api/mcp/debug

Toggle debug mode.

**Request Body:**
```json
{
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "debugMode": true,
  "message": "Debug mode enabled - full request/response payloads will be logged"
}
```

## UI Components

### MCPLogsViewer

Display and filter MCP logs.

**Props:**
- `resurrectionId?: string` - Show logs for specific resurrection
- `autoRefresh?: boolean` - Enable auto-refresh (default: false)
- `refreshInterval?: number` - Refresh interval in ms (default: 5000)

**Example:**
```tsx
import { MCPLogsViewer } from '@/components/MCPLogsViewer';

// Show all logs with auto-refresh
<MCPLogsViewer autoRefresh={true} refreshInterval={10000} />

// Show logs for specific resurrection
<MCPLogsViewer resurrectionId="abc123" />
```

**Features:**
- Real-time filtering by server, tool, status
- Search across all log content
- Expandable log entries showing full details
- Export logs as JSON
- Statistics dashboard
- Auto-refresh support

### MCPDebugToggle

Toggle debug mode with visual feedback.

**Example:**
```tsx
import { MCPDebugToggle } from '@/components/MCPDebugToggle';

<MCPDebugToggle />
```

**Features:**
- Current debug mode status
- One-click toggle
- Performance warning when enabled
- Environment variable documentation

## Database Schema

```sql
CREATE TABLE mcp_logs (
  id VARCHAR PRIMARY KEY,
  resurrection_id VARCHAR REFERENCES resurrections(id),
  server_name VARCHAR NOT NULL,
  tool_name VARCHAR NOT NULL,
  params JSONB,
  response JSONB,
  error TEXT,
  duration_ms INTEGER,
  called_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mcp_logs_resurrection ON mcp_logs(resurrection_id);
CREATE INDEX idx_mcp_logs_server ON mcp_logs(server_name);
CREATE INDEX idx_mcp_logs_called_at ON mcp_logs(called_at);
```

## Performance Considerations

### Truncation

By default, request/response payloads are truncated to 1000 characters to avoid:
- Large database storage
- Slow query performance
- Memory issues

**Truncated Format:**
```json
{
  "_truncated": true,
  "_originalLength": 15234,
  "_preview": "first 1000 characters..."
}
```

### Debug Mode Impact

When debug mode is enabled:
- ⚠️ Full payloads are logged (no truncation)
- ⚠️ Database size increases significantly
- ⚠️ Query performance may degrade
- ⚠️ Memory usage increases

**Recommendation:** Only enable debug mode for troubleshooting specific issues.

### Log Archival

Old logs are automatically archived to prevent database bloat.

**Manual Archive:**
```typescript
import { mcpLogger } from '@/lib/mcp/mcp-logger';

// Archive logs older than 30 days
const archivedCount = await mcpLogger.archiveOldLogs(30);
console.log(`Archived ${archivedCount} logs`);
```

**Automated Archive:**
Set up a cron job to run daily:
```bash
# Add to crontab
0 2 * * * curl -X POST http://localhost:3000/api/mcp/archive
```

## Troubleshooting

### Logs Not Appearing

1. Check database connection:
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
await prisma.$connect();
```

2. Check if logging is working:
```typescript
import { mcpLogger } from '@/lib/mcp/mcp-logger';
await mcpLogger.logCall(null, 'test', 'test', {}, {}, undefined, 0);
```

3. Check in-memory logs:
```typescript
const logs = mcpLogger.getAllLogs();
console.log('In-memory logs:', logs.length);
```

### Debug Mode Not Working

1. Check environment variable:
```bash
echo $MCP_DEBUG_MODE
```

2. Check via API:
```bash
curl http://localhost:3000/api/mcp/debug
```

3. Enable manually:
```typescript
import { mcpLogger } from '@/lib/mcp/mcp-logger';
mcpLogger.setDebugMode(true);
```

### Performance Issues

1. Check log count:
```sql
SELECT COUNT(*) FROM mcp_logs;
```

2. Archive old logs:
```typescript
await mcpLogger.archiveOldLogs(7); // Keep only 7 days
```

3. Disable debug mode:
```typescript
mcpLogger.setDebugMode(false);
```

## Best Practices

### 1. Always Log MCP Calls

```typescript
// ✅ Good
const startTime = Date.now();
try {
  const result = await mcpClient.call('analyzeCode', params);
  await mcpLogger.logCall(
    resurrectionId,
    'abap-analyzer',
    'analyzeCode',
    params,
    result,
    undefined,
    Date.now() - startTime
  );
  return result;
} catch (error) {
  await mcpLogger.logCall(
    resurrectionId,
    'abap-analyzer',
    'analyzeCode',
    params,
    undefined,
    error.message,
    Date.now() - startTime
  );
  throw error;
}
```

### 2. Use Appropriate Log Levels

```typescript
// ✅ Good - Log errors with full details
await mcpLogger.logCall(
  resurrectionId,
  'github',
  'createRepository',
  params,
  undefined,
  'Authentication failed: Invalid token',
  duration
);

// ✅ Good - Log success with summary
await mcpLogger.logCall(
  resurrectionId,
  'abap-analyzer',
  'analyzeCode',
  { code: '...' }, // Truncated automatically
  { summary: 'Analyzed 450 LOC' },
  undefined,
  duration
);
```

### 3. Enable Debug Mode Selectively

```typescript
// ✅ Good - Enable for specific troubleshooting
if (process.env.TROUBLESHOOT_GITHUB === 'true') {
  mcpLogger.setDebugMode(true);
}

// ❌ Bad - Always enabled
mcpLogger.setDebugMode(true);
```

### 4. Regular Log Archival

```typescript
// ✅ Good - Archive old logs regularly
setInterval(async () => {
  await mcpLogger.archiveOldLogs(30);
}, 24 * 60 * 60 * 1000); // Daily
```

## Security Considerations

### Sensitive Data

MCP logs may contain sensitive data:
- API tokens
- User credentials
- Business data

**Recommendations:**
1. Never log sensitive data in params/response
2. Sanitize data before logging
3. Restrict access to logs (authentication required)
4. Archive/delete logs regularly

**Example Sanitization:**
```typescript
const sanitizedParams = {
  ...params,
  token: params.token ? '***REDACTED***' : undefined,
  password: params.password ? '***REDACTED***' : undefined
};

await mcpLogger.logCall(
  resurrectionId,
  serverName,
  toolName,
  sanitizedParams, // Use sanitized version
  response,
  error,
  duration
);
```

## Monitoring

### Key Metrics

Monitor these metrics for MCP health:

1. **Success Rate**
```typescript
const stats = await mcpLogger.getLogStats(resurrectionId);
const successRate = stats.successfulCalls / stats.totalCalls;
```

2. **Average Duration**
```typescript
const avgDuration = stats.averageDuration;
if (avgDuration > 5000) {
  console.warn('MCP calls are slow');
}
```

3. **Error Rate by Server**
```typescript
const errorLogs = await mcpLogger.getAllLogs({ status: 'error' });
const errorsByServer = errorLogs.reduce((acc, log) => {
  acc[log.serverName] = (acc[log.serverName] || 0) + 1;
  return acc;
}, {});
```

## Conclusion

The MCP Logging system provides comprehensive visibility into all MCP server interactions, enabling:
- ✅ Debugging workflow issues
- ✅ Performance monitoring
- ✅ Error tracking
- ✅ Audit trails
- ✅ Troubleshooting

For questions or issues, refer to the main documentation or create an issue on GitHub.
