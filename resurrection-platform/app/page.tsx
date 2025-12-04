'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Code2, GitBranch, Sparkles, BarChart3, Shield, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-slate-900">SAP Modernization Platform</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/intelligence">
                <Button variant="ghost">Intelligence</Button>
              </Link>
              <Link href="/docs">
                <Button variant="ghost">Documentation</Button>
              </Link>
              <Link href="/resurrections/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Open Source Alternative to SAP Legacy AI
          </div>
          
          <h1 className="text-6xl font-bold text-slate-900 mb-6 tracking-tight">
            Modernize Legacy ABAP to
            <br />
            <span className="text-blue-600">SAP Cloud Application Programming</span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Transform decades of legacy ABAP code into modern, cloud-native SAP CAP applications. 
            Accelerate your S/4HANA migration with AI-powered code analysis and automated transformation.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link href="/resurrections/new">
              <Button 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6"
              >
                Start Transformation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button 
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6"
              >
                View Documentation
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <Card className="border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-slate-900">
                Custom Code Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-600">
                AI-powered analysis extracts business logic, dependencies, and patterns. Get complete visibility into your SAP custom code landscape with auto-generated documentation.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-slate-900">
                Automated Transformation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-600">
                5-step workflow generates production-ready SAP CAP applications with CDS models, services, and Fiori UI. Business logic preservation guaranteed.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <GitBranch className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-slate-900">
                GitHub Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-600">
                Automatically creates GitHub repositories with complete CAP projects, CI/CD pipelines, and deployment configurations ready for SAP BTP.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 mb-20 text-white">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">75%</div>
              <p className="text-blue-100 text-lg">Faster Development</p>
              <p className="text-blue-200 text-sm mt-1">vs manual transformation</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">50%</div>
              <p className="text-blue-100 text-lg">Cost Reduction</p>
              <p className="text-blue-200 text-sm mt-1">in modernization projects</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100%</div>
              <p className="text-blue-100 text-lg">Clean Core Compliant</p>
              <p className="text-blue-200 text-sm mt-1">SAP best practices enforced</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-600">
              Automated 5-step transformation workflow powered by AI and MCP servers
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { 
                step: 1, 
                title: 'Upload & Analyze', 
                desc: 'Upload ABAP files and let AI analyze code structure, business logic, and dependencies',
                icon: Code2,
                color: 'blue'
              },
              { 
                step: 2, 
                title: 'Intelligence Dashboard', 
                desc: 'Explore your code landscape with dependency graphs, redundancy detection, and Q&A',
                icon: BarChart3,
                color: 'purple'
              },
              { 
                step: 3, 
                title: 'Plan Transformation', 
                desc: 'AI creates transformation plan with CDS models, services, and architecture design',
                icon: Sparkles,
                color: 'green'
              },
              { 
                step: 4, 
                title: 'Generate CAP Code', 
                desc: 'Automated generation of complete SAP CAP application with business logic preserved',
                icon: Zap,
                color: 'yellow'
              },
              { 
                step: 5, 
                title: 'Validate Quality', 
                desc: 'Automated quality checks ensure Clean Core compliance and business logic preservation',
                icon: Shield,
                color: 'red'
              },
              { 
                step: 6, 
                title: 'Deploy to GitHub', 
                desc: 'Create GitHub repository with CI/CD pipelines and deploy to SAP BTP',
                icon: GitBranch,
                color: 'indigo'
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card 
                  key={item.step}
                  className="border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg bg-${item.color}-100 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 text-${item.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-500 mb-1">Step {item.step}</div>
                        <h3 className="text-slate-900 font-semibold text-lg mb-2">
                          {item.title}
                        </h3>
                        <p className="text-slate-600 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="border-2 border-[#FF6B35] bg-gradient-to-br from-[#2e1065]/50 to-[#1a0f2e] shadow-[0_0_40px_rgba(255,107,53,0.3)]">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold text-[#FF6B35] mb-4">
              Ready to Resurrect Your ABAP?
            </h2>
            <p className="text-xl text-[#a78bfa] mb-8">
              Join the modernization revolution. Transform legacy code into Clean Core applications.
            </p>
            <Link href="/resurrections/new">
              <Button 
                size="lg"
                className="bg-[#FF6B35] hover:bg-[#E85A2A] text-[#F7F7FF] text-xl px-12 py-8 shadow-[0_0_30px_rgba(255,107,53,0.5)]"
              >
                <span className="mr-3 text-3xl">🎃</span>
                Begin Your Resurrection
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Floating Ghosts */}
      <div className="fixed top-20 right-20 text-6xl animate-float opacity-20 pointer-events-none">
        👻
      </div>
      <div className="fixed bottom-20 left-20 text-6xl animate-float opacity-20 pointer-events-none" style={{ animationDelay: '1s' }}>
        👻
      </div>
    </div>
  );
}
