import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Loader, User, Bot, Volume2 } from 'lucide-react';
import * as PIXI from 'pixi.js';
import './VTuber.css';

function VTuber() {
  const [message, setMessage] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingMessage, setCurrentSpeakingMessage] = useState('');
  const [vtuberApp, setVtuberApp] = useState(null);
  const [vtuberModel, setVtuberModel] = useState(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  // Refs
  const canvasRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const audioRef = useRef(null);

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  // Initialize VTuber
  useEffect(() => {
    initializeVTuber();
    fetchVoices();
  }, []);

  const initializeVTuber = async () => {
    try {
      // Check if PIXI.js is available
      if (typeof PIXI === 'undefined') {
        console.warn('PIXI.js not loaded.');
        return;
      }

      // Initialize PIXI Application
      const app = new PIXI.Application({
        view: canvasRef.current,
        width: 400,
        height: 600,
        backgroundColor: 0x1a1a1a,
        transparent: false,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
      });

      setVtuberApp(app);

      // Create basic VTuber model
      await createBasicVTuberModel(app);

    } catch (error) {
      console.error('Failed to initialize VTuber:', error);
      setError('Failed to initialize VTuber.');
    }
  };

  const createBasicVTuberModel = async (app) => {
    try {
      console.log('Creating basic VTuber model...');
      
      // Create character container
      const character = new PIXI.Container();
      
      // Head (simple circle)
      const head = new PIXI.Graphics();
      head.beginFill(0xf5f5f5);
      head.drawCircle(0, 0, 60);
      head.endFill();
      character.addChild(head);
      
      // Eyes (simple circles)
      const leftEye = new PIXI.Graphics();
      leftEye.beginFill(0x333333);
      leftEye.drawCircle(-20, -15, 8);
      leftEye.endFill();
      character.addChild(leftEye);
      
      const rightEye = new PIXI.Graphics();
      rightEye.beginFill(0x333333);
      rightEye.drawCircle(20, -15, 8);
      rightEye.endFill();
      character.addChild(rightEye);
      
      // Mouth (simple ellipse)
      const mouth = new PIXI.Graphics();
      mouth.beginFill(0x666666);
      mouth.drawEllipse(0, 25, 15, 3);
      mouth.endFill();
      character.addChild(mouth);
      
      // Hair (simple shape)
      const hair = new PIXI.Graphics();
      hair.beginFill(0x333333);
      hair.drawEllipse(0, -50, 50, 25);
      hair.endFill();
      character.addChild(hair);
      
      // Store references
      character.mouth = mouth;
      character.leftEye = leftEye;
      character.rightEye = rightEye;
      
      // Position character
      character.position.set(200, 300);
      app.stage.addChild(character);
      
      // Store character reference
      setVtuberModel(character);
      setModelLoaded(true);
      
      console.log('Basic VTuber model created successfully');
      
      // Start simple idle animation
      startSimpleIdleAnimation(character);
      
    } catch (error) {
      console.error('Failed to create VTuber model:', error);
      setError('Failed to create VTuber model.');
    }
  };

  const startSimpleIdleAnimation = (character) => {
    if (!character) return;
    
    const animate = () => {
      // Simple breathing animation
      const time = Date.now() / 1000;
      const scale = 1 + Math.sin(time * 1.5) * 0.02;
      character.scale.set(scale);
      
      // Simple blinking
      if (Math.random() < 0.008) {
        character.leftEye.visible = false;
        character.rightEye.visible = false;
        setTimeout(() => {
          character.leftEye.visible = true;
          character.rightEye.visible = true;
        }, 150);
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
  };

  const fetchVoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/voices`);
      setVoices(response.data.voices);
      if (response.data.voices.length > 0) {
        setSelectedVoice(response.data.voices[0].id);
      }
    } catch (err) {
      setError('Failed to fetch voices.');
      console.error('Error fetching voices:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) {
      setError('Please enter a message.');
      return;
    }

    if (!selectedVoice) {
      setError('Please select a voice.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Add user message to conversation
      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, userMessage]);

      // Send message to backend
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: message,
        voice_id: selectedVoice,
        conversation_history: conversation
      });

      // Add AI response to conversation
      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, aiMessage]);

      // Play audio
      if (response.data.audio_base64) {
        await playAudio(response.data.audio_base64, response.data.response);
      }

      setMessage('');

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.error || 'Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (audioBase64, messageText) => {
    try {
      setIsSpeaking(true);
      setCurrentSpeakingMessage(messageText);

      // Convert base64 to blob
      const audioBlob = base64ToBlob(audioBase64, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Play audio
      audio.play();
      setIsPlaying(true);

      // Handle audio end
      audio.onended = () => {
        setIsPlaying(false);
        setIsSpeaking(false);
        setCurrentSpeakingMessage('');
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsPlaying(false);
        setIsSpeaking(false);
        setCurrentSpeakingMessage('');
        URL.revokeObjectURL(audioUrl);
      };

    } catch (error) {
      console.error('Error playing audio:', error);
      setIsSpeaking(false);
      setCurrentSpeakingMessage('');
    }
  };

  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const handleVoiceSelect = (voiceId) => {
    setSelectedVoice(voiceId);
  };

  const clearConversation = () => {
    setConversation([]);
    setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="vtuber-container">
      <div className="vtuber-layout">
        {/* Left Column - Voice Selection */}
        <div className="voice-panel">
          <h2>Voices</h2>
          <div className="voice-list">
            {loading && !voices.length ? (
              <div className="loading">Loading voices...</div>
            ) : (
              voices.map((voice) => (
                <div
                  key={voice.id}
                  className={`voice-item ${selectedVoice === voice.id ? 'selected' : ''}`}
                  onClick={() => handleVoiceSelect(voice.id)}
                >
                  <div className="voice-name">{voice.name}</div>
                  <div className="voice-category">{voice.category}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center Column - VTuber Display */}
        <div className="vtuber-panel">
          <h2>VTuber</h2>
          <div className="vtuber-display">
            <canvas ref={canvasRef} className="vtuber-canvas" />
            {isSpeaking && (
              <div className="speaking-indicator">
                <div className="speaking-text">{currentSpeakingMessage}</div>
                <div className="speaking-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            {!modelLoaded && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <div>Loading VTuber...</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Chat */}
        <div className="chat-panel">
          <div className="chat-header">
            <h2>Chat</h2>
            <button onClick={clearConversation} className="clear-btn">
              Clear
            </button>
          </div>

          <div className="messages-container" ref={messagesContainerRef}>
            {conversation.length === 0 ? (
              <div className="welcome-message">
                <h3>Welcome to VTuber Chat</h3>
                <p>Select a voice and start chatting with your VTuber!</p>
              </div>
            ) : (
              conversation.map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className="message-content">
                    <div className="message-text">{msg.content}</div>
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="input-container">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={loading}
              rows={3}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !message.trim() || !selectedVoice}
              className="send-btn"
            >
              {loading ? <Loader className="spin" size={16} /> : <Send size={16} />}
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VTuber; 