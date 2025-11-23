/**
 * Intelligence Demo Component
 * Demonstrates Custom Code Intelligence features
 */

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface QAResponse {
  question: string;
  answer: string;
  sources: Array<{
    name: string;
    type: string;
    module: string;
    relevance: number;
  }>;
  confidence: 'high' | 'medium' | 'low';
}

export function IntelligenceDemo() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<QAResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [abapCode, setAbapCode] = useState(`FUNCTION z_calculate_discount.
  DATA: lv_discount TYPE p DECIMALS 2,
        lv_total TYPE p DECIMALS 2.
  
  SELECT SUM( netwr ) FROM vbak
    INTO lv_total
    WHERE kunnr = iv_customer_id.
  
  IF lv_total > 1000.
    lv_discount = lv_total * '0.10'.
  ELSE.
    lv_discount = 0.
  ENDIF.
  
  ev_discount = lv_discount.
ENDFUNCTION.`);
  
  const [documentation, setDocumentation] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  
  const handleGenerateDocs = async () => {
    setDocLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:3001/api/intelligence/generate-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abapCode,
          analysis: {
            name: 'Z_CALCULATE_DISCOUNT',
            type: 'FUNCTION',
            module: 'SD',
            businessLogic: [
              {
                type: 'calculation',
                description: 'Calculate 10% discount for orders over $1000'
              }
            ],
            dependencies: [],
            tables: [
              {
                name: 'VBAK',
                operation: 'SELECT',
                description: 'Sales Document Header'
              }
            ],
            linesOfCode: 15,
            complexity: 3
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate documentation');
      }
      
      const data = await response.json();
      setDocumentation(data.documentation);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDocLoading(false);
    }
  };
  
  const handleAsk = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:3001/api/intelligence/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get answer');
      }
      
      const data = await response.json();
      setAnswer(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const suggestedQuestions = [
    'What does the discount calculation function do?',
    'Which tables are used for customer data?',
    'How is the pricing logic implemented?',
    'What is the business logic for discounts?'
  ];
  
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🧠 Custom Code Intelligence Demo</h1>
      <p>Test the AI-powered documentation and Q&A features</p>
      
      {error && (
        <div style={{ 
          padding: '10px', 
          background: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          ❌ Error: {error}
        </div>
      )}
      
      {/* Step 1: Generate Documentation */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Step 1: Generate Documentation</h2>
        <p>First, let's generate documentation from ABAP code:</p>
        
        <textarea
          value={abapCode}
          onChange={(e) => setAbapCode(e.target.value)}
          style={{
            width: '100%',
            height: '200px',
            fontFamily: 'monospace',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
        
        <button
          onClick={handleGenerateDocs}
          disabled={docLoading}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: docLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {docLoading ? '⏳ Generating...' : '📝 Generate Documentation'}
        </button>
        
        {documentation && (
          <div style={{
            marginTop: '20px',
            padding: '20px',
            background: '#f9f9f9',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <h3>Generated Documentation:</h3>
            <ReactMarkdown>{documentation}</ReactMarkdown>
          </div>
        )}
      </section>
      
      {/* Step 2: Ask Questions */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Step 2: Ask Questions</h2>
        <p>Now ask questions about the code (after generating docs):</p>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Suggested questions:</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => setQuestion(q)}
                style={{
                  padding: '8px 12px',
                  background: '#e3f2fd',
                  border: '1px solid #2196F3',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
        
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., What does the discount calculation function do?"
          style={{
            width: '100%',
            height: '80px',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (loading || !question.trim()) ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? '🤔 Thinking...' : '❓ Ask Question'}
        </button>
        
        {answer && (
          <div style={{
            marginTop: '20px',
            padding: '20px',
            background: '#f0f8ff',
            border: '1px solid #2196F3',
            borderRadius: '4px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h3 style={{ margin: 0 }}>Answer:</h3>
              <span style={{
                padding: '4px 12px',
                background: answer.confidence === 'high' ? '#4CAF50' : 
                           answer.confidence === 'medium' ? '#FF9800' : '#f44336',
                color: 'white',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {answer.confidence.toUpperCase()} CONFIDENCE
              </span>
            </div>
            
            <div style={{ 
              padding: '15px',
              background: 'white',
              borderRadius: '4px',
              marginBottom: '15px'
            }}>
              <ReactMarkdown>{answer.answer}</ReactMarkdown>
            </div>
            
            <h4>Sources:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {answer.sources.map((source, i) => (
                <li key={i} style={{ marginBottom: '8px' }}>
                  <strong>{source.name}</strong> ({source.type}, Module: {source.module})
                  <br />
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    Relevance: {(source.relevance * 100).toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
      
      {/* Instructions */}
      <section style={{
        padding: '20px',
        background: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '4px'
      }}>
        <h3>💡 How to Use:</h3>
        <ol>
          <li>Make sure the backend is running: <code>cd src/backend && npm run dev</code></li>
          <li>Set up your .env file with OPENAI_API_KEY and PINECONE_API_KEY</li>
          <li>Click "Generate Documentation" to index the ABAP code</li>
          <li>Wait a few seconds for indexing to complete</li>
          <li>Ask questions about the code!</li>
        </ol>
        
        <p><strong>Note:</strong> The first time you run this, Pinecone will create an index which takes ~10 seconds.</p>
      </section>
    </div>
  );
}
