'use client';

/**
 * Hook Execution History
 * 
 * Displays the execution history of hooks for a resurrection
 * 
 * Requirements: 11.9
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface HookExecution {
  id: string;
  hookId: string;
  hookName: string;
  trigger: string;
  status: 'TRIGGERED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  executionLog: any;
  duration: number;
  createdAt: string;
}

interface HookExecutionHistoryProps {
  resurrectionId: string;
}

export function HookExecutionHistory({ resurrectionId }: HookExecutionHistoryProps) {
  const [executions, setExecutions] = useState<HookExecution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExecutions();
  }, [resurrectionId]);

  const loadExecutions = async () => {
    try {
      const response = await fetch(`/api/resurrections/${resurrectionId}/hooks/executions`);
      if (response.ok) {
        const data = await response.json();
        setExecutions(data.executions || []);
      }
    } catch (error) {
      console.error('Failed to load hook executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '✅';
      case 'FAILED':
        return '🔴';
      case 'RUNNING':
        return '⏳';
      case 'TRIGGERED':
        return '🔔';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500';
      case 'FAILED':
        return 'bg-red-500';
      case 'RUNNING':
        return 'bg-yellow-500';
      case 'TRIGGERED':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <span className="text-4xl animate-pulse">👻</span>
          <p className="mt-2 text-ghost-white/70">Loading hook history...</p>
        </CardContent>
      </Card>
    );
  }

  if (executions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <span className="text-6xl">🪦</span>
          <p className="mt-4 text-ghost-white/70">
            No hooks have been executed yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-creepster text-pumpkin-orange">
        🔮 Hook Execution History
      </h3>

      <div className="space-y-3">
        {executions.map((execution) => (
          <Card
            key={execution.id}
            className="hover:shadow-purple-glow transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getStatusIcon(execution.status)}</span>
                  <div>
                    <CardTitle className="text-base text-ghost-white">
                      {execution.hookName}
                    </CardTitle>
                    <CardDescription className="text-xs text-ghost-white/50">
                      {formatDistanceToNow(new Date(execution.createdAt), { addSuffix: true })}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(execution.status)}>
                  {execution.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4 text-sm text-ghost-white/70">
                <div>
                  <span className="font-semibold">Trigger:</span> {execution.trigger}
                </div>
                {execution.duration && (
                  <div>
                    <span className="font-semibold">Duration:</span> {execution.duration}ms
                  </div>
                )}
              </div>
              {execution.executionLog && Array.isArray(execution.executionLog) && execution.executionLog.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-pumpkin-orange hover:underline">
                    View execution log
                  </summary>
                  <pre className="mt-2 p-2 bg-graveyard-black rounded text-xs text-ghost-white/70 overflow-x-auto">
                    {JSON.stringify(execution.executionLog, null, 2)}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
