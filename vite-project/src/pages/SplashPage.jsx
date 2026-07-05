import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SplashPage.css';

export default function SplashPage() {
  const navigate = useNavigate();

  return (
    <div className="splash-container">
      <div className="splash-orb"></div>
      
      <div className="splash-content">
        <div className="brand-wordmark">
          <span className="brand-name">OperisAI</span>
        </div>
        <h1 className="splash-title">Code Together. Ship Faster.</h1>
        <p className="splash-subtitle">
          OperisAI is a real-time P2P collaborative IDE with built-in AI — no setup, no servers, just code.
        </p>
        <button className="splash-cta" onClick={() => navigate('/')}>
          Get Started &rarr;
        </button>

        <div className="splash-features">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3 className="feature-title">Real-time Collaboration</h3>
            <p className="feature-desc">CRDT-powered sync via WebRTC P2P.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3 className="feature-title">AI Copilot</h3>
            <p className="feature-desc">Explain, fix, and generate code inline with Ctrl+K.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3 className="feature-title">Persistent Chat</h3>
            <p className="feature-desc">Built-in room chat with emoji reactions.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3 className="feature-title">No Account Needed</h3>
            <p className="feature-desc">Share a link. Start coding. That's it.</p>
          </div>
        </div>
      </div>

      <footer className="splash-footer">
        OperisAI &copy; 2025
      </footer>
    </div>
  );
}
