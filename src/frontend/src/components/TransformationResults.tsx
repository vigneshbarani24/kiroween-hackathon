import React from 'react';

interface TransformResult {
  originalAbap: string;
  transformed: string;
  tests: string;
  notes: string;
  kiroAnalysis: {
    specUsed: string;
    steeringApplied: string;
    mcpTools: string[];
    businessLogicPreserved: boolean;
  };
}

interface Props {
  result: TransformResult;
}

export const TransformationResults: React.FC<Props> = ({ result }) => {
  return (
    <div className="results-section">
      <h2>✨ Resurrected Code (The Living)</h2>

      <div className="results-grid">
        {/* Modern Code */}
        <div className="result-card">
          <h3>🚀 Modern TypeScript</h3>
          <pre><code>{result.transformed || 'No transformed code available'}</code></pre>
        </div>

        {/* Tests */}
        {result.tests && (
          <div className="result-card">
            <h3>🧪 Auto-Generated Tests</h3>
            <pre><code>{result.tests}</code></pre>
          </div>
        )}
      </div>

      {/* Transformation Notes */}
      {result.notes && (
        <div className="result-card" style={{ marginTop: '2rem' }}>
          <h3>📝 Transformation Notes</h3>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
            {result.notes}
          </div>
        </div>
      )}

      {/* Kiro Analysis */}
      <div className="kiro-analysis">
        <h3>🦸 Kiro's Superpowers Used</h3>
        <div className="analysis-item">
          ✅ Spec: <code>{result.kiroAnalysis.specUsed}</code>
        </div>
        <div className="analysis-item">
          ✅ Steering: <code>{result.kiroAnalysis.steeringApplied}</code>
        </div>
        <div className="analysis-item">
          ✅ MCP Tools: {result.kiroAnalysis.mcpTools.join(', ')}
        </div>
        <div className="analysis-item">
          {result.kiroAnalysis.businessLogicPreserved ? '✅' : '⚠️'} Business Logic Preserved: {result.kiroAnalysis.businessLogicPreserved ? '100%' : 'Partial'}
        </div>
      </div>
    </div>
  );
};
