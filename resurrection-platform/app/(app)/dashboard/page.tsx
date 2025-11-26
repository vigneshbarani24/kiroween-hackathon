'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  TrendingUp, 
  Code2, 
  Sparkles,
  ArrowUpRight,
  Search,
  Filter,
  Plus
} from 'lucide-react';

interface Resurrection {
  id: string;
  name: string;
  description?: string;
  status: string;
  module: string;
  githubUrl?: string;
  basUrl?: string;
  originalLOC: number;
  locSaved?: number;
  qualityScore?: number;
  abapObjectCount: number;
  transformationLogCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
  totalLOC: number;
  totalSaved: number;
  avgQuality: number;
}

export default function DashboardPage() {
  const [resurrections, setResurrections] = useState<Resurrection[]>([]);
  const [filteredResurrections, setFilteredResurrections] = useState<Resurrection[]>([]);
  const [stats, setStats] = useState<Stats>({ 
    total: 0, 
    completed: 0, 
    inProgress: 0, 
    failed: 0,
    totalLOC: 0,
    totalSaved: 0,
    avgQuality: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [resurrections, searchQuery, statusFilter, moduleFilter, sortBy]);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/resurrections');
      if (response.ok) {
        const data = await response.json();
        const resData = data.resurrections || [];
        setResurrections(resData);
        
        // Calculate comprehensive stats
        const total = resData.length;
        const completed = resData.filter((r: Resurrection) => 
          r.status === 'COMPLETED' || r.status === 'DEPLOYED'
        ).length;
        const inProgress = resData.filter((r: Resurrection) => 
          r.status === 'UPLOADED' || r.status === 'ANALYZING' || 
          r.status === 'PLANNING' || r.status === 'GENERATING' || 
          r.status === 'VALIDATING'
        ).length;
        const failed = resData.filter((r: Resurrection) => 
          r.status === 'FAILED'
        ).length;
        
        const totalLOC = resData.reduce((sum: number, r: Resurrection) => 
          sum + (r.originalLOC || 0), 0
        );
        const totalSaved = resData.reduce((sum: number, r: Resurrection) => 
          sum + (r.locSaved || 0), 0
        );
        const qualityScores = resData
          .filter((r: Resurrection) => r.qualityScore)
          .map((r: Resurrection) => r.qualityScore || 0);
        const avgQuality = qualityScores.length > 0
          ? Math.round(qualityScores.reduce((a: number, b: number) => a + b, 0) / qualityScores.length)
          : 0;
        
        setStats({ total, completed, inProgress, failed, totalLOC, totalSaved, avgQuality });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...resurrections];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Apply module filter
    if (moduleFilter !== 'all') {
      filtered = filtered.filter(r => r.module === moduleFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'loc':
          return (b.originalLOC || 0) - (a.originalLOC || 0);
        case 'quality':
          return (b.qualityScore || 0) - (a.qualityScore || 0);
        default:
          return 0;
      }
    });

    setFilteredResurrections(filtered);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/resurrections/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload data
        await loadDashboardData();
      } else {
        alert('Failed to delete resurrection');
      }
    } catch (error) {
      console.error('Error deleting resurrection:', error);
      alert('Failed to delete resurrection');
    }
  };

  const handleExport = async (id: string) => {
    try {
      const response = await fetch(`/api/resurrections/${id}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resurrection-${id}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Export not available for this resurrection');
      }
    } catch (error) {
      console.error('Error exporting resurrection:', error);
      alert('Failed to export resurrection');
    }
  };

  const getUniqueModules = () => {
    const modules = new Set(resurrections.map(r => r.module));
    return Array.from(modules).sort();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'DEPLOYED':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'UPLOADED':
      case 'ANALYZING':
      case 'PLANNING':
      case 'GENERATING':
      case 'VALIDATING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'FAILED':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'DEPLOYED':
        return '✅';
      case 'UPLOADED':
        return '📤';
      case 'ANALYZING':
        return '🔍';
      case 'PLANNING':
        return '📋';
      case 'GENERATING':
        return '⚡';
      case 'VALIDATING':
        return '🔬';
      case 'FAILED':
        return '❌';
      default:
        return '⏳';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🎃</div>
          <p className="text-[#a78bfa] text-xl">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 relative">
      {/* Spider Web Decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Spider web */}
          <circle cx="100" cy="100" r="80" fill="none" stroke="#8b5cf6" strokeWidth="1" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="#8b5cf6" strokeWidth="1" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="#8b5cf6" strokeWidth="1" />
          <circle cx="100" cy="100" r="20" fill="none" stroke="#8b5cf6" strokeWidth="1" />
          <line x1="100" y1="100" x2="100" y2="20" stroke="#8b5cf6" strokeWidth="1" />
          <line x1="100" y1="100" x2="156" y2="44" stroke="#8b5cf6" strokeWidth="1" />
          <line x1="100" y1="100" x2="180" y2="100" stroke="#8b5cf6" strokeWidth="1" />
          <line x1="100" y1="100" x2="156" y2="156" stroke="#8b5cf6" strokeWidth="1" />
          <line x1="100" y1="100" x2="100" y2="180" stroke="#8b5cf6" strokeWidth="1" />
          <line x1="100" y1="100" x2="44" y2="156" stroke="#8b5cf6" strokeWidth="1" />
          <line x1="100" y1="100" x2="20" y2="100" stroke="#8b5cf6" strokeWidth="1" />
          <line x1="100" y1="100" x2="44" y2="44" stroke="#8b5cf6" strokeWidth="1" />
          {/* Spider */}
          <circle cx="180" cy="40" r="4" fill="#FF6B35" />
          <circle cx="180" cy="40" r="2" fill="#000" />
        </svg>
      </div>
      
      {/* Floating Bats */}
      <div className="absolute top-20 left-10 text-4xl opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>
        🦇
      </div>
      <div className="absolute top-40 right-20 text-3xl opacity-20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
        🦇
      </div>
      
      {/* Header */}
      <div className="flex justify-between items-center relative z-10">
        <div>
          <h1 className="text-4xl font-bold text-[#FF6B35] mb-2 flex items-center gap-3">
            <span className="animate-pulse">🎃</span>
            Dashboard
            <span className="animate-pulse" style={{ animationDelay: '0.5s' }}>👻</span>
          </h1>
          <p className="text-[#a78bfa] text-lg">
            Monitor your ABAP transformations from beyond the grave
          </p>
        </div>
        <Link href="/upload">
          <Button 
            className="bg-[#FF6B35] hover:bg-[#E85A2A] text-[#F7F7FF] shadow-[0_0_20px_rgba(255,107,53,0.5)] relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></span>
            <span className="mr-2">🎃</span>
            New Resurrection
          </Button>
        </Link>
      </div>

      {/* Stats Grid - Tombstone Style */}
      <div className="grid md:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* Tombstone Card Component */}
        <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30 relative overflow-hidden rounded-t-[50%] rounded-b-lg">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="text-6xl">🕷️</div>
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[#a78bfa] text-xs font-medium flex items-center gap-1">
              <span>⚰️</span> Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#FF6B35]">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/50 bg-green-500/10 relative overflow-hidden rounded-t-[50%] rounded-b-lg">
          <div className="absolute top-0 right-0 text-2xl opacity-20">🦇</div>
          <CardHeader className="pb-2">
            <CardTitle className="text-green-400 text-xs font-medium flex items-center gap-1">
              <span>✅</span> Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-500/50 bg-yellow-500/10 relative overflow-hidden rounded-t-[50%] rounded-b-lg">
          <div className="absolute top-0 right-0 text-2xl opacity-20">🕸️</div>
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-400 text-xs font-medium flex items-center gap-1">
              <span>⏳</span> In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-500/50 bg-red-500/10 relative overflow-hidden rounded-t-[50%] rounded-b-lg">
          <div className="absolute top-0 right-0 text-2xl opacity-20">💀</div>
          <CardHeader className="pb-2">
            <CardTitle className="text-red-400 text-xs font-medium flex items-center gap-1">
              <span>❌</span> Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">{stats.failed}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30 relative overflow-hidden rounded-t-[50%] rounded-b-lg">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <path d="M0,50 Q25,40 50,50 T100,50" stroke="#8b5cf6" fill="none" strokeWidth="0.5" opacity="0.3"/>
              <path d="M0,60 Q25,50 50,60 T100,60" stroke="#8b5cf6" fill="none" strokeWidth="0.5" opacity="0.3"/>
            </svg>
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[#a78bfa] text-xs font-medium flex items-center gap-1">
              <span>📊</span> Total LOC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#FF6B35]">
              {stats.totalLOC.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30 relative overflow-hidden rounded-t-[50%] rounded-b-lg">
          <div className="absolute top-0 right-0 text-2xl opacity-20">🎃</div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[#a78bfa] text-xs font-medium flex items-center gap-1">
              <span>💾</span> LOC Saved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">
              {stats.totalSaved.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30 relative overflow-hidden rounded-t-[50%] rounded-b-lg">
          <div className="absolute top-0 right-0 text-2xl opacity-20">👻</div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[#a78bfa] text-xs font-medium flex items-center gap-1">
              <span>⭐</span> Avg Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#FF6B35]">
              {stats.avgQuality}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Sorting */}
      <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="🔍 Search resurrections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs bg-[#2e1065]/30 border-[#5b21b6] text-[#F7F7FF] placeholder:text-[#a78bfa]"
            />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-[#2e1065]/30 border-[#5b21b6] text-[#F7F7FF]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a0f2e] border-[#5b21b6]">
                <SelectItem value="all" className="text-[#F7F7FF]">All Statuses</SelectItem>
                <SelectItem value="COMPLETED" className="text-[#F7F7FF]">Completed</SelectItem>
                <SelectItem value="ANALYZING" className="text-[#F7F7FF]">Analyzing</SelectItem>
                <SelectItem value="PLANNING" className="text-[#F7F7FF]">Planning</SelectItem>
                <SelectItem value="GENERATING" className="text-[#F7F7FF]">Generating</SelectItem>
                <SelectItem value="VALIDATING" className="text-[#F7F7FF]">Validating</SelectItem>
                <SelectItem value="FAILED" className="text-[#F7F7FF]">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[180px] bg-[#2e1065]/30 border-[#5b21b6] text-[#F7F7FF]">
                <SelectValue placeholder="Filter by module" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a0f2e] border-[#5b21b6]">
                <SelectItem value="all" className="text-[#F7F7FF]">All Modules</SelectItem>
                {getUniqueModules().map(module => (
                  <SelectItem key={module} value={module} className="text-[#F7F7FF]">
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-[#2e1065]/30 border-[#5b21b6] text-[#F7F7FF]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a0f2e] border-[#5b21b6]">
                <SelectItem value="newest" className="text-[#F7F7FF]">Newest First</SelectItem>
                <SelectItem value="oldest" className="text-[#F7F7FF]">Oldest First</SelectItem>
                <SelectItem value="name" className="text-[#F7F7FF]">Name (A-Z)</SelectItem>
                <SelectItem value="loc" className="text-[#F7F7FF]">LOC (High-Low)</SelectItem>
                <SelectItem value="quality" className="text-[#F7F7FF]">Quality (High-Low)</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto text-[#a78bfa] text-sm flex items-center">
              Showing {filteredResurrections.length} of {stats.total} resurrections
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resurrections List */}
      <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/20">
        <CardHeader>
          <CardTitle className="text-[#FF6B35] text-2xl">
            Your Resurrections
          </CardTitle>
          <CardDescription className="text-[#a78bfa]">
            Manage and monitor your ABAP transformations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredResurrections.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👻</div>
              <p className="text-[#a78bfa] text-lg mb-6">
                {resurrections.length === 0 
                  ? 'No resurrections yet. Start by uploading your first ABAP file!'
                  : 'No resurrections match your filters. Try adjusting your search criteria.'}
              </p>
              {resurrections.length === 0 && (
                <Link href="/upload">
                  <Button 
                    className="bg-[#FF6B35] hover:bg-[#E85A2A] text-[#F7F7FF]"
                  >
                    <span className="mr-2">🎃</span>
                    Upload ABAP
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResurrections.map((resurrection) => (
                <Card 
                  key={resurrection.id}
                  className="border border-[#5b21b6] bg-[#1a0f2e]/50 hover:border-[#8b5cf6] transition-all relative overflow-hidden group"
                >
                  {/* Tombstone top decoration */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#8b5cf6] to-transparent opacity-50"></div>
                  
                  {/* Floating ghost on hover */}
                  <div className="absolute top-2 right-2 text-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300">
                    👻
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-[#F7F7FF] font-semibold text-lg flex items-center gap-2">
                            <span className="text-xl">⚰️</span>
                            {resurrection.name}
                          </h3>
                          <Badge 
                            variant="outline"
                            className={getStatusColor(resurrection.status)}
                          >
                            {getStatusIcon(resurrection.status)} {resurrection.status}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className="bg-[#2e1065]/50 text-[#a78bfa] border-[#5b21b6]"
                          >
                            {resurrection.module}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className="bg-[#1a0f2e]/50 text-[#a78bfa] border-[#5b21b6]"
                          >
                            {resurrection.abapObjectCount} objects
                          </Badge>
                        </div>
                        {resurrection.description && (
                          <p className="text-[#a78bfa] text-sm mb-2">
                            {resurrection.description}
                          </p>
                        )}
                        
                        {/* Bat-wing progress bar for quality score */}
                        {resurrection.qualityScore && (
                          <div className="mb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[#a78bfa] text-xs">Quality Score</span>
                              <span className="text-[#FF6B35] text-xs font-bold">{resurrection.qualityScore}%</span>
                            </div>
                            <div className="relative h-2 bg-[#1a0f2e] rounded-full overflow-hidden border border-[#5b21b6]">
                              {/* Bat-wing shaped progress */}
                              <div 
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FF6B35] to-[#8b5cf6] transition-all duration-500"
                                style={{ 
                                  width: `${resurrection.qualityScore}%`,
                                  clipPath: 'polygon(0 0, 100% 0, 100% 100%, 95% 50%, 90% 100%, 85% 50%, 80% 100%, 75% 50%, 70% 100%, 65% 50%, 60% 100%, 55% 50%, 50% 100%, 45% 50%, 40% 100%, 35% 50%, 30% 100%, 25% 50%, 20% 100%, 15% 50%, 10% 100%, 5% 50%, 0 100%)'
                                }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                              </div>
                              {/* Bat decorations */}
                              <div className="absolute top-0 right-0 text-xs opacity-50">🦇</div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-4 text-[#a78bfa] text-sm">
                          <span>🕰️ {new Date(resurrection.createdAt).toLocaleString()}</span>
                          {resurrection.originalLOC > 0 && (
                            <span>• 📊 {resurrection.originalLOC.toLocaleString()} LOC</span>
                          )}
                          {resurrection.locSaved && resurrection.locSaved > 0 && (
                            <span>• 💾 Saved: {resurrection.locSaved.toLocaleString()} LOC</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/resurrections/${resurrection.id}`}>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="border-[#5b21b6] text-[#a78bfa] hover:bg-[#2e1065]/50"
                            title="View Details"
                          >
                            <span className="mr-2">👁️</span>
                            View
                          </Button>
                        </Link>
                        {resurrection.githubUrl && (
                          <a href={resurrection.githubUrl} target="_blank" rel="noopener noreferrer">
                            <Button 
                              variant="outline"
                              size="sm"
                              className="border-[#5b21b6] text-[#a78bfa] hover:bg-[#2e1065]/50"
                              title="Open GitHub Repository"
                            >
                              <span className="mr-2">🐙</span>
                              GitHub
                            </Button>
                          </a>
                        )}
                        {(resurrection.status === 'COMPLETED' || resurrection.status === 'DEPLOYED') && (
                          <Button 
                            variant="outline"
                            size="sm"
                            className="border-[#5b21b6] text-[#a78bfa] hover:bg-[#2e1065]/50"
                            onClick={() => handleExport(resurrection.id)}
                            title="Export as ZIP"
                          >
                            <span className="mr-2">📦</span>
                            Export
                          </Button>
                        )}
                        <Button 
                          variant="outline"
                          size="sm"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                          onClick={() => handleDelete(resurrection.id, resurrection.name)}
                          title="Delete Resurrection"
                        >
                          <span className="mr-2">🗑️</span>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions - Tombstone Style */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30 hover:border-[#8b5cf6] transition-all cursor-pointer relative overflow-hidden group rounded-t-[40%] rounded-b-lg">
          {/* Spider web corner decoration */}
          <div className="absolute top-0 right-0 w-16 h-16 opacity-20">
            <svg viewBox="0 0 50 50" className="w-full h-full">
              <circle cx="40" cy="10" r="8" fill="none" stroke="#8b5cf6" strokeWidth="0.5" />
              <circle cx="40" cy="10" r="5" fill="none" stroke="#8b5cf6" strokeWidth="0.5" />
              <line x1="40" y1="10" x2="40" y2="2" stroke="#8b5cf6" strokeWidth="0.5" />
              <line x1="40" y1="10" x2="48" y2="10" stroke="#8b5cf6" strokeWidth="0.5" />
              <line x1="40" y1="10" x2="46" y2="4" stroke="#8b5cf6" strokeWidth="0.5" />
              <line x1="40" y1="10" x2="46" y2="16" stroke="#8b5cf6" strokeWidth="0.5" />
            </svg>
          </div>
          <CardHeader>
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📤</div>
            <CardTitle className="text-[#FF6B35]">Upload ABAP</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-[#a78bfa] mb-4">
              Start a new resurrection by uploading ABAP files from the crypt
            </CardDescription>
            <Link href="/upload">
              <Button 
                variant="outline"
                className="w-full border-[#5b21b6] text-[#a78bfa] hover:bg-[#2e1065] hover:text-[#FF6B35]"
              >
                <span className="mr-2">🎃</span>
                Upload Files
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30 hover:border-[#8b5cf6] transition-all cursor-pointer relative overflow-hidden group rounded-t-[40%] rounded-b-lg">
          <div className="absolute top-2 left-2 text-xl opacity-20 group-hover:opacity-40 transition-opacity">
            🦇
          </div>
          <CardHeader>
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">⚰️</div>
            <CardTitle className="text-[#FF6B35]">View All</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-[#a78bfa] mb-4">
              Browse all your resurrections rising from the grave
            </CardDescription>
            <Link href="/resurrections">
              <Button 
                variant="outline"
                className="w-full border-[#5b21b6] text-[#a78bfa] hover:bg-[#2e1065] hover:text-[#FF6B35]"
              >
                <span className="mr-2">👻</span>
                View Resurrections
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30 hover:border-[#8b5cf6] transition-all cursor-pointer relative overflow-hidden group rounded-t-[40%] rounded-b-lg">
          <div className="absolute top-2 right-2 text-xl opacity-20 group-hover:opacity-40 transition-opacity">
            🕷️
          </div>
          <CardHeader>
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📈</div>
            <CardTitle className="text-[#FF6B35]">Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-[#a78bfa] mb-4">
              View insights and metrics from the spirit realm
            </CardDescription>
            <Link href="/analytics">
              <Button 
                variant="outline"
                className="w-full border-[#5b21b6] text-[#a78bfa] hover:bg-[#2e1065] hover:text-[#FF6B35]"
              >
                <span className="mr-2">🔮</span>
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
