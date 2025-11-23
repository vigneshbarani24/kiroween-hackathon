/**
 * Intelligence Dashboard
 * Complete UI for Custom Code Intelligence features
 * 
 * Features:
 * - Stats overview
 * - File browser
 * - Documentation viewer
 * - Q&A interface
 * - Dependency graph
 * - Redundancy report
 */

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { DependencyGraph } from '../components/DependencyGraph';
import { QAInterface } from '../components/QAInterface';

interface Stats {
  totalFiles: number;
  totalLines: number;
  modules: number;
  redundancies: number;
  files: Array<{
    id: string;
    name: string;
    type: string;
    module: string;
    documentation: string;
  }>;
}

interface Redundancy {
  file1: { name: string; type: string };
  file2: { name: string; type: string };
  similarity: number;
  recommendation: string;
  potentialSavings: {
    linesOfCode: number;
    effort: string;
  };
}

export function IntelligenceDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [redundancies, setRedundancies] = useState<Redundancy[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'docs' | 'qa' | 'graph' | 'redundancy'>('overview');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // In a real app, these would be actual API calls
      // For now, using mock data
      setStats({
        totalFiles: 15,
        totalLines: 3500,
        modules: 3,
        redundancies: 4,
        files: []
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', color: '#1a1a1a' }}>
          🧠 Custom Code Intelligence
        </h1>
        <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '16px' }}>
          AI-powered SAP ABAP code analysis and modernization
        </p>
      </header>
      
      {/* Navigation Tabs */}
      <nav style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '10px'
      }}>
        {[
          { id: 'overview', label: '📊 Overview', icon: '📊' },
          { id: 'docs', label: '📝 Documentation', icon: '📝' },
          { id: 'qa', label: '❓ Q&A', icon: '❓' },
          { id: 'graph', label: '🕸️ Dependencies', icon: '🕸️' },
          { id: 'redundancy', label: '🔍 Redundancies', icon: '🔍' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '10px 20px',
              background: activeTab === tab.id ? '#2196F3' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#666',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <StatCard
              title="Total Files"
              value={stats?.totalFiles || 0}
              icon="📄"
              color="#4CAF50"
            />
            <StatCard
              title="Lines of Code"
              value={stats?.totalLines.toLocaleString() || 0}
              icon="💻"
              color="#2196F3"
            />
            <StatCard
              title="Modules"
              value={stats?.modules || 0}
              icon="📦"
              color="#FF9800"
            />
            <StatCard
              title="Redundancies Found"
              value={stats?.redundancies || 0}
              icon="🔍"
              color="#f44336"
            />
          </div>
          
          {/* Quick Actions */}
          <section style={{
            background: '#f9f9f9',
            padding: '30px',
            borderRadius: '12px',
            marginBottom: '30px'
          }}>
            <h2 style={{ marginTop: 0 }}>🚀 Quick Actions</h2>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <ActionButton
                label="Upload ABAP Files"
                icon="📤"
                onClick={() => alert('Upload feature coming soon!')}
              />
              <ActionButton
                label="Generate Documentation"
                icon="📝"
                onClick={() => setActiveTab('docs')}
              />
              <ActionButton
                label="Ask Questions"
                icon="❓"
                onClick={() => setActiveTab('qa')}
              />
              <ActionButton
                label="View Dependencies"
                icon="🕸️"
                onClick={() => setActiveTab('graph')}
              />
              <ActionButton
                label="Find Duplicates"
                icon="🔍"
                onClick={() => setActiveTab('redundancy')}
              />
            </div>
          </section>
          
          {/* Recent Activity */}
          <section>
            <h2>📋 Recent Activity</h2>
            <div style={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <ActivityItem
                icon="📝"
                text="Documentation generated for Z_CALCULATE_DISCOUNT"
                time="2 minutes ago"
              />
              <ActivityItem
                icon="❓"
                text="Question answered: 'What does the pricing function do?'"
                time="5 minutes ago"
              />
              <ActivityItem
                icon="🔍"
                text="Found 4 redundant code patterns"
                time="10 minutes ago"
              />
            </div>
          </section>
        </div>
      )}
      
      {/* Documentation Tab */}
      {activeTab === 'docs' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
          <div style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '20px',
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0 }}>Files</h3>
            {['Z_CALCULATE_DISCOUNT', 'Z_PRICING_PROCEDURE', 'Z_CREDIT_CHECK'].map(file => (
              <div
                key={file}
                onClick={() => setSelectedFile({ name: file })}
                style={{
                  padding: '12px',
                  background: selectedFile?.name === file ? '#e3f2fd' : 'transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '8px',
                  border: selectedFile?.name === file ? '2px solid #2196F3' : '2px solid transparent'
                }}
              >
                📄 {file}
              </div>
            ))}
          </div>
          
          <div style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '30px',
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            {selectedFile ? (
              <div>
                <h2>{selectedFile.name}</h2>
                <ReactMarkdown>
                  {`## Overview\nThis function calculates customer discounts based on order value.\n\n## Business Logic\n- Queries VBAK table for customer orders\n- Applies 10% discount for orders over $1000\n- Returns discount amount\n\n## Technical Details\n- Type: FUNCTION\n- Module: SD\n- Complexity: Low`}
                </ReactMarkdown>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: '60px 0' }}>
                <p style={{ fontSize: '48px', margin: 0 }}>📄</p>
                <p>Select a file to view documentation</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Q&A Tab */}
      {activeTab === 'qa' && (
        <div>
          <QAInterface />
        </div>
      )}
      
      {/* Dependency Graph Tab */}
      {activeTab === 'graph' && (
        <div>
          <div style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '30px'
          }}>
            <h2 style={{ marginTop: 0 }}>🕸️ Dependency Graph</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Visual representation of code dependencies and relationships
            </p>
            
            {graphData ? (
              <DependencyGraph data={graphData} />
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px 0',
                background: '#f9f9f9',
                borderRadius: '8px'
              }}>
                <p style={{ fontSize: '48px', margin: 0 }}>🕸️</p>
                <p style={{ color: '#666' }}>Upload ABAP files to generate dependency graph</p>
                <button style={{
                  marginTop: '20px',
                  padding: '12px 24px',
                  background: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  Upload Files
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Redundancy Tab */}
      {activeTab === 'redundancy' && (
        <div>
          <div style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '30px'
          }}>
            <h2 style={{ marginTop: 0 }}>🔍 Redundant Code Detection</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>
              Find duplicate and similar code to reduce maintenance burden
            </p>
            
            {/* Summary */}
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '30px'
            }}>
              <h3 style={{ marginTop: 0, color: '#856404' }}>💡 Potential Savings</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>
                    450
                  </div>
                  <div style={{ fontSize: '14px', color: '#856404' }}>Lines of Code</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>
                    8 hours
                  </div>
                  <div style={{ fontSize: '14px', color: '#856404' }}>Estimated Effort</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>
                    4
                  </div>
                  <div style={{ fontSize: '14px', color: '#856404' }}>Redundancies</div>
                </div>
              </div>
            </div>
            
            {/* Redundancy List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {[
                {
                  file1: 'Z_CALC_DISCOUNT_V1',
                  file2: 'Z_CALC_DISCOUNT_V2',
                  similarity: 0.95,
                  savings: 120
                },
                {
                  file1: 'Z_PRICING_OLD',
                  file2: 'Z_PRICING_NEW',
                  similarity: 0.92,
                  savings: 150
                }
              ].map((red, i) => (
                <div
                  key={i}
                  style={{
                    background: '#f9f9f9',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <div>
                      <strong>{red.file1}</strong> ↔ <strong>{red.file2}</strong>
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      background: red.similarity > 0.9 ? '#f44336' : '#FF9800',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {(red.similarity * 100).toFixed(0)}% Similar
                    </span>
                  </div>
                  <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                    These files contain nearly identical discount calculation logic. 
                    Consider consolidating into a single reusable function.
                  </p>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    💾 Potential savings: {red.savings} lines of code
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components

function StatCard({ title, value, icon, color }: any) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '12px',
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{
        fontSize: '40px',
        width: '60px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `${color}20`,
        borderRadius: '12px'
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
          {title}
        </div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ label, icon, onClick }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 20px',
        background: 'white',
        border: '2px solid #2196F3',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        color: '#2196F3',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = '#2196F3';
        e.currentTarget.style.color = 'white';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'white';
        e.currentTarget.style.color = '#2196F3';
      }}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

function ActivityItem({ icon, text, time }: any) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 0',
      borderBottom: '1px solid #f0f0f0'
    }}>
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', color: '#333' }}>{text}</div>
        <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{time}</div>
      </div>
    </div>
  );
}
