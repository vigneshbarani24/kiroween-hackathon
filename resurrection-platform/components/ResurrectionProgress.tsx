'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

// Workflow step types
export type WorkflowStep = 'ANALYZE' | 'PLAN' | 'GENERATE' | 'VALIDATE' | 'DEPLOY';

export interface ProgressUpdate {
  resurrectionId: string;
  step: WorkflowStep;
  status: 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  message?: string;
  timestamp: Date;
}

interface ResurrectionProgressProps {
  resurrectionId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

// Workflow steps configuration with Halloween theme
const WORKFLOW_STEPS = [
  {
    id: 'ANALYZE' as WorkflowStep,
    name: 'Spectral Analysis',
    icon: '👻',
    description: 'Parsing ABAP code and extracting business logic',
    estimatedTime: 30,
  },
  {
    id: 'PLAN' as WorkflowStep,
    name: 'Ritual Planning',
    icon: '🔮',
    description: 'Creating AI-powered transformation architecture',
    estimatedTime: 20,
  },
  {
    id: 'GENERATE' as WorkflowStep,
    name: 'Code Summoning',
    icon: '⚡',
    description: 'Generating CAP models, services, and Fiori UI',
    estimatedTime: 60,
  },
  {
    id: 'VALIDATE' as WorkflowStep,
    name: 'Exorcise Bugs',
    icon: '✨',
    description: 'Validating quality and Clean Core compliance',
    estimatedTime: 15,
  },
  {
    id: 'DEPLOY' as WorkflowStep,
    name: 'Release Spirit',
    icon: '🚀',
    description: 'Creating GitHub repository and BAS link',
    estimatedTime: 20,
  },
];

// Floating ghost animation component
function FloatingGhost({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="absolute text-6xl opacity-20 pointer-events-none"
      initial={{ y: 0, x: 0, opacity: 0 }}
      animate={{
        y: [-20, 20, -20],
        x: [0, 10, 0],
        opacity: [0.1, 0.3, 0.1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      style={{
        left: `${Math.random() * 80 + 10}%`,
        top: `${Math.random() * 80 + 10}%`,
      }}
    >
      👻
    </motion.div>
  );
}

// Bat-wing style progress bar
function BatWingProgress({ value }: { value: number }) {
  return (
    <div className="relative w-full h-4 bg-[#1a0f2e] border-2 border-[#5b21b6] rounded-full overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#8b5cf6] via-[#FF6B35] to-[#FF6B35] shadow-[0_0_20px_rgba(255,107,53,0.6)]"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      {/* Bat wing decorations */}
      <div className="absolute inset-0 flex items-center justify-end pr-1">
        <motion.span
          className="text-xs"
          animate={{
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
          }}
        >
          🦇
        </motion.span>
      </div>
    </div>
  );
}

// Pulsing pumpkin loader
function PulsingPumpkin() {
  return (
    <motion.div
      className="text-8xl"
      animate={{
        scale: [1, 1.2, 1],
        filter: [
          'drop-shadow(0 0 0px #FF6B35)',
          'drop-shadow(0 0 30px #FF6B35)',
          'drop-shadow(0 0 0px #FF6B35)',
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      🎃
    </motion.div>
  );
}

export function ResurrectionProgress({
  resurrectionId,
  onComplete,
  onError,
}: ResurrectionProgressProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('ANALYZE');
  const [currentStepStatus, setCurrentStepStatus] = useState<'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'>('STARTED');
  const [completedSteps, setCompletedSteps] = useState<Set<WorkflowStep>>(new Set());
  const [statusMessage, setStatusMessage] = useState<string>('Initializing resurrection ritual...');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(145); // Total estimated time in seconds
  const [stepDurations, setStepDurations] = useState<Map<WorkflowStep, number>>(new Map());
  const [stepStartTimes, setStepStartTimes] = useState<Map<WorkflowStep, number>>(new Map());
  const [mcpLogs, setMcpLogs] = useState<Array<{
    id: string;
    serverName: string;
    toolName: string;
    status: 'success' | 'error';
    timestamp: Date;
    durationMs: number;
  }>>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<{
    cdsModels: Array<{ name: string; content: string }>;
    services: Array<{ name: string; content: string }>;
    ui5Structure: Array<{ name: string; type: string }>;
  } | null>(null);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [selectedCodeTab, setSelectedCodeTab] = useState<'cds' | 'services' | 'ui5'>('cds');

  // Calculate progress percentage
  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentStep);
  const progressPercentage = ((currentStepIndex + (currentStepStatus === 'COMPLETED' ? 1 : 0.5)) / WORKFLOW_STEPS.length) * 100;

  // Real-time updates using SSE
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let timeInterval: NodeJS.Timeout;
    let isComplete = false;

    const statusToStepMap: Record<string, WorkflowStep> = {
      'ANALYZING': 'ANALYZE',
      'PLANNING': 'PLAN',
      'GENERATING': 'GENERATE',
      'VALIDATING': 'VALIDATE',
      'DEPLOYING': 'DEPLOY',
    };

    const updateStepInfo = (steps: any[], status: string) => {
      const newStep = statusToStepMap[status];
      if (newStep) {
        // Track step start time
        setStepStartTimes(prev => {
          if (!prev.has(newStep)) {
            const newMap = new Map(prev);
            newMap.set(newStep, Date.now());
            return newMap;
          }
          return prev;
        });

        setCurrentStep(newStep);
        setCurrentStepStatus('IN_PROGRESS');
        
        // Update completed steps and durations
        const completed = new Set<WorkflowStep>();
        const durations = new Map<WorkflowStep, number>();
        
        for (const step of steps) {
          if (step.status === 'COMPLETED') {
            completed.add(step.stepName as WorkflowStep);
            
            // Calculate duration if we have start and end times
            if (step.startedAt && step.completedAt) {
              const duration = Math.floor(
                (new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime()) / 1000
              );
              durations.set(step.stepName as WorkflowStep, duration);
            }
          }
        }
        
        setCompletedSteps(completed);
        setStepDurations(durations);

        // Update status message
        const stepConfig = WORKFLOW_STEPS.find(s => s.id === newStep);
        if (stepConfig) {
          setStatusMessage(stepConfig.description);
        }
      }
    };

    // Connect to SSE endpoint
    try {
      eventSource = new EventSource(`/api/resurrections/${resurrectionId}/steps?stream=true`);

      eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'initial') {
            // Initial data
            updateStepInfo(data.steps, data.status);
          } else if (data.type === 'update') {
            // Real-time update
            updateStepInfo(data.steps, data.status);
            
            // Check if completed
            if (data.status === 'COMPLETED') {
              isComplete = true;
              setCurrentStepStatus('COMPLETED');
              setCompletedSteps(new Set(WORKFLOW_STEPS.map(s => s.id)));
              
              if (onComplete) {
                setTimeout(() => onComplete(), 2000);
              }
            }
            
            // Check if failed
            if (data.status === 'FAILED') {
              isComplete = true;
              setCurrentStepStatus('FAILED');
              
              if (onError) {
                onError('Resurrection failed');
              }
            }
          } else if (data.type === 'complete') {
            // Stream complete
            eventSource?.close();
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      });

      eventSource.addEventListener('error', (error) => {
        console.error('SSE connection error:', error);
        eventSource?.close();
        
        // Fallback to polling if SSE fails
        if (!isComplete) {
          console.log('Falling back to polling...');
          // Could implement polling fallback here
        }
      });

    } catch (error) {
      console.error('Error setting up SSE:', error);
    }

    // Update elapsed time every second
    timeInterval = setInterval(() => {
      if (!isComplete) {
        setElapsedTime(prev => prev + 1);
        setEstimatedTimeRemaining(prev => Math.max(0, prev - 1));
      }
    }, 1000);

    // Fetch MCP logs and generated code periodically
    const fetchResurrectionData = async () => {
      try {
        const response = await fetch(`/api/resurrections/${resurrectionId}`);
        if (response.ok) {
          const data = await response.json();
          
          // Update MCP logs
          if (data.mcpLogs) {
            setMcpLogs(data.mcpLogs.map((log: any) => ({
              id: log.id,
              serverName: log.serverName,
              toolName: log.toolName,
              status: log.error ? 'error' : 'success',
              timestamp: new Date(log.calledAt),
              durationMs: log.durationMs || 0,
            })));
          }

          // Update generated code preview if available
          if (data.generatedFiles && data.generatedFiles.length > 0) {
            const cdsModels: Array<{ name: string; content: string }> = [];
            const services: Array<{ name: string; content: string }> = [];
            const ui5Structure: Array<{ name: string; type: string }> = [];

            data.generatedFiles.forEach((file: any) => {
              if (file.path.includes('/db/') && file.path.endsWith('.cds')) {
                cdsModels.push({
                  name: file.path.split('/').pop() || 'schema.cds',
                  content: file.content || '// CDS model content',
                });
              } else if (file.path.includes('/srv/') && (file.path.endsWith('.cds') || file.path.endsWith('.js'))) {
                services.push({
                  name: file.path.split('/').pop() || 'service',
                  content: file.content || '// Service content',
                });
              } else if (file.path.includes('/app/')) {
                ui5Structure.push({
                  name: file.path.split('/app/')[1] || file.path,
                  type: file.path.endsWith('.xml') ? 'view' : 
                        file.path.endsWith('.js') ? 'controller' : 
                        file.path.endsWith('.json') ? 'manifest' : 'file',
                });
              }
            });

            if (cdsModels.length > 0 || services.length > 0 || ui5Structure.length > 0) {
              setGeneratedCode({ cdsModels, services, ui5Structure });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching resurrection data:', error);
      }
    };

    fetchResurrectionData(); // Initial fetch
    const dataInterval = setInterval(fetchResurrectionData, 3000); // Fetch every 3 seconds

    return () => {
      eventSource?.close();
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, [resurrectionId, onComplete, onError]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0f2e] to-[#0a0a0f] p-8 relative overflow-hidden">
      {/* Floating ghosts background */}
      <FloatingGhost delay={0} />
      <FloatingGhost delay={1} />
      <FloatingGhost delay={2} />
      <FloatingGhost delay={3} />

      {/* Spider web decorations in corners */}
      <div className="absolute top-0 left-0 text-6xl opacity-20 pointer-events-none">
        🕸️
      </div>
      <div className="absolute top-0 right-0 text-6xl opacity-20 pointer-events-none transform scale-x-[-1]">
        🕸️
      </div>

      {/* Fog effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-[#2e1065]/20 to-transparent pointer-events-none"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center mb-6">
            <PulsingPumpkin />
          </div>
          
          <h1 className="text-5xl font-bold text-[#FF6B35] mb-4">
            Resurrection in Progress
          </h1>
          
          <p className="text-xl text-[#a78bfa]">
            Transforming your legacy ABAP into modern SAP CAP...
          </p>
        </motion.div>

        {/* Workflow Steps */}
        <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30 mb-8 shadow-[0_0_40px_rgba(139,92,246,0.3)]">
          <CardHeader>
            <CardTitle className="text-[#FF6B35] text-2xl flex items-center gap-2">
              <span>🔮</span>
              Resurrection Ritual
            </CardTitle>
            <CardDescription className="text-[#a78bfa] text-lg">
              {statusMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Step indicators */}
            <div className="space-y-6">
              {WORKFLOW_STEPS.map((step, index) => {
                const isCompleted = completedSteps.has(step.id);
                const isCurrent = currentStep === step.id;
                const isPending = !isCompleted && !isCurrent;
                const isFailed = isCurrent && currentStepStatus === 'FAILED';

                return (
                  <motion.div
                    key={step.id}
                    className="relative"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {/* Tombstone-shaped card */}
                    <div 
                      className={`
                        flex items-center gap-4 p-4 rounded-t-3xl rounded-b-lg
                        border-2 transition-all duration-300
                        ${isCompleted 
                          ? 'border-[#10B981] bg-gradient-to-b from-[#10B981]/10 to-[#1a0f2e] shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                          : isCurrent
                          ? 'border-[#FF6B35] bg-gradient-to-b from-[#FF6B35]/10 to-[#2e1065] shadow-[0_0_30px_rgba(255,107,53,0.4)]'
                          : isFailed
                          ? 'border-[#dc2626] bg-gradient-to-b from-[#dc2626]/10 to-[#1a0f2e] shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                          : 'border-[#5b21b6]/50 bg-gradient-to-b from-[#2e1065]/30 to-[#1a0f2e]'
                        }
                      `}
                    >
                      {/* Step icon */}
                      <motion.div
                        className={`
                          w-16 h-16 rounded-full flex items-center justify-center text-3xl
                          border-2 transition-all duration-300 flex-shrink-0
                          ${isCompleted 
                            ? 'border-[#10B981] bg-[#10B981]/20 shadow-[0_0_20px_rgba(16,185,129,0.5)]' 
                            : isCurrent
                            ? 'border-[#FF6B35] bg-[#2e1065] shadow-[0_0_20px_rgba(255,107,53,0.5)]'
                            : isFailed
                            ? 'border-[#dc2626] bg-[#dc2626]/20 shadow-[0_0_20px_rgba(220,38,38,0.5)]'
                            : 'border-[#5b21b6] bg-[#1a0f2e]'
                          }
                        `}
                        animate={isCurrent ? {
                          scale: [1, 1.1, 1],
                        } : {}}
                        transition={{
                          duration: 2,
                          repeat: isCurrent ? Infinity : 0,
                        }}
                      >
                        {isCompleted ? '✅' : isFailed ? '❌' : step.icon}
                      </motion.div>

                      {/* Step details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className={`
                            text-lg font-semibold
                            ${isCompleted ? 'text-[#10B981]' : isCurrent ? 'text-[#FF6B35]' : isFailed ? 'text-[#dc2626]' : 'text-[#6B7280]'}
                          `}>
                            {step.name}
                          </h3>
                          
                          {isCurrent && (
                            <Badge className="bg-[#FF6B35] text-white animate-pulse-glow">
                              In Progress
                            </Badge>
                          )}
                          
                          {isCompleted && (
                            <Badge className="bg-[#10B981] text-white">
                              Complete
                            </Badge>
                          )}
                          
                          {isFailed && (
                            <Badge className="bg-[#dc2626] text-white">
                              Failed
                            </Badge>
                          )}
                        </div>
                        
                        <p className={`
                          text-sm
                          ${isCompleted || isCurrent ? 'text-[#a78bfa]' : 'text-[#6B7280]'}
                        `}>
                          {step.description}
                        </p>

                        {isCurrent && (
                          <motion.div
                            className="mt-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <Progress value={50} className="h-1" />
                          </motion.div>
                        )}
                      </div>

                      {/* Duration / Estimated time */}
                      <div className="text-right flex-shrink-0">
                        {isCompleted && stepDurations.has(step.id) ? (
                          <div>
                            <p className="text-sm text-[#10B981] font-semibold">
                              {stepDurations.get(step.id)}s
                            </p>
                            <p className="text-xs text-[#6B7280]">
                              (est. {step.estimatedTime}s)
                            </p>
                          </div>
                        ) : isCurrent && stepStartTimes.has(step.id) ? (
                          <div>
                            <p className="text-sm text-[#FF6B35] font-semibold animate-pulse">
                              {Math.floor((Date.now() - stepStartTimes.get(step.id)!) / 1000)}s
                            </p>
                            <p className="text-xs text-[#6B7280]">
                              (est. {step.estimatedTime}s)
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-[#6B7280]">
                            ~{step.estimatedTime}s
                          </p>
                        )}
                      </div>

                      {/* Small tombstone marker at top */}
                      {isCurrent && (
                        <motion.div
                          className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-2xl"
                          animate={{
                            y: [-5, 5, -5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        >
                          ⚰️
                        </motion.div>
                      )}
                    </div>

                    {/* Connector line - spider web style */}
                    {index < WORKFLOW_STEPS.length - 1 && (
                      <div className="ml-8 h-8 w-0.5 bg-gradient-to-b from-[#5b21b6] to-[#5b21b6]/30 my-2 relative">
                        <div className="absolute top-1/2 left-0 w-4 h-0.5 bg-[#5b21b6]/30" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Overall progress */}
            <div className="pt-6 border-t border-[#5b21b6]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#a78bfa] font-semibold">Overall Progress</span>
                <span className="text-[#FF6B35] font-bold text-lg">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <BatWingProgress value={progressPercentage} />
            </div>

            {/* Time information */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#5b21b6]">
              <div className="text-center p-4 bg-[#1a0f2e] border border-[#5b21b6] rounded-lg">
                <p className="text-sm text-[#a78bfa] mb-1">Elapsed Time</p>
                <p className="text-2xl font-bold text-[#F7F7FF]">
                  {formatTime(elapsedTime)}
                </p>
              </div>
              <div className="text-center p-4 bg-[#1a0f2e] border border-[#5b21b6] rounded-lg">
                <p className="text-sm text-[#a78bfa] mb-1">Est. Remaining</p>
                <p className="text-2xl font-bold text-[#FF6B35]">
                  {formatTime(estimatedTimeRemaining)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated Code Preview */}
        {generatedCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#FF6B35] text-xl flex items-center gap-2">
                    <span></span> Generated Code Preview
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCodePreview(!showCodePreview)}
                    className="border-[#5b21b6] text-[#a78bfa] hover:bg-[#2e1065]/50"
                  >
                    {showCodePreview ? 'Hide Preview' : 'Show Preview'}
                  </Button>
                </div>
                <CardDescription className="text-[#a78bfa]">
                  CDS models, services, and UI5 application structure
                </CardDescription>
              </CardHeader>
              {showCodePreview && (
                <CardContent>
                  {/* Tab Navigation */}
                  <div className="flex gap-2 mb-4 border-b border-[#5b21b6] pb-2">
                    <button
                      onClick={() => setSelectedCodeTab('cds')}
                      className={`
                        px-4 py-2 rounded-t-lg transition-all
                        ${selectedCodeTab === 'cds'
                          ? 'bg-[#FF6B35] text-[#F7F7FF]'
                          : 'bg-[#1a0f2e] text-[#a78bfa] hover:bg-[#2e1065]'
                        }
                      `}
                    >
                      CDS Models ({generatedCode.cdsModels.length})
                    </button>
                    <button
                      onClick={() => setSelectedCodeTab('services')}
                      className={`
                        px-4 py-2 rounded-t-lg transition-all
                        ${selectedCodeTab === 'services'
                          ? 'bg-[#FF6B35] text-[#F7F7FF]'
                          : 'bg-[#1a0f2e] text-[#a78bfa] hover:bg-[#2e1065]'
                        }
                      `}
                    >
                      Services ({generatedCode.services.length})
                    </button>
                    <button
                      onClick={() => setSelectedCodeTab('ui5')}
                      className={`
                        px-4 py-2 rounded-t-lg transition-all
                        ${selectedCodeTab === 'ui5'
                          ? 'bg-[#FF6B35] text-[#F7F7FF]'
                          : 'bg-[#1a0f2e] text-[#a78bfa] hover:bg-[#2e1065]'
                        }
                      `}
                    >
                      UI5 App ({generatedCode.ui5Structure.length})
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="max-h-96 overflow-y-auto">
                    {selectedCodeTab === 'cds' && (
                      <div className="space-y-4">
                        {generatedCode.cdsModels.length > 0 ? (
                          generatedCode.cdsModels.map((model, index) => (
                            <div key={index} className="bg-[#1a0f2e] border border-[#5b21b6] rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">📄</span>
                                <h4 className="text-[#F7F7FF] font-semibold">{model.name}</h4>
                              </div>
                              <pre className="text-xs text-[#a78bfa] overflow-x-auto bg-[#0a0a0f] p-3 rounded border border-[#5b21b6]/30">
                                <code>{model.content.slice(0, 500)}{model.content.length > 500 ? '...' : ''}</code>
                              </pre>
                            </div>
                          ))
                        ) : (
                          <p className="text-[#6B7280] text-center py-8">
                            CDS models will appear here once generated...
                          </p>
                        )}
                      </div>
                    )}

                    {selectedCodeTab === 'services' && (
                      <div className="space-y-4">
                        {generatedCode.services.length > 0 ? (
                          generatedCode.services.map((service, index) => (
                            <div key={index} className="bg-[#1a0f2e] border border-[#5b21b6] rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">⚙️</span>
                                <h4 className="text-[#F7F7FF] font-semibold">{service.name}</h4>
                              </div>
                              <pre className="text-xs text-[#a78bfa] overflow-x-auto bg-[#0a0a0f] p-3 rounded border border-[#5b21b6]/30">
                                <code>{service.content.slice(0, 500)}{service.content.length > 500 ? '...' : ''}</code>
                              </pre>
                            </div>
                          ))
                        ) : (
                          <p className="text-[#6B7280] text-center py-8">
                            Service definitions will appear here once generated...
                          </p>
                        )}
                      </div>
                    )}

                    {selectedCodeTab === 'ui5' && (
                      <div className="space-y-2">
                        {generatedCode.ui5Structure.length > 0 ? (
                          generatedCode.ui5Structure.map((file, index) => (
                            <div key={index} className="bg-[#1a0f2e] border border-[#5b21b6] rounded-lg p-3 flex items-center gap-3">
                              <span className="text-2xl">
                                {file.type === 'view' ? '👁️' : 
                                 file.type === 'controller' ? '🎮' : 
                                 file.type === 'manifest' ? '📋' : '📄'}
                              </span>
                              <div className="flex-1">
                                <p className="text-[#F7F7FF] font-mono text-sm">{file.name}</p>
                                <Badge 
                                  variant="outline" 
                                  className="border-[#8b5cf6] text-[#a78bfa] text-xs mt-1"
                                >
                                  {file.type}
                                </Badge>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[#6B7280] text-center py-8">
                            UI5 application structure will appear here once generated...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}

        {/* MCP Call Logs */}
        {mcpLogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mb-8"
          >
            <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#FF6B35] text-xl flex items-center gap-2">
                    <span>🔧</span>
                    MCP Server Activity
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLogs(!showLogs)}
                    className="border-[#5b21b6] text-[#a78bfa] hover:bg-[#2e1065]/50"
                  >
                    {showLogs ? 'Hide Logs' : 'Show Logs'}
                  </Button>
                </div>
                <CardDescription className="text-[#a78bfa]">
                  Real-time MCP server calls and responses
                </CardDescription>
              </CardHeader>
              {showLogs && (
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {mcpLogs.slice().reverse().map((log) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`
                          p-3 rounded-lg border flex items-start gap-3
                          ${log.status === 'success' 
                            ? 'bg-[#1a0f2e] border-[#10B981]/30' 
                            : 'bg-[#1a0f2e] border-[#dc2626]/30'
                          }
                        `}
                      >
                        <span className="text-2xl flex-shrink-0">
                          {log.status === 'success' ? '✅' : '❌'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="outline" 
                              className="border-[#8b5cf6] text-[#a78bfa] text-xs"
                            >
                              {log.serverName}
                            </Badge>
                            <span className="text-sm text-[#F7F7FF] font-mono">
                              {log.toolName}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                            <span>
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                            <span>•</span>
                            <span>
                              {log.durationMs}ms
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}

        {/* Fun facts / tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <span className="text-3xl">💡</span>
                <div>
                  <h4 className="text-[#FF6B35] font-semibold mb-2">
                    Did you know?
                  </h4>
                  <p className="text-[#a78bfa] text-sm">
                    Your resurrection is using AI-powered MCP servers to analyze ABAP patterns,
                    generate Clean Core-compliant CAP code, and create a production-ready
                    GitHub repository. All business logic is preserved with 100% accuracy! 🎃
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Spinning bat decoration */}
      <motion.div
        className="fixed bottom-10 right-10 text-6xl opacity-30"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        🦇
      </motion.div>
    </div>
  );
}
