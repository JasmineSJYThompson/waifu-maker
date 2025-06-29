import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mic, MessageCircle, Video, Bot } from 'lucide-react';
import VoiceGenerator from './VoiceGenerator';
import Talk from './Talk';
import VideoTest from './VideoTest';
import Agent from './Agent';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('voice'); // 'voice', 'talk', 'agent', or 'test'

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  return (
    <div className="App">
      <div className="container">
        <div className="header">
          <h1>🎤 Waifu Maker</h1>
          <p>Transform text into beautiful AI-generated voices with ElevenLabs</p>
        </div>

        {/* Navigation */}
        <div className="navigation">
          <button
            className={`nav-button ${currentPage === 'voice' ? 'active' : ''}`}
            onClick={() => setCurrentPage('voice')}
          >
            <Mic size={20} />
            Voice Generation
          </button>
          <button
            className={`nav-button ${currentPage === 'talk' ? 'active' : ''}`}
            onClick={() => setCurrentPage('talk')}
          >
            <MessageCircle size={20} />
            Talk with AI
          </button>
          <button
            className={`nav-button ${currentPage === 'agent' ? 'active' : ''}`}
            onClick={() => setCurrentPage('agent')}
          >
            <Bot size={20} />
            Talk with Agent
          </button>
          <button
            className={`nav-button ${currentPage === 'test' ? 'active' : ''}`}
            onClick={() => setCurrentPage('test')}
          >
            <Video size={20} />
            Video Test
          </button>
        </div>

        {/* Page Content */}
        {currentPage === 'voice' ? (
          <VoiceGenerator />
        ) : currentPage === 'talk' ? (
          <Talk />
        ) : currentPage === 'agent' ? (
          <Agent />
        ) : (
          <VideoTest />
        )}
      </div>
    </div>
  );
}

export default App; 