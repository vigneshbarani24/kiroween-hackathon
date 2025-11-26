/**
 * MCP Logs Viewer Component
 * 
 * Display and filter MCP logs for debugging
 * Requirements: 12.5, 12.7
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search, Filter, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

interface MCPLog {
  id: string;
  resurrectionId: string;
  serverName: string;
  toolName: string;
  params: any;
  response?: any;
  error?: string;
  durationMs: number;
  calledAt: Date;
}

interface MCPLogsViewerProps {
  resurrectionId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function MCPLogsViewer({ 
  resurrectionId, 
  autoRefresh = false,
  refreshInterval = 5000 
}: MCPLogsViewerProps) {
  const [logs, setLogs] = useState<MCPLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<MCPLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [serverFilter, setServerFilter] = useState<string>('all');
  const [toolFilter, setToolFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<any>(null);

  // Fetch logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      const url = resurrectionId 
        ? `/api/resurrections/${resurrectionId}/logs`
        : '/api/mcp/logs';
      
      const params = new URLSearchParams();
      if (serverFilter !== 'all') params.append('serverName', serverFilter);
      if (toolFilter !== 'all') params.append('toolName', toolFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`${url}?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs);
        setFilteredLogs(data.logs);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch MCP logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLogs();
  }, [resurrectionId, serverFilter, toolFilter, statusFilter]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchLogs, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Search filter
  useEffect(() => {
    if (!searchTerm) {
      setFilteredLogs(logs);
      return;
    }

    const filtered = logs.filter(log => {
      const searchableContent = JSON.stringify({
        serverName: log.serverName,
        toolName: log.toolName,
        params: log.params,
        response: log.response,
        error: log.error
      }).toLowerCase();
      
      return searchableContent.includes(searchTerm.toLowerCase());
    });

    setFilteredLogs(filtered);
  }, [searchTerm, logs]);

  // Export logs as JSON
  const handleExport = async () => {
    try {
      const url = resurrectionId 
        ? `/api/resurrections/${resurrectionId}/logs?export=json`
        : '/api/mcp/logs?export=json';
      
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `mcp-logs-${resurrectionId || 'all'}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  // Toggle log expansion
  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  // Get unique servers and tools for filters
  const uniqueServers = Array.from(new Set(logs.map(log => log.serverName)));
  const uniqueTools = Array.from(new Set(logs.map(log => log.toolName)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>MCP Call Logs</CardTitle>
        <CardDescription>
          View and debug all MCP server interactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.totalCalls}</div>
                <p className="text-xs text-muted-foreground">Total Calls</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{stats.successfulCalls}</div>
                <p className="text-xs text-muted-foreground">Successful</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{stats.failedCalls}</div>
                <p className="text-xs text-muted-foreground">Failed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{Math.round(stats.averageDuration)}ms</div>
                <p className="text-xs text-muted-foreground">Avg Duration</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={serverFilter} onValueChange={setServerFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Server" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Servers</SelectItem>
              {uniqueServers.map(server => (
                <SelectItem key={server} value={server}>{server}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={toolFilter} onValueChange={setToolFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tool" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tools</SelectItem>
              {uniqueTools.map(tool => (
                <SelectItem key={tool} value={tool}>{tool}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Logs List */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No logs found
            </div>
          ) : (
            filteredLogs.map(log => {
              const isExpanded = expandedLogs.has(log.id);
              const isError = !!log.error;
              
              return (
                <Card 
                  key={log.id} 
                  className={`cursor-pointer transition-colors ${isError ? 'border-red-300' : ''}`}
                  onClick={() => toggleLogExpansion(log.id)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mt-1 text-muted-foreground" />
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={isError ? 'destructive' : 'default'}>
                              {log.serverName}
                            </Badge>
                            <span className="text-sm font-mono">{log.toolName}</span>
                            <Badge variant="outline" className="ml-auto">
                              {log.durationMs}ms
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.calledAt).toLocaleString()}
                          </div>

                          {isError && (
                            <div className="mt-2 text-sm text-red-600">
                              ❌ {log.error}
                            </div>
                          )}

                          {isExpanded && (
                            <div className="mt-4 space-y-3">
                              {/* Parameters */}
                              <div>
                                <div className="text-xs font-semibold mb-1">Parameters:</div>
                                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                                  {JSON.stringify(log.params, null, 2)}
                                </pre>
                              </div>

                              {/* Response */}
                              {log.response && (
                                <div>
                                  <div className="text-xs font-semibold mb-1">Response:</div>
                                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                                    {JSON.stringify(log.response, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {/* Full Error */}
                              {log.error && (
                                <div>
                                  <div className="text-xs font-semibold mb-1">Error Details:</div>
                                  <pre className="text-xs bg-red-50 p-3 rounded overflow-x-auto text-red-800">
                                    {log.error}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
