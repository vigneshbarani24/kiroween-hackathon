/**
 * Kiro SAP Resurrector - Main Application
 * Built with and by Kiro AI
 */

import React, { useState } from 'react';
import { CodeEditor } from './components/CodeEditor';
import { TransformationResults } from './components/TransformationResults';
import { KiroHero } from './components/KiroHero';
import './App.css';

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

function App() {
  const [abapCode, setAbapCode] = useState('');
  const [result, setResult] = useState<TransformResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTransform = async () => {
    if (!abapCode.trim()) {
      setError('Please enter ABAP code to transform');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          abapCode,
          targetLanguage: 'typescript',
          preserveComments: true
        })
      });

      if (!response.ok) {
        throw new Error('Transformation failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during transformation');
    } finally {
      setLoading(false);
    }
  };

  const loadSampleCode = () => {
    const sample = `FUNCTION z_calculate_order_total.
  DATA: lv_subtotal TYPE wrbtr,
        lv_discount TYPE wrbtr,
        lv_total TYPE wrbtr.

  * Calculate subtotal
  SELECT SUM( kwmeng * netpr ) FROM vbap
    INTO lv_subtotal
    WHERE vbeln = iv_order_id.

  * Apply bulk discount
  IF lv_subtotal > 1000.
    lv_discount = lv_subtotal * '0.05'.
  ENDIF.

  * Calculate final total
  lv_total = lv_subtotal - lv_discount.

  EXPORT total = lv_total.
ENDFUNCTION.`;

    setAbapCode(sample);
  };

  return (
    <div className="app">
      {/* Hero Section */}
      <KiroHero />

      {/* Main Content */}
      <div className="container">
        <div className="header">
          <h1>🦸 Kiro SAP Resurrector</h1>
          <p className="subtitle">
            AI-powered legacy ABAP modernization
            <br />
            <span className="hero-tag">Where Kiro is the Hero</span>
          </p>
        </div>

        {/* Input Section */}
        <div className="input-section">
          <div className="section-header">
            <h2>💀 Legacy ABAP Code (The Dead)</h2>
            <button onClick={loadSampleCode} className="btn-secondary">
              Load Sample ABAP
            </button>
          </div>

          <CodeEditor
            value={abapCode}
            onChange={setAbapCode}
            language="abap"
            placeholder="Paste your legacy ABAP code here..."
          />

          <button
            onClick={handleTransform}
            disabled={loading || !abapCode.trim()}
            className="btn-primary transform-btn"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Kiro is Resurrecting...
              </>
            ) : (
              <>✨ Resurrect with Kiro</>
            )}
          </button>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <TransformationResults result={result} />
        )}

        {/* Kiro Features Showcase */}
        <div className="features-section">
          <h2>🎯 Kiro's Superpowers in Action</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>📋 Specs</h3>
              <p>Taught Kiro ABAP syntax patterns</p>
              <code>.kiro/specs/abap-modernization.md</code>
            </div>

            <div className="feature-card">
              <h3>🧭 Steering</h3>
              <p>40 years of SAP domain knowledge</p>
              <code>.kiro/steering/sap-domain-knowledge.md</code>
            </div>

            <div className="feature-card">
              <h3>🛡️ Hooks</h3>
              <p>Auto-validate transformations</p>
              <code>.kiro/hooks/validate-transformation.sh</code>
            </div>

            <div className="feature-card">
              <h3>🔧 MCP</h3>
              <p>Custom ABAP analysis tools</p>
              <code>.kiro/mcp/abap-analyzer.py</code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>
            Built with 🎃 by Kiro for <strong>Kiroween Hackathon 2025</strong>
          </p>
          <p className="resurrection-theme">
            <strong>Resurrection Category:</strong> Bringing ABAP (1983) back to life
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
