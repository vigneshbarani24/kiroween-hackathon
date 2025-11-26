/**
 * MCP Logs Page
 * 
 * View all MCP logs across all resurrections
 * Requirements: 12.5, 12.7, 12.8
 */

import { MCPLogsViewer } from '@/components/MCPLogsViewer';
import { MCPDebugToggle } from '@/components/MCPDebugToggle';

export default function MCPLogsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">MCP Server Logs</h1>
        <p className="text-muted-foreground mt-2">
          View and debug all MCP server interactions across all resurrections
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <MCPDebugToggle />
        </div>
      </div>

      <MCPLogsViewer autoRefresh={true} refreshInterval={10000} />
    </div>
  );
}
