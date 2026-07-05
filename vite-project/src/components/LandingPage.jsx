import React, { useState, useRef } from 'react';
import './LandingPage.css';
import { ArrowRight, FolderOpen, Plus } from 'lucide-react';

import Aurora from './ui/Aurora';
import BlurText from './ui/BlurText';
import ShinyText from './ui/ShinyText';
import BorderGlow from './ui/BorderGlow';
import ClickSpark from './ui/ClickSpark';

export const LandingPage = ({ onJoinRoom, onCreateRoom, onOpenFolder }) => {
  const fileInputRef = useRef(null);
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleRoomCodeChange = (e) => {
    setRoomCode(e.target.value.toUpperCase());
  };

  const handleFolderSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    const fileData = await Promise.all(
      files.map(async (file) => {
        const text = await file.text();
        let lang = 'javascript';
        if (file.name.endsWith('.py')) lang = 'python';
        else if (file.name.endsWith('.rs')) lang = 'rust';
        else if (file.name.endsWith('.go')) lang = 'go';
        else if (file.name.endsWith('.html')) lang = 'html';
        else if (file.name.endsWith('.css')) lang = 'css';
        else if (file.name.endsWith('.json')) lang = 'json';
        else if (file.name.endsWith('.md')) lang = 'markdown';
        
        return {
          name: file.webkitRelativePath || file.name,
          content: text,
          language: lang
        };
      })
    );
    
    const validFiles = fileData.filter(f => !f.name.includes('/node_modules/') && !f.name.includes('/.'));
    onOpenFolder?.(validFiles);
  };

  const scrollToActions = () => {
    document.getElementById('action-panel')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page">
      {/* SECTION 1: HERO (100vh) */}
      <section className="hero-section">
        <div className="hero-bg">
          <Aurora 
            colorStops={["#3b0764", "#6d28d9", "#be185d", "#09090b"]} 
            amplitude={1.5} 
            speed={0.4} 
          />
        </div>
        <div className="hero-overlay" />
        
        <div className="hero-content">
          <div className="hero-badge">
            ✦ Collaborative IDE · Powered by AI
          </div>

          <div className="brand-wordmark">
            <span className="brand-name">OperisAI</span>
          </div>

          <h1 className="hero-headline">
            <BlurText 
              text="Code Together. Ship Faster." 
              delay={50} 
              animateBy="words" 
              direction="top"
              className="headline-text"
            />
          </h1>

          <p className="hero-subheading">
            <ShinyText text="OperisAI is a real-time P2P collaborative IDE with built-in AI." speed={3} />
          </p>

          <ClickSpark sparkColor="#f472b6" sparkCount={10}>
            <button className="cta-button" onClick={scrollToActions}>
              Get Started &rarr;
            </button>
          </ClickSpark>
        </div>

        <div className="scroll-hint">&darr;</div>
      </section>

      {/* SECTION 2: FEATURES STRIP */}
      <section className="features-section">
        <div className="features-grid">
          <BorderGlow className="feature-card">
            <span className="feature-emoji">⚡</span>
            <h3 className="feature-title">Real-time Collaboration</h3>
            <p className="feature-desc">CRDT-powered sync via WebRTC. Every keystroke, everywhere, instantly.</p>
          </BorderGlow>
          
          <BorderGlow className="feature-card">
            <span className="feature-emoji">🤖</span>
            <h3 className="feature-title">AI Copilot Built-in</h3>
            <p className="feature-desc">Explain, fix, and generate code inline. Press Ctrl+K anywhere in the editor.</p>
          </BorderGlow>

          <BorderGlow className="feature-card">
            <span className="feature-emoji">💬</span>
            <h3 className="feature-title">Persistent Room Chat</h3>
            <p className="feature-desc">Built-in chat with emoji reactions and 7-day message history per room.</p>
          </BorderGlow>

          <BorderGlow className="feature-card">
            <span className="feature-emoji">🔒</span>
            <h3 className="feature-title">Zero Friction</h3>
            <p className="feature-desc">No sign-up. No install. Share a link and start coding in seconds.</p>
          </BorderGlow>
        </div>
      </section>

      {/* SECTION 3: ACTION PANEL */}
      <section id="action-panel" className="action-section">
        <div className="action-card-wrapper">
          <div className="action-label">START CODING</div>

          <div className="action-buttons-container">
            <button 
              onClick={() => onCreateRoom?.(roomName)}
              className="action-btn start-empty-btn"
            >
              <Plus size={20} /> Empty Project
            </button>

            <div className="action-divider">
              <div className="divider-line"></div>
              <span className="divider-text">OR</span>
              <div className="divider-line"></div>
            </div>

            <input 
              type="file" 
              webkitdirectory="true" 
              directory="true" 
              multiple 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFolderSelect}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="action-btn open-folder-btn"
            >
              <FolderOpen size={20} /> Open Folder
            </button>
            
            <div className="action-divider mt-6">
              <div className="divider-line"></div>
              <span className="divider-text">OR JOIN ROOM</span>
              <div className="divider-line"></div>
            </div>

            <div className="join-room-container">
              <input
                type="text"
                placeholder="ROOM CODE"
                className="join-input"
                value={roomCode}
                onChange={handleRoomCodeChange}
                maxLength={8}
              />
              <button 
                onClick={() => onJoinRoom?.(roomCode)}
                disabled={!roomCode || roomCode.length < 4}
                className="join-btn"
              >
                Join <ArrowRight size={18} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: FOOTER */}
      <footer className="footer-section">
        <div className="footer-left">OperisAI</div>
        <div className="footer-center">
          <a href="#" className="footer-link">Documentation</a>
          <a href="#" className="footer-link">Keyboard shortcuts</a>
          <a href="#" className="footer-link">GitHub</a>
        </div>
        <div className="footer-right">&copy; 2025 OperisAI</div>
      </footer>
    </div>
  );
};

export default LandingPage;
