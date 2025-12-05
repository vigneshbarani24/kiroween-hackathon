'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SpecProgress } from '@/components/SpecProgress';

interface Resurrection {
  id: string;
  name: string;
  description: string | null;
  status: string;
  module: string;
  githubRepo: string | null;
  githubUrl: string | null;
  githubMethod: string | null;
  basUrl: string | null;
  deploymentUrl: string | null;
  deploymentStatus: string | null;
  originalLOC: number | null;
  transformedLOC: number | null;
  locSaved: number | null;
  complexityScore: number | null;
  qualityScore: number | null;
  createdAt: string;
  updatedAt: string;
}

interface QualityReport {
  overallScore: number;
  syntaxValid: boolean;
  cleanCoreCompliant: boolean;
  businessLogicPreserved: boolean;
  testCoverage: number | null;
  issues: any;
  recommendations: any;
}

const STATUS_CONFIG = {
  UPLOADED: { icon: '📤', label: 'Uploaded', color: 'bg-[#6b7280]' },
  ANALYZING: { icon: '👻', label: 'Analyzing', color: 'bg-[#8b5cf6]' },
  ANALYZED: { icon: '🔍', label: 'Analyzed', color: 'bg-[#8b5cf6]' },
  PLANNING: { icon: '📋', label: 'Planning', color: 'bg-[#8b5cf6]' },
  GENERATING: { icon: '⚡', label: 'Generating', color: 'bg-[#FF6B35]' },
  VALIDATING: { icon: '✅', label: 'Validating', color: 'bg-[#FF6B35]' },
  DEPLOYING: { icon: '🚀', label: 'Deploying', color: 'bg-[#FF6B35]' },
  COMPLETED: { icon: '⚰️', label: 'Resurrected', color: 'bg-[#10B981]' },
  FAILED: { icon: '🦇', label: 'Cursed', color: 'bg-[#dc2626]' },
};

