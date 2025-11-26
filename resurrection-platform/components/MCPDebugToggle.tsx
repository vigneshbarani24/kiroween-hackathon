/**
 * MCP Debug Mode Toggle Component
 * 
 * Toggle debug mode for full request/response logging
 * Requirements: 12.8
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bug, BugOff, AlertTriangle } from 'lucide-react';

export function MCPDebugToggle() {
  const [debugMode, setDebugMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Fetch current debug mode status
  const fetchDebugStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mcp/debug');
      const data = await response.json();
      
      if (data.success) {
        setDebugMode(data.debugMode);
      }
    } catch (error) {
      console.error('Failed to fetch debug mode status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle debug mode
  const toggleDebugMode = async () => {
    try {
      setToggling(true);
      const response = await fetch('/api/mcp/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: !debugMode })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDebugMode(data.debugMode);
      }
    } catch (error) {
      console.error('Failed to toggle debug mode:', error);
    } finally {
      setToggling(false);
    }
  };

  useEffect(() => {
    fetchDebugStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Loading debug mode status...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {debugMode ? <Bug className="h-5 w-5" /> : <BugOff className="h-5 w-5" />}
              Debug Mode
            </CardTitle>
            <CardDescription>
              {debugMode 
                ? 'Full request/response payloads are being logged'
                : 'Payloads are truncated for performance'
              }
            </CardDescription>
          </div>
          <Badge variant={debugMode ? 'destructive' : 'secondary'}>
            {debugMode ? 'ENABLED' : 'DISABLED'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Warning when debug mode is enabled */}
          {debugMode && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-yellow-900 text-sm">
                  Performance Impact
                </div>
                <div className="text-xs text-yellow-800 mt-1">
                  Debug mode logs full request/response payloads, which may impact performance 
                  and generate large log files. Use only for troubleshooting.
                </div>
              </div>
            </div>
          )}

          {/* Debug mode details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Full Payloads:</span>
              <span className="font-semibold">{debugMode ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Truncation:</span>
              <span className="font-semibold">{debugMode ? 'Disabled' : 'Enabled (1000 chars)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Console Logging:</span>
              <span className="font-semibold">{debugMode ? 'Verbose' : 'Standard'}</span>
            </div>
          </div>

          {/* Toggle button */}
          <Button 
            onClick={toggleDebugMode} 
            disabled={toggling}
            variant={debugMode ? 'destructive' : 'default'}
            className="w-full"
          >
            {toggling ? (
              'Toggling...'
            ) : debugMode ? (
              <>
                <BugOff className="h-4 w-4 mr-2" />
                Disable Debug Mode
              </>
            ) : (
              <>
                <Bug className="h-4 w-4 mr-2" />
                Enable Debug Mode
              </>
            )}
          </Button>

          {/* Environment variable note */}
          <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
            <strong>Note:</strong> Debug mode can also be enabled via environment variable:
            <code className="block mt-1 bg-background px-2 py-1 rounded">
              MCP_DEBUG_MODE=true
            </code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
