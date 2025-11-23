/**
 * Q&A Interface Component
 * Natural language questions about SAP code
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

export function QAInterface() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<QAResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<QAResponse[]>([]);
  
  const suggestedQuestions = [
    'What does the discount calculation function do?',
    'Which tables are used for customer data?',
    'How is the pricing logic implemented?',
    'What functions access the VBAK table?',
    'Which modules have the most custom code?'
  ];
  
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
      setHistory([data, ...history]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };
  
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        padding: '30px'
      }}>
        <h2 style={{ marginTop: 0 }}>❓ Ask Questions About Your Code</h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Ask natural language questions about your SAP custom code. 
          The AI will search through your documentation and provide answers with sources.
        </p>
        
        {error && (
          <div style={{
            padding: '12px',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#c33'
          }}>
            ❌ {error}
          </div>
        )}
        
        {/* Suggested Questions */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '10px', color: '#666' }}>
            💡 Suggested questions:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => setQuestion(q)}
                style={{
                  padding: '8px 14px',
                  background: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#555',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#e3f2fd';
                  e.currentTarget.style.borderColor = '#2196F3';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#f0f0f0';
                  e.currentTarget.style.borderColor = '#ddd';
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
        
        {/* Question Input */}
        <div style={{ marginBottom: '30px' }}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., What does the discount calculation function do?"
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '15px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '15px',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#2196F3'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
          />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '12px', color: '#999' }}>
              Press Enter to ask, Shift+Enter for new line
            </span>
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              style={{
                padding: '12px 30px',
                background: loading || !question.trim() ? '#ccc' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading || !question.trim() ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              {loading ? '🤔 Thinking...' : '❓ Ask Question'}
            </button>
          </div>
        </div>
        
        {/* Answer */}
        {answer && (
          <div style={{
            background: '#f0f8ff',
            border: '2px solid #2196F3',
            borderRadius: '12px',
            padding: '25px',
            marginBottom: '30px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: '#1976D2' }}>Answer</h3>
              <span style={{
                padding: '6px 14px',
                background: answer.confidence === 'high' ? '#4CAF50' :
                           answer.confidence === 'medium' ? '#FF9800' : '#f44336',
                color: 'white',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {answer.confidence} confidence
              </span>
            </div>
            
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              <ReactMarkdown>{answer.answer}</ReactMarkdown>
            </div>
            
            <div>
              <h4 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', color: '#666' }}>
                📚 Sources:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {answer.sources.map((source, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'white',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  >
                    <div style={{ fontWeight: '500', color: '#333', marginBottom: '4px' }}>
                      {source.name}
                    </div>
                    <div style={{ color: '#666', fontSize: '12px' }}>
                      {source.type} • Module: {source.module} • 
                      Relevance: {(source.relevance * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* History */}
        {history.length > 1 && (
          <div>
            <h3 style={{ fontSize: '16px', color: '#666', marginBottom: '15px' }}>
              📜 Recent Questions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.slice(1, 4).map((item, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setQuestion(item.question);
                    setAnswer(item);
                  }}
                  style={{
                    padding: '12px',
                    background: '#f9f9f9',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#f0f0f0';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f9f9f9';
                  }}
                >
                  {item.question}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
