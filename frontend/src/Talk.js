import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mic, Send, Volume2, Loader, MessageCircle, User, Bot, Settings } from 'lucide-react';
import Avatar from './Avatar';
import './Talk.css';

function Talk() {
  const [message, setMessage] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversation, setConversation] = useState([]);
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [personality, setPersonality] = useState('You are a helpful and friendly AI assistant. You respond in a conversational manner and try to be engaging and informative. Keep your responses concise but helpful.');
  const [showPersonality, setShowPersonality] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentSpeakingMessage, setCurrentSpeakingMessage] = useState('');

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/voices`);
      setVoices(response.data.voices);
      if (response.data.voices.length > 0) {
        setSelectedVoice(response.data.voices[0].id);
      }
    } catch (err) {
      setError('Failed to fetch voices. Please check your ElevenLabs API key.');
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
      setIsListening(true);

      // Add user message to conversation
      const userMessage = {
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString()
      };

      setConversation(prev => [...prev, userMessage]);

      // Prepare conversation history for Mistral
      const conversationHistory = conversation.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: message.trim(),
        voice_id: selectedVoice,
        conversation_history: conversationHistory,
        personality: personality.trim()
      }, {
        responseType: 'json'
      });

      if (response.data.ai_response) {
        // Add AI response to conversation
        const aiMessage = {
          role: 'assistant',
          content: response.data.ai_response,
          timestamp: new Date().toISOString(),
          audio: response.data.audio
        };

        setConversation(prev => [...prev, aiMessage]);

        // Convert base64 to audio URL and play
        if (response.data.audio) {
          const audioBlob = base64ToBlob(response.data.audio, 'audio/mpeg');
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          
          // Clean up previous audio element
          if (audioElement) {
            URL.revokeObjectURL(audioElement.src);
          }
          setAudioElement(null);

          // Start speaking animation
          setIsListening(false);
          setIsSpeaking(true);
          setCurrentSpeakingMessage(response.data.ai_response);

          // Play the audio
          playAudioWithAvatar(response.data.audio, response.data.ai_response);
        }
      }

      setMessage('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message. Please try again.');
      console.error('Error sending message:', err);
      setIsListening(false);
    } finally {
      setLoading(false);
    }
  };

  const playAudioWithAvatar = (audioBase64, messageText) => {
    if (audioBase64) {
      const audioBlob = base64ToBlob(audioBase64, 'audio/mpeg');
      const url = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(url);
      
      audio.addEventListener('play', () => {
        setIsPlaying(true);
        setIsSpeaking(true);
        setCurrentSpeakingMessage(messageText);
      });
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setIsSpeaking(false);
        setCurrentSpeakingMessage('');
        URL.revokeObjectURL(url);
      });
      
      audio.addEventListener('pause', () => {
        setIsPlaying(false);
        setIsSpeaking(false);
        setCurrentSpeakingMessage('');
      });
      
      audio.addEventListener('error', () => {
        setIsPlaying(false);
        setIsSpeaking(false);
        setCurrentSpeakingMessage('');
        setError('Failed to play audio.');
      });
      
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setError('Failed to play audio.');
        setIsSpeaking(false);
        setCurrentSpeakingMessage('');
      });
      
      setAudioElement(audio);
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

  const playAudio = (audioBase64) => {
    if (audioBase64) {
      const audioBlob = base64ToBlob(audioBase64, 'audio/mpeg');
      const url = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(url);
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      });
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setError('Failed to play audio.');
      });
      
      setAudioElement(audio);
    }
  };

  const handleVoiceSelect = (voiceId) => {
    setSelectedVoice(voiceId);
  };

  const clearConversation = () => {
    setConversation([]);
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
    }
    setIsPlaying(false);
    setIsSpeaking(false);
    setIsListening(false);
    setCurrentSpeakingMessage('');
    setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const loadPresetPersonality = (preset) => {
    const presets = {
      friendly: "You are a warm and friendly AI assistant. You're enthusiastic, supportive, and always try to make people feel good. Use encouraging language and show genuine interest in the conversation.",
      professional: "You are a professional and knowledgeable AI assistant. You provide clear, accurate information and maintain a helpful but formal tone. Focus on being informative and reliable.",
      creative: "You are a creative and imaginative AI assistant. You think outside the box, suggest innovative ideas, and approach problems with creativity. Be playful and inspire creative thinking.",
      casual: "You are a casual and laid-back AI assistant. You speak informally, use conversational language, and keep things relaxed and easy-going. Be approachable and down-to-earth."
    };
    setPersonality(presets[preset] || personality);
  };

  const handleAvatarClick = () => {
    // Optional: Add avatar click functionality
    console.log('Avatar clicked!');
  };

  // Get personality type for avatar
  const getPersonalityType = () => {
    const personalityLower = personality.toLowerCase();
    if (personalityLower.includes('friendly') || personalityLower.includes('warm')) return 'friendly';
    if (personalityLower.includes('professional') || personalityLower.includes('formal')) return 'professional';
    if (personalityLower.includes('creative') || personalityLower.includes('imaginative')) return 'creative';
    if (personalityLower.includes('casual') || personalityLower.includes('relaxed')) return 'casual';
    return 'friendly';
  };

  return (
    <div className="talk-container">
      <div className="header">
        <h1>💬 Talk with AI</h1>
        <p>Have a conversation with your chosen voice using Mistral AI</p>
      </div>

      <div className="talk-layout">
        {/* Voice Selection Sidebar */}
        <div className="voice-sidebar">
          <h3>Choose Your Voice</h3>
          {loading && !voices.length ? (
            <div className="loading-container">
              <div className="loading"></div>
              <span>Loading voices...</span>
            </div>
          ) : (
            <div className="voice-list">
              {voices.map((voice) => (
                <div
                  key={voice.id}
                  className={`voice-item ${selectedVoice === voice.id ? 'selected' : ''}`}
                  onClick={() => handleVoiceSelect(voice.id)}
                >
                  <h4>{voice.name}</h4>
                  <p>{voice.category}</p>
                  {voice.description && <small>{voice.description}</small>}
                </div>
              ))}
            </div>
          )}

          {/* Personality Configuration */}
          <div className="personality-section">
            <div className="personality-header">
              <h3>AI Personality</h3>
              <button
                className="personality-toggle"
                onClick={() => setShowPersonality(!showPersonality)}
              >
                <Settings size={16} />
                {showPersonality ? 'Hide' : 'Configure'}
              </button>
            </div>
            
            {showPersonality && (
              <div className="personality-config">
                <div className="preset-buttons">
                  <button onClick={() => loadPresetPersonality('friendly')}>Friendly</button>
                  <button onClick={() => loadPresetPersonality('professional')}>Professional</button>
                  <button onClick={() => loadPresetPersonality('creative')}>Creative</button>
                  <button onClick={() => loadPresetPersonality('casual')}>Casual</button>
                </div>
                <textarea
                  className="personality-input"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  placeholder="Describe the AI's personality, behavior, and communication style..."
                  rows={4}
                />
                <small>This will influence how the AI responds to your messages.</small>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area with Avatar */}
        <div className="chat-area">
          <div className="chat-header">
            <h2>Conversation</h2>
            <button className="btn btn-secondary" onClick={clearConversation}>
              Clear Chat
            </button>
          </div>

          {/* Avatar Section */}
          <div className="avatar-section">
            <Avatar
              isSpeaking={isSpeaking}
              isListening={isListening}
              personality={getPersonalityType()}
              currentMessage={currentSpeakingMessage}
              onAvatarClick={handleAvatarClick}
            />
          </div>

          <div className="messages-container">
            {conversation.length === 0 ? (
              <div className="empty-state">
                <MessageCircle size={48} />
                <h3>Start a conversation!</h3>
                <p>Type a message below to begin chatting with your AI voice assistant.</p>
              </div>
            ) : (
              <div className="messages">
                {conversation.map((msg, index) => (
                  <div key={index} className={`message ${msg.role}`}>
                    <div className="message-avatar">
                      {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                    </div>
                    <div className="message-content">
                      <div className="message-text">{msg.content}</div>
                      <div className="message-meta">
                        <span className="timestamp">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                        {msg.role === 'assistant' && msg.audio && (
                          <button
                            className="play-button"
                            onClick={() => playAudio(msg.audio)}
                            disabled={isPlaying}
                          >
                            <Volume2 size={16} />
                            {isPlaying ? 'Playing...' : 'Play'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="message-input">
            <textarea
              className="input textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here... (Press Enter to send)"
              rows={3}
              disabled={loading}
            />
            <button
              className="btn send-button"
              onClick={sendMessage}
              disabled={loading || !message.trim() || !selectedVoice}
            >
              {loading ? (
                <>
                  <Loader className="loading" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Send
                </>
              )}
            </button>
          </div>

          {error && <div className="error">{error}</div>}
        </div>
      </div>
    </div>
  );
}

export default Talk; 