export default function ResurrectionResultsPage() {
  const params = useParams();
  const router = useRouter();
  const resurrectionId = params?.id as string;

  const [resurrection, setResurrection] = useState<Resurrection | null>(null);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [specProgress, setSpecProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchResurrectionData();
    
    // Poll for status updates if in progress
    const pollInterval = setInterval(() => {
      if (resurrection && !['COMPLETED', 'FAILED'].includes(resurrection.status)) {
        fetchResurrectionData();
      }
    }, 3000); // Poll every 3 seconds
    
    return () => clearInterval(pollInterval);
  }, [resurrectionId, resurrection?.status]);

  const fetchResurrectionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch resurrection details
      const resResponse = await fetch(`/api/resurrections/${resurrectionId}`);
      if (!resResponse.ok) {
        throw new Error('Failed to fetch resurrection details');
      }
      const resData = await resResponse.json();
      setResurrection(resData);

      // Fetch quality report if available
      try {
        const qualityResponse = await fetch(`/api/resurrections/${resurrectionId}/quality`);
        if (qualityResponse.ok) {
          const qualityData = await qualityResponse.json();
          setQualityReport(qualityData);
        }
      } catch (err) {
        // Quality report might not exist yet
        console.log('Quality report not available');
      }

      // Fetch spec progress if available
      if (resData.name) {
        try {
          const specResponse = await fetch(`/api/resurrections/${resurrectionId}/spec/progress?projectName=${resData.name}`);
          if (specResponse.ok) {
            const specData = await specResponse.json();
            if (specData.success) {
              setSpecProgress(specData.progress);
            }
          }
        } catch (err) {
          // Spec might not exist
          console.log('Spec not available');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await fetch(`/api/resurrections/${resurrectionId}/export`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download the zip file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resurrection?.name || 'resurrection'}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert('🦇 Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a0f2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <span className="text-8xl animate-float">👻</span>
          <p className="text-2xl text-[#a78bfa] mt-4">Summoning resurrection details...</p>
        </div>
      </div>
    );
  }

  if (error || !resurrection) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a0f2e] to-[#0a0a0f] flex items-center justify-center p-8">
        <Card className="border-2 border-[#dc2626] bg-[#2e1065]/30 max-w-md">
          <CardHeader>
            <CardTitle className="text-[#dc2626] flex items-center gap-2">
              <span className="text-4xl">🦇</span>
              Haunted Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#a78bfa] mb-4">
              {error || 'Resurrection not found'}
            </p>
            <Link href="/">
              <Button className="bg-[#FF6B35] hover:bg-[#E85A2A] text-[#F7F7FF]">
                ← Return to Crypt
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[resurrection.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.UPLOADED;
  const isCompleted = resurrection.status === 'COMPLETED';
  const isFailed = resurrection.status === 'FAILED';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0f2e] to-[#0a0a0f] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button 
              variant="outline" 
              className="border-[#5b21b6] text-[#a78bfa] hover:bg-[#2e1065]/50 mb-4"
            >
              ← Back to Crypt
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-6xl">{statusConfig.icon}</span>
                <div>
                  <h1 className="text-4xl font-bold text-[#FF6B35]">
                    {resurrection.name}
                  </h1>
                  <p className="text-[#a78bfa] text-lg">
                    {resurrection.description || 'ABAP Resurrection Project'}
                  </p>
                </div>
              </div>
            </div>

            <Badge 
              className={`${statusConfig.color} text-white text-lg px-4 py-2`}
            >
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Transformation Metrics - Tombstone Cards */}
          <Card className="border-2 border-[#5b21b6] bg-gradient-to-b from-[#2e1065] to-[#1a0f2e] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all">
            <CardHeader>
              <CardTitle className="text-[#FF6B35] flex items-center gap-2">
                <span>💀</span>
                Lines of Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-[#a78bfa]">Original ABAP</p>
                  <p className="text-3xl font-bold text-[#F7F7FF]">
                    {resurrection.originalLOC?.toLocaleString() || '—'}
                  </p>
                </div>
                {resurrection.locSaved !== null && resurrection.locSaved > 0 && (
                  <div className="pt-3 border-t border-[#5b21b6]">
                    <p className="text-sm text-[#10B981]">✨ LOC Saved</p>
                    <p className="text-2xl font-bold text-[#10B981]">
                      {resurrection.locSaved.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#5b21b6] bg-gradient-to-b from-[#2e1065] to-[#1a0f2e] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all">
            <CardHeader>
              <CardTitle className="text-[#FF6B35] flex items-center gap-2">
                <span>🕸️</span>
                Complexity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-[#a78bfa]">Complexity Score</p>
                  <p className="text-3xl font-bold text-[#F7F7FF]">
                    {resurrection.complexityScore?.toFixed(1) || '—'}
                  </p>
                </div>
                <div className="pt-3 border-t border-[#5b21b6]">
                  <p className="text-sm text-[#a78bfa]">Module</p>
                  <Badge variant="outline" className="border-[#8b5cf6] text-[#a78bfa] mt-1">
                    {resurrection.module}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#5b21b6] bg-gradient-to-b from-[#2e1065] to-[#1a0f2e] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all">
            <CardHeader>
              <CardTitle className="text-[#FF6B35] flex items-center gap-2">
                <span>✨</span>
                Quality Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-[#a78bfa]">Overall Quality</p>
                  <p className="text-3xl font-bold text-[#F7F7FF]">
                    {resurrection.qualityScore !== null 
                      ? `${resurrection.qualityScore}%` 
                      : '—'}
                  </p>
                </div>
                {resurrection.qualityScore !== null && (
                  <Progress 
                    value={resurrection.qualityScore} 
                    className="h-2"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Spec Progress */}
        {specProgress && (
          <div className="mb-6">
            <SpecProgress
              specPath={specProgress.specPath}
              tasksCompleted={specProgress.tasksCompleted}
              tasksTotal={specProgress.tasksTotal}
              requirementsCount={specProgress.requirementsCount}
              propertiesCount={specProgress.propertiesCount}
            />
          </div>
        )}

        {/* Quality Report */}
        {qualityReport && (
          <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30 mb-6">
            <CardHeader>
              <CardTitle className="text-[#FF6B35] flex items-center gap-2">
                <span>🔍</span>
                Quality Validation Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-[#1a0f2e] border border-[#5b21b6] rounded-lg">
                  <span className="text-3xl">
                    {qualityReport.syntaxValid ? '✅' : '❌'}
                  </span>
                  <div>
                    <p className="text-[#F7F7FF] font-semibold">Syntax Valid</p>
                    <p className="text-sm text-[#a78bfa]">
                      {qualityReport.syntaxValid ? 'All checks passed' : 'Issues found'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-[#1a0f2e] border border-[#5b21b6] rounded-lg">
                  <span className="text-3xl">
                    {qualityReport.cleanCoreCompliant ? '✅' : '❌'}
                  </span>
                  <div>
                    <p className="text-[#F7F7FF] font-semibold">Clean Core</p>
                    <p className="text-sm text-[#a78bfa]">
                      {qualityReport.cleanCoreCompliant ? 'Compliant' : 'Non-compliant'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-[#1a0f2e] border border-[#5b21b6] rounded-lg">
                  <span className="text-3xl">
                    {qualityReport.businessLogicPreserved ? '✅' : '❌'}
                  </span>
                  <div>
                    <p className="text-[#F7F7FF] font-semibold">Logic Preserved</p>
                    <p className="text-sm text-[#a78bfa]">
                      {qualityReport.businessLogicPreserved ? '100% preserved' : 'Issues detected'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* GitHub & Deployment Links */}
        {isCompleted && (
          <Card className="border-2 border-[#10B981] bg-gradient-to-br from-[#2e1065]/50 to-[#1a0f2e] shadow-[0_0_40px_rgba(16,185,129,0.3)] mb-6">
            <CardHeader>
              <CardTitle className="text-[#10B981] flex items-center gap-2 text-2xl">
                <span>🎉</span>
                Resurrection Complete!
              </CardTitle>
              <CardDescription className="text-[#a78bfa] text-lg">
                Your modern SAP CAP application is ready
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* GitHub Repository */}
              {resurrection.githubUrl && (
                <div className="p-4 bg-[#1a0f2e] border border-[#5b21b6] rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🪦</span>
                        <h3 className="text-[#F7F7FF] font-semibold text-lg">
                          GitHub Repository
                        </h3>
                      </div>
                      <p className="text-[#a78bfa] text-sm mb-3">
                        Complete CAP project with CDS models, services, and Fiori UI
                      </p>
                      <code className="text-xs text-[#8b5cf6] bg-[#2e1065] px-2 py-1 rounded">
                        {resurrection.githubUrl}
                      </code>
                    </div>
                    <a 
                      href={resurrection.githubUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button className="bg-[#FF6B35] hover:bg-[#E85A2A] text-[#F7F7FF]">
                        <span className="mr-2">🔗</span>
                        Open GitHub
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              {/* SAP BAS Link */}
              {resurrection.basUrl && (
                <div className="p-4 bg-[#1a0f2e] border border-[#5b21b6] rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">💻</span>
                        <h3 className="text-[#F7F7FF] font-semibold text-lg">
                          SAP Business Application Studio
                        </h3>
                      </div>
                      <p className="text-[#a78bfa] text-sm mb-3">
                        Open your resurrection in SAP's cloud IDE for further development
                      </p>
                    </div>
                    <a 
                      href={resurrection.basUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button 
                        variant="outline"
                        className="border-[#8b5cf6] text-[#a78bfa] hover:bg-[#2e1065]/50"
                      >
                        <span className="mr-2">🚀</span>
                        Open in BAS
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              {/* Deployment URL */}
              {resurrection.deploymentUrl && (
                <div className="p-4 bg-[#1a0f2e] border border-[#5b21b6] rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🌐</span>
                        <h3 className="text-[#F7F7FF] font-semibold text-lg">
                          Live Application
                        </h3>
                        <Badge className="bg-[#10B981] text-white">
                          {resurrection.deploymentStatus || 'DEPLOYED'}
                        </Badge>
                      </div>
                      <p className="text-[#a78bfa] text-sm mb-3">
                        Your application is live on SAP BTP
                      </p>
                      <code className="text-xs text-[#8b5cf6] bg-[#2e1065] px-2 py-1 rounded">
                        {resurrection.deploymentUrl}
                      </code>
                    </div>
                    <a 
                      href={resurrection.deploymentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button className="bg-[#10B981] hover:bg-[#059669] text-white">
                        <span className="mr-2">🎯</span>
                        Visit App
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              {/* Export Button */}
              <div className="pt-4 border-t border-[#5b21b6]">
                <Button
                  onClick={handleExport}
                  disabled={exporting}
                  className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-[#F7F7FF] shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                  <span className="mr-2">📦</span>
                  {exporting ? 'Exporting...' : 'Export as .zip'}
                </Button>
                <p className="text-xs text-[#a78bfa] text-center mt-2">
                  Download complete CAP project for manual deployment
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Failed State */}
        {isFailed && (
          <Card className="border-2 border-[#dc2626] bg-[#2e1065]/30 mb-6">
            <CardHeader>
              <CardTitle className="text-[#dc2626] flex items-center gap-2">
                <span className="text-3xl">🦇</span>
                Resurrection Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#a78bfa] mb-4">
                The resurrection ritual encountered dark magic and could not complete.
                Please check the transformation logs for details.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={fetchResurrectionData}
                  variant="outline"
                  className="border-[#5b21b6] text-[#a78bfa] hover:bg-[#2e1065]/50"
                >
                  <span className="mr-2">🔄</span>
                  Retry
                </Button>
                <Link href="/">
                  <Button className="bg-[#FF6B35] hover:bg-[#E85A2A] text-[#F7F7FF]">
                    Start New Resurrection
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Details */}
        <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30 mb-6">
          <CardHeader>
            <CardTitle className="text-[#FF6B35] flex items-center gap-2">
              <span>📋</span>
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-[#a78bfa] mb-1">Created</p>
                  <p className="text-[#F7F7FF]">
                    {new Date(resurrection.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#a78bfa] mb-1">Last Updated</p>
                  <p className="text-[#F7F7FF]">
                    {new Date(resurrection.updatedAt).toLocaleString()}
                  </p>
                </div>
                {resurrection.githubMethod && (
                  <div>
                    <p className="text-sm text-[#a78bfa] mb-1">GitHub Method</p>
                    <Badge variant="outline" className="border-[#8b5cf6] text-[#a78bfa]">
                      {resurrection.githubMethod}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-[#a78bfa] mb-1">Resurrection ID</p>
                  <code className="text-xs text-[#8b5cf6] bg-[#1a0f2e] px-2 py-1 rounded">
                    {resurrection.id}
                  </code>
                </div>
                {resurrection.githubRepo && (
                  <div>
                    <p className="text-sm text-[#a78bfa] mb-1">Repository Name</p>
                    <code className="text-xs text-[#8b5cf6] bg-[#1a0f2e] px-2 py-1 rounded">
                      {resurrection.githubRepo}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/20">
          <CardContent className="pt-6">
            <h3 className="text-[#FF6B35] font-semibold mb-3 flex items-center gap-2">
              <span>🔮</span>
              What's Next?
            </h3>
            <ul className="space-y-2 text-sm text-[#a78bfa]">
              {isCompleted ? (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6B35]">1.</span>
                    <span>Clone the GitHub repository and explore the generated CAP project</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6B35]">2.</span>
                    <span>Open in SAP BAS to continue development and customization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6B35]">3.</span>
                    <span>Run <code className="text-[#8b5cf6]">npm install && cds watch</code> for local testing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6B35]">4.</span>
                    <span>Deploy to SAP BTP using <code className="text-[#8b5cf6]">mbt build && cf deploy</code></span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6B35]">•</span>
                    <span>The resurrection ritual is still in progress. Check back soon!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6B35]">•</span>
                    <span>You'll receive a notification when the transformation is complete</span>
                  </li>
                </>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Floating Ghost */}
      <div className="fixed bottom-20 right-20 text-6xl animate-float opacity-20 pointer-events-none">
        👻
      </div>
    </div>
  );
}
