import React from 'react';
import './KiroHero.css';

export const KiroHero: React.FC = () => {
  return (
    <div className="kiro-hero">
      <div className="hero-content">
        <div className="hero-badge">🎃 Kiroween Hackathon 2025 - Resurrection Category</div>
        <h1 className="hero-title">Kiro SAP Resurrector</h1>
        <p className="hero-description">
          Bringing 40-year-old ABAP code back to life with AI
        </p>
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-value">1983</div>
            <div className="stat-label">ABAP Created</div>
          </div>
          <div className="stat">
            <div className="stat-value">$50B+</div>
            <div className="stat-label">Modernization Market</div>
          </div>
          <div className="stat">
            <div className="stat-value">100%</div>
            <div className="stat-label">Logic Preserved</div>
          </div>
        </div>
      </div>
    </div>
  );
};
