'use client';

/**
 * Hook Configuration UI
 * 
 * Provides a user interface for managing Kiro hooks
 * 
 * Requirements: 11.8
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface HookAction {
  type: 'mcp-call' | 'agent-execution' | 'shell-command';
  server?: string;
  method?: string;
  params?: Record<string, any>;
  message?: string;
  command?: string;
}

interface Hook {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
  actions: HookAction[];
}

export function HookConfigurationUI() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHook, setSelectedHook] = useState<Hook | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Load hooks on mount
  useEffect(() => {
    loadHooks();
  }, []);

  const loadHooks = async () => {
    try {
      const response = await fetch('/api/hooks');
      if (response.ok) {
        const data = await response.json();
        setHooks(data.hooks || []);
      }
    } catch (error) {
      console.error('Failed to load hooks:', error);
      toast.error('Failed to load hooks');
    } finally {
      setLoading(false);
    }
  };

  const toggleHook = async (hookId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/hooks/${hookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        setHooks(hooks.map(h => h.id === hookId ? { ...h, enabled } : h));
        toast.success(`Hook ${enabled ? 'enabled' : 'disabled'}`);
      } else {
        toast.error('Failed to update hook');
      }
    } catch (error) {
      console.error('Failed to toggle hook:', error);
      toast.error('Failed to update hook');
    }
  };

  const deleteHook = async (hookId: string) => {
    if (!confirm('Are you sure you want to delete this hook?')) {
      return;
    }

    try {
      const response = await fetch(`/api/hooks/${hookId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setHooks(hooks.filter(h => h.id !== hookId));
        toast.success('Hook deleted');
      } else {
        toast.error('Failed to delete hook');
      }
    } catch (error) {
      console.error('Failed to delete hook:', error);
      toast.error('Failed to delete hook');
    }
  };

  const getTriggerIcon = (trigger: string) => {
    if (trigger.includes('started')) return '🚀';
    if (trigger.includes('completed')) return '✅';
    if (trigger.includes('failed')) return '🔴';
    if (trigger.includes('deployed')) return '🎉';
    if (trigger.includes('github')) return '🐙';
    return '🔮';
  };

  const getTriggerBadgeColor = (trigger: string) => {
    if (trigger.includes('started')) return 'bg-blue-500';
    if (trigger.includes('completed')) return 'bg-green-500';
    if (trigger.includes('failed')) return 'bg-red-500';
    if (trigger.includes('deployed')) return 'bg-purple-500';
    return 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <span className="text-4xl animate-pulse">👻</span>
          <p className="mt-2 text-ghost-white">Loading hooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-creepster text-pumpkin-orange">
            🔮 Kiro Hooks
          </h2>
          <p className="text-ghost-white/70 mt-1">
            Automate quality validation, CI/CD, and notifications
          </p>
        </div>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" onClick={() => setSelectedHook(null)}>
              <span className="mr-2">✨</span>
              Create Hook
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-graveyard-black border-spooky-purple-700">
            <DialogHeader>
              <DialogTitle className="text-pumpkin-orange font-creepster">
                {selectedHook ? 'Edit Hook' : 'Create New Hook'}
              </DialogTitle>
              <DialogDescription className="text-ghost-white/70">
                Configure automation for resurrection lifecycle events
              </DialogDescription>
            </DialogHeader>
            <HookForm
              hook={selectedHook}
              onSave={async (hook) => {
                await loadHooks();
                setIsEditDialogOpen(false);
                toast.success(selectedHook ? 'Hook updated' : 'Hook created');
              }}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Hooks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hooks.map((hook) => (
          <Card
            key={hook.id}
            className="relative overflow-hidden hover:shadow-purple-glow transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getTriggerIcon(hook.trigger)}</span>
                  <div>
                    <CardTitle className="text-lg text-ghost-white">
                      {hook.name}
                    </CardTitle>
                    <Badge className={`mt-1 ${getTriggerBadgeColor(hook.trigger)}`}>
                      {hook.trigger}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleHook(hook.id, !hook.enabled)}
                  className={hook.enabled ? 'text-green-500' : 'text-gray-500'}
                >
                  {hook.enabled ? '✓' : '○'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-ghost-white/70">
                  <span className="font-semibold">{hook.actions.length}</span> action
                  {hook.actions.length !== 1 ? 's' : ''}
                </div>
                <div className="flex gap-2">
                  {hook.actions.map((action, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {action.type === 'mcp-call' && `📡 ${action.server}`}
                      {action.type === 'agent-execution' && '🤖 Agent'}
                      {action.type === 'shell-command' && '💻 Shell'}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedHook(hook);
                    setIsEditDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-haunted-red"
                  onClick={() => deleteHook(hook.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hooks.length === 0 && (
        <Card className="p-8 text-center">
          <span className="text-6xl">🪦</span>
          <p className="mt-4 text-ghost-white/70">
            No hooks configured yet. Create your first hook to automate your resurrection workflow!
          </p>
        </Card>
      )}
    </div>
  );
}

interface HookFormProps {
  hook: Hook | null;
  onSave: (hook: Hook) => void;
  onCancel: () => void;
}

function HookForm({ hook, onSave, onCancel }: HookFormProps) {
  const [formData, setFormData] = useState<Partial<Hook>>(
    hook || {
      id: '',
      name: '',
      trigger: 'resurrection.completed',
      enabled: true,
      actions: []
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/hooks', {
        method: hook ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const savedHook = await response.json();
        onSave(savedHook);
      } else {
        toast.error('Failed to save hook');
      }
    } catch (error) {
      console.error('Failed to save hook:', error);
      toast.error('Failed to save hook');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name" className="text-ghost-white">Hook Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Notify team on completion"
          required
          className="bg-spooky-purple-950 border-spooky-purple-700 text-ghost-white"
        />
      </div>

      <div>
        <Label htmlFor="trigger" className="text-ghost-white">Trigger Event</Label>
        <Select
          value={formData.trigger}
          onValueChange={(value) => setFormData({ ...formData, trigger: value })}
        >
          <SelectTrigger className="bg-spooky-purple-950 border-spooky-purple-700 text-ghost-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-spooky-purple-950 border-spooky-purple-700">
            <SelectItem value="resurrection.started">Resurrection Started</SelectItem>
            <SelectItem value="resurrection.completed">Resurrection Completed</SelectItem>
            <SelectItem value="resurrection.failed">Resurrection Failed</SelectItem>
            <SelectItem value="quality.validation.passed">Quality Validation Passed</SelectItem>
            <SelectItem value="quality.validation.failed">Quality Validation Failed</SelectItem>
            <SelectItem value="github.repository.created">GitHub Repository Created</SelectItem>
            <SelectItem value="deployment.succeeded">Deployment Succeeded</SelectItem>
            <SelectItem value="deployment.failed">Deployment Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="default">
          <span className="mr-2">💾</span>
          Save Hook
        </Button>
      </div>
    </form>
  );
}
