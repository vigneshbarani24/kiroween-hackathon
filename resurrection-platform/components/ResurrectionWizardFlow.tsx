'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ABAPUploadZone, UploadedFile } from './ABAPUploadZone';
import { halloweenToast } from '@/lib/toast';

type WizardStep = 'upload' | 'review' | 'configure' | 'confirm';

interface ABAPAnalysis {
  businessLogic: string[];
  tables: string[];
  dependencies: string[];
  patterns: string[];
  complexity: number;
  linesOfCode: number;
  module: string;
}

interface ResurrectionConfig {
  name: string;
  template: 'fiori-list' | 'fiori-object' | 'api-only';
  description?: string;
}

const TEMPLATES = [
  {
    id: 'fiori-list' as const,
    name: 'Fiori Elements List Report',
    description: 'List/detail view with search and filters',
    icon: '📋',
    recommended: true,
  },
  {
    id: 'fiori-object' as const,
    name: 'Fiori Elements Object Page',
    description: 'Single object view with sections',
    icon: '📄',
    recommended: false,
  },
  {
    id: 'api-only' as const,
    name: 'API-Only (No UI)',
    description: 'Backend services only',
    icon: '🔌',
    recommended: false,
  },
];

export function ResurrectionWizardFlow() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [analysis, setAnalysis] = useState<ABAPAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [config, setConfig] = useState<ResurrectionConfig>({
    name: '',
    template: 'fiori-list',
    description: '',
  });
  const [starting, setStarting] = useState(false);

  const steps: { id: WizardStep; name: string; icon: string }[] = [
    { id: 'upload', name: 'Upload ABAP', icon: '📤' },
    { id: 'review', name: 'Review Analysis', icon: '🔍' },
    { id: 'configure', name: 'Configure Options', icon: '⚙️' },
    { id: 'confirm', name: 'Confirm & Start', icon: '🎃' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleFilesChange = useCallback((newFiles: UploadedFile[]) => {
    setFiles(newFiles);
  }, []);

  const handleAnalyze = async () => {
    const validFiles = files.filter(f => f.valid);
    if (validFiles.length === 0) {
      halloweenToast.error('No Valid Files', 'Please upload valid ABAP files first');
      return;
    }

    setAnalyzing(true);
    const toastId = halloweenToast.loading('🔮 Analyzing ABAP', 'Parsing ancient code...');

    try {
      // Upload files first
      const uploadedIds: string[] = [];
      
      for (const fileData of validFiles) {
        const formData = new FormData();
        formData.append('file', fileData.file);

        const response = await fetch('/api/abap/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${fileData.name}`);
        }

        const result = await response.json();
        uploadedIds.push(result.object.id);
      }

      // Mock analysis for now (will be replaced with real ABAP Analyzer MCP)
      // In production, this would call the ABAP Analyzer MCP
      const mockAnalysis: ABAPAnalysis = {
        businessLogic: [
          'Pricing calculation logic',
          'Credit limit validation',
          'Order processing workflow',
        ],
        tables: ['VBAK', 'VBAP', 'KNA1', 'MARA'],
        dependencies: ['BAPI_SALESORDER_CREATE', 'Z_PRICING_CALC'],
        patterns: ['Pricing Procedure', 'Authorization Check', 'Batch Processing'],
        complexity: 7,
        linesOfCode: validFiles.reduce((sum, f) => sum + Math.floor(f.size / 50), 0),
        module: 'SD',
      };

      setAnalysis(mockAnalysis);
      
      // Auto-generate project name from first file
      const firstName = validFiles[0].name.replace(/\.[^/.]+$/, '').toLowerCase();
      setConfig(prev => ({
        ...prev,
        name: `resurrection-${firstName}`,
        description: `Resurrected from ${validFiles.length} ABAP file${validFiles.length !== 1 ? 's' : ''}`,
      }));

      halloweenToast.success('✨ Analysis Complete', 'ABAP code has been parsed');
      setCurrentStep('review');
    } catch (error) {
      console.error('Analysis failed:', error);
      halloweenToast.error(
        '🦇 Analysis Failed',
        error instanceof Error ? error.message : 'Could not analyze ABAP code'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStartResurrection = async () => {
    if (!config.name.trim()) {
      halloweenToast.error('Missing Name', 'Please provide a project name');
      return;
    }

    setStarting(true);
    const toastId = halloweenToast.loading('🎃 Starting Resurrection', 'Summoning the spirits...');

    try {
      // Read ABAP code content from files
      const validFiles = files.filter(f => f.valid);
      console.log('[Wizard] Reading ABAP code from', validFiles.length, 'files');
      
      const abapCodeParts: string[] = [];
      for (const fileData of validFiles) {
        try {
          console.log('[Wizard] Reading file:', fileData.name, 'Size:', fileData.size);
          const text = await fileData.file.text();
          console.log('[Wizard] Read', text.length, 'characters from', fileData.name);
          
          if (text && text.trim().length > 0) {
            abapCodeParts.push(`* File: ${fileData.name}\n${text}`);
          } else {
            console.warn('[Wizard] File is empty:', fileData.name);
          }
        } catch (error) {
          console.error(`[Wizard] Failed to read ${fileData.name}:`, error);
          throw new Error(`Failed to read file ${fileData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const abapCode = abapCodeParts.join('\n\n');
      console.log('[Wizard] Total ABAP code length:', abapCode.length, 'characters');

      if (!abapCode || abapCode.trim().length === 0) {
        throw new Error('No ABAP code content found in uploaded files. Files may be empty or unreadable.');
      }

      // Create resurrection
      const payload = {
        name: config.name,
        description: config.description,
        module: analysis?.module || 'CUSTOM',
        template: config.template,
        abapCode: abapCode, // Pass actual ABAP code content
      };
      
      console.log('[Wizard] Creating resurrection with payload:', {
        ...payload,
        abapCode: `${abapCode.length} characters`
      });

      const response = await fetch('/api/resurrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[Wizard] API error:', error);
        throw new Error(error.message || 'Failed to create resurrection');
      }

      const result = await response.json();
      const resurrectionId = result.resurrection.id;

      // Start the workflow
      const startResponse = await fetch(`/api/resurrections/${resurrectionId}/start`, {
        method: 'POST',
      });

      if (!startResponse.ok) {
        console.warn('Failed to start workflow automatically');
      }

      halloweenToast.success(
        '⚰️ Resurrection Started!',
        'Your ABAP is rising from the dead...'
      );

      // Navigate to resurrection detail page
      router.push(`/resurrections/${resurrectionId}`);
    } catch (error) {
      console.error('Failed to start resurrection:', error);
      halloweenToast.error(
        '🦇 Resurrection Failed',
        error instanceof Error ? error.message : 'Could not start resurrection'
      );
    } finally {
      setStarting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'upload':
        return files.filter(f => f.valid).length > 0 && !analyzing;
      case 'review':
        return analysis !== null;
      case 'configure':
        return config.name.trim().length > 0 && /^[a-z0-9-]+$/.test(config.name);
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 'upload') {
      handleAnalyze();
    } else if (currentStep === 'review') {
      setCurrentStep('configure');
    } else if (currentStep === 'configure') {
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    const stepOrder: WizardStep[] = ['upload', 'review', 'configure', 'confirm'];
    const prevIndex = stepOrder.indexOf(currentStep) - 1;
    if (prevIndex >= 0) {
      setCurrentStep(stepOrder[prevIndex]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0f2e] to-[#0a0a0f] p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center items-center gap-4 mb-4">
            <span className="text-4xl animate-float" style={{ animationDelay: '0s' }}>🦇</span>
            <span className="text-8xl animate-pulse-glow">🎃</span>
            <span className="text-4xl animate-float" style={{ animationDelay: '0.5s' }}>🦇</span>
          </div>
          <h1 className="text-5xl font-bold text-[#FF6B35] mb-4 mystical-text">
            Resurrection Ritual
          </h1>
          <p className="text-xl text-[#a78bfa]">
            Transform your legacy ABAP into modern SAP CAP
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <span className="text-2xl animate-ghost-float" style={{ animationDelay: '0s' }}>👻</span>
            <span className="text-2xl animate-ghost-float" style={{ animationDelay: '1s' }}>👻</span>
            <span className="text-2xl animate-ghost-float" style={{ animationDelay: '2s' }}>👻</span>
          </div>
        </div>

        {/* Progress Steps */}
        <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30 mb-8 haunted-border animate-tombstone-rise">
          <CardContent className="pt-6">
            <div className="flex justify-between mb-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center flex-1 transition-all duration-500 ${
                    index <= currentStepIndex ? 'opacity-100 animate-fade-in' : 'opacity-40'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl border-2 transition-all duration-300 ${
                      index < currentStepIndex
                        ? 'border-[#10B981] bg-[#10B981]/20 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-tombstone-rise'
                        : index === currentStepIndex
                        ? 'border-[#FF6B35] bg-[#2e1065] shadow-[0_0_20px_rgba(255,107,53,0.4)] animate-eerie-glow'
                        : 'border-[#5b21b6] bg-[#1a0f2e]'
                    }`}
                  >
                    {index < currentStepIndex ? '✓' : step.icon}
                  </div>
                  <span className="mt-2 text-sm text-[#a78bfa] text-center font-medium">
                    {step.name}
                  </span>
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>

        {/* Step Content */}
        <div className="min-h-[500px]">
          {/* Step 1: Upload ABAP */}
          {currentStep === 'upload' && (
            <div className="space-y-6 animate-fade-in">
              <ABAPUploadZone onFilesChange={handleFilesChange} />
              
              <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/20 spooky-hover">
                <CardContent className="pt-6">
                  <h3 className="text-[#FF6B35] font-semibold mb-3 flex items-center gap-2">
                    <span className="animate-float">💀</span>
                    What happens next?
                  </h3>
                  <ul className="space-y-2 text-sm text-[#a78bfa]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF6B35]">1.</span>
                      <span>Your ABAP files will be analyzed to extract business logic and dependencies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF6B35]">2.</span>
                      <span>You'll review the analysis and configure your resurrection options</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF6B35]">3.</span>
                      <span>We'll generate a modern SAP CAP application with Fiori UI</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF6B35]">4.</span>
                      <span>Your resurrected code will be deployed to GitHub</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Review Analysis */}
          {currentStep === 'review' && analysis && (
            <div className="space-y-6 animate-fade-in">
              <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30 haunted-border animate-tombstone-rise">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#FF6B35] flex items-center gap-2">
                    <span className="animate-pulse-glow">🔍</span>
                    ABAP Analysis Results
                  </CardTitle>
                  <CardDescription className="text-[#a78bfa]">
                    Review what we found in your ancient code
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#1a0f2e] border border-[#5b21b6] rounded-lg p-4">
                      <p className="text-[#a78bfa] text-sm mb-1">Lines of Code</p>
                      <p className="text-3xl font-bold text-[#FF6B35]">
                        {analysis.linesOfCode.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-[#1a0f2e] border border-[#5b21b6] rounded-lg p-4">
                      <p className="text-[#a78bfa] text-sm mb-1">Complexity</p>
                      <p className="text-3xl font-bold text-[#FF6B35]">
                        {analysis.complexity}/10
                      </p>
                    </div>
                    <div className="bg-[#1a0f2e] border border-[#5b21b6] rounded-lg p-4">
                      <p className="text-[#a78bfa] text-sm mb-1">Module</p>
                      <p className="text-3xl font-bold text-[#FF6B35]">
                        {analysis.module}
                      </p>
                    </div>
                  </div>

                  {/* Business Logic */}
                  <div>
                    <h4 className="text-[#F7F7FF] font-semibold mb-3 flex items-center gap-2">
                      <span>💼</span>
                      Business Logic Detected
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.businessLogic.map((logic, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-[#8b5cf6] text-[#a78bfa] bg-[#2e1065]/50"
                        >
                          {logic}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Tables */}
                  <div>
                    <h4 className="text-[#F7F7FF] font-semibold mb-3 flex items-center gap-2">
                      <span>🗄️</span>
                      SAP Tables Referenced
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.tables.map((table, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-[#10B981] text-[#10B981] bg-[#10B981]/10"
                        >
                          {table}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Patterns */}
                  <div>
                    <h4 className="text-[#F7F7FF] font-semibold mb-3 flex items-center gap-2">
                      <span>🎯</span>
                      SAP Patterns Identified
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.patterns.map((pattern, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-[#FF6B35] text-[#FF6B35] bg-[#FF6B35]/10"
                        >
                          {pattern}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Dependencies */}
                  {analysis.dependencies.length > 0 && (
                    <div>
                      <h4 className="text-[#F7F7FF] font-semibold mb-3 flex items-center gap-2">
                        <span>🔗</span>
                        Dependencies
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.dependencies.map((dep, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="border-[#a78bfa] text-[#a78bfa] bg-[#2e1065]/30"
                          >
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Configure Options */}
          {currentStep === 'configure' && (
            <div className="space-y-6 animate-fade-in">
              {/* Project Name */}
              <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30 spooky-hover animate-tombstone-rise">
                <CardHeader>
                  <CardTitle className="text-xl text-[#FF6B35] flex items-center gap-2">
                    <span className="animate-float">🏷️</span>
                    Project Name
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="project-name" className="text-[#F7F7FF] mb-2 block">
                      Name your resurrection project
                    </Label>
                    <Input
                      id="project-name"
                      value={config.name}
                      onChange={(e) =>
                        setConfig(prev => ({
                          ...prev,
                          name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                        }))
                      }
                      placeholder="resurrection-sd-pricing"
                      className="bg-[#2e1065] border-[#5b21b6] text-[#F7F7FF] placeholder:text-[#6B7280]"
                    />
                    <p className="text-sm text-[#a78bfa] mt-2">
                      Use lowercase letters, numbers, and hyphens only
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-[#F7F7FF] mb-2 block">
                      Description (optional)
                    </Label>
                    <Input
                      id="description"
                      value={config.description}
                      onChange={(e) =>
                        setConfig(prev => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Sales order processing resurrection"
                      className="bg-[#2e1065] border-[#5b21b6] text-[#F7F7FF] placeholder:text-[#6B7280]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Template Selection */}
              <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30 spooky-hover animate-tombstone-rise" style={{ animationDelay: '0.2s' }}>
                <CardHeader>
                  <CardTitle className="text-xl text-[#FF6B35] flex items-center gap-2">
                    <span className="animate-float">🎨</span>
                    Choose Template
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {TEMPLATES.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        config.template === template.id
                          ? 'border-[#FF6B35] bg-[#2e1065]/50 shadow-[0_0_15px_rgba(255,107,53,0.3)]'
                          : 'border-[#5b21b6] hover:border-[#8b5cf6] hover:bg-[#2e1065]/30'
                      }`}
                      onClick={() => setConfig(prev => ({ ...prev, template: template.id }))}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{template.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[#F7F7FF] font-semibold">
                                {template.name}
                              </span>
                              {config.template === template.id && (
                                <span className="text-[#FF6B35]">✓</span>
                              )}
                              {template.recommended && (
                                <Badge className="bg-[#10B981] text-white text-xs">
                                  ⭐ Recommended
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-[#a78bfa] mt-1">
                              {template.description}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Confirm & Start */}
          {currentStep === 'confirm' && (
            <div className="space-y-6 animate-fade-in">
              <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30 haunted-border animate-tombstone-rise animate-eerie-glow">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#FF6B35] flex items-center gap-2">
                    <span className="animate-pulse-glow text-4xl">🎃</span>
                    Ready to Resurrect!
                  </CardTitle>
                  <CardDescription className="text-[#a78bfa] text-lg">
                    Review your configuration and start the transformation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#1a0f2e] border border-[#5b21b6] rounded-lg p-4">
                      <p className="text-[#a78bfa] text-sm mb-1">Project Name</p>
                      <p className="text-lg font-semibold text-[#F7F7FF]">{config.name}</p>
                    </div>
                    <div className="bg-[#1a0f2e] border border-[#5b21b6] rounded-lg p-4">
                      <p className="text-[#a78bfa] text-sm mb-1">Template</p>
                      <p className="text-lg font-semibold text-[#F7F7FF]">
                        {TEMPLATES.find(t => t.id === config.template)?.name}
                      </p>
                    </div>
                    <div className="bg-[#1a0f2e] border border-[#5b21b6] rounded-lg p-4">
                      <p className="text-[#a78bfa] text-sm mb-1">Files</p>
                      <p className="text-lg font-semibold text-[#F7F7FF]">
                        {files.filter(f => f.valid).length} ABAP files
                      </p>
                    </div>
                    <div className="bg-[#1a0f2e] border border-[#5b21b6] rounded-lg p-4">
                      <p className="text-[#a78bfa] text-sm mb-1">Estimated Time</p>
                      <p className="text-lg font-semibold text-[#F7F7FF]">
                        ~{Math.ceil((analysis?.linesOfCode || 0) / 400)} min
                      </p>
                    </div>
                  </div>

                  {/* What Happens Next */}
                  <div className="bg-[#2e1065]/50 p-6 rounded-lg border border-[#5b21b6]">
                    <h4 className="text-[#FF6B35] font-semibold mb-4 flex items-center gap-2">
                      <span>🔮</span>
                      The Resurrection Ritual
                    </h4>
                    <ul className="space-y-3 text-sm text-[#a78bfa]">
                      <li className="flex items-start gap-3">
                        <span className="text-[#FF6B35] font-bold">1.</span>
                        <span><strong className="text-[#F7F7FF]">ANALYZE:</strong> Parse ABAP code and extract business logic using ABAP Analyzer MCP</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#FF6B35] font-bold">2.</span>
                        <span><strong className="text-[#F7F7FF]">PLAN:</strong> Create transformation architecture with SAP CAP MCP guidance</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#FF6B35] font-bold">3.</span>
                        <span><strong className="text-[#F7F7FF]">GENERATE:</strong> Create CAP models, services, and Fiori UI using SAP UI5 MCP</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#FF6B35] font-bold">4.</span>
                        <span><strong className="text-[#F7F7FF]">VALIDATE:</strong> Check quality and Clean Core compliance</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#FF6B35] font-bold">5.</span>
                        <span><strong className="text-[#F7F7FF]">DEPLOY:</strong> Create GitHub repository and send Slack notification</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-8">
          <Button
            onClick={handleBack}
            disabled={currentStep === 'upload' || analyzing || starting}
            variant="outline"
            className="border-[#5b21b6] text-[#a78bfa] hover:bg-[#2e1065]/50 disabled:opacity-50"
          >
            ← Back
          </Button>

          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="border-[#5b21b6] text-[#a78bfa] hover:bg-[#2e1065]/50"
            >
              Cancel
            </Button>

            {currentStep !== 'confirm' ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || analyzing}
                className="bg-[#FF6B35] hover:bg-[#E85A2A] text-[#F7F7FF] shadow-[0_0_20px_rgba(255,107,53,0.5)] disabled:opacity-50 transition-all hover:scale-105"
              >
                {analyzing ? (
                  <>
                    <span className="mr-2 animate-spin">🔮</span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    Next →
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleStartResurrection}
                disabled={starting}
                className="bg-[#FF6B35] hover:bg-[#E85A2A] text-[#F7F7FF] shadow-[0_0_30px_rgba(255,107,53,0.6)] disabled:opacity-50 transition-all hover:scale-110 animate-eerie-glow"
              >
                {starting ? (
                  <>
                    <span className="mr-2 animate-spin">🔮</span>
                    Starting...
                  </>
                ) : (
                  <>
                    <span className="mr-2 animate-pulse-glow text-2xl">🎃</span>
                    Start Resurrection!
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
