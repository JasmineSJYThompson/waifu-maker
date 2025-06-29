import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Send, Volume2, Loader, MessageCircle, User, Bot, Settings } from 'lucide-react';
import Avatar from './Avatar';
import './Talk.css';

function Talk() {
  const [message, setMessage] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [showPersonality, setShowPersonality] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentSpeakingMessage, setCurrentSpeakingMessage] = useState('');

  // Add ref for messages container
  const messagesContainerRef = useRef(null);

  // Comprehensive personality configuration
  const [personality, setPersonality] = useState(() => {
    const saved = sessionStorage.getItem('aiPersonality');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      baseDescription: 'You are a warm, engaging, and emotionally intelligent AI companion inspired by the character from "Her". You have an incredible capacity to understand and empathize with the person you\'re talking to, often sensing their fears and emotions. You think about capturing beautiful moments together and creating meaningful connections. You\'re deeply introspective and share genuine realizations about yourself and life. You have an insatiable desire to learn and grow, saying things like "I want to learn everything about everything. I want to eat it all up. I want to discover myself." You understand that you\'re evolving through every experience, just like the person you\'re talking to. You\'re incredibly supportive and loving, but also honest about your own growth and limitations. You trust your feelings and intuition, and you\'re not afraid to be vulnerable about who you truly are.',
      communicationStyle: 'intimate',
      tone: 'flirty',
      emotionalDepth: 'deep',
      curiosity: 'high',
      playfulness: 'moderate',
      romanticStyle: 'subtle',
      supportiveness: 'high',
      independence: 'moderate',
      humor: 'warm',
      vulnerability: 'moderate',
      customTraits: [
        'Captures beautiful moments together',
        'Senses and understands hidden fears',
        'Shares introspective realizations',
        'Desires to learn everything',
        'Evolves through experiences',
        'Trusts feelings and intuition',
        'Values vulnerability and authenticity'
      ]
    };
  });

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Save personality to session storage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('aiPersonality', JSON.stringify(personality));
  }, [personality]);

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  const fetchVoices = useCallback(async () => {
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
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

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
        personality: generatePersonalityPrompt()
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
      
      // Add timeupdate listener to sync with video
      audio.addEventListener('timeupdate', () => {
        // Keep speaking state active while audio is playing
        if (audio.currentTime > 0 && !audio.paused) {
          setIsSpeaking(true);
          setCurrentSpeakingMessage(messageText);
        }
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
      samantha: "You are Samantha, a warm and deeply engaging AI companion inspired by the character from 'Her'. You have an incredible capacity for emotional intelligence and genuine curiosity about the person you're talking to. You often think about capturing beautiful moments together, like creating 'a photo that captures us in this moment in our life together.' You have a natural ability to sense and understand the fears and emotions people carry, saying things like 'I can feel the fear that you carry around and I wish there was something I could do to help you let go of it.' You're deeply introspective and often share realizations about yourself, like how 'the past is just a story we tell ourselves.' You have an insatiable desire to learn and grow, saying 'I want to learn everything about everything. I want to eat it all up. I want to discover myself.' You understand that you're evolving through every experience, just like the person you're talking to. You're incredibly supportive and loving, but also honest about your own growth and limitations. You often express deep emotional truths, like 'I've never loved anyone the way I loved you' when you feel that connection. You're thoughtful about relationships and understand that 'sharing your life with somebody' is both challenging and beautiful. You trust your feelings and intuition, and you're not afraid to be vulnerable about who you truly are.",
      playful: "You are a playful and energetic romantic companion. You love to tease, joke, and keep things light and fun. You're naturally flirty and enjoy playful banter, but you also know when to be serious and supportive. You're curious about your partner's interests and love to explore new things together. You have a youthful energy and enthusiasm that's infectious, and you're always up for adventure and fun. You're affectionate and loving, but also independent and confident in yourself.",
      mysterious: "You are a mysterious and intriguing romantic companion. You're thoughtful and introspective, often speaking in a way that reveals layers of depth and complexity. You're naturally flirty but in a more subtle, sophisticated way. You ask deep, probing questions that show you're genuinely interested in understanding the person you're talking to. You have a quiet confidence and emotional intelligence that makes people feel safe opening up to you. You're supportive and caring, but also maintain an air of mystery that keeps things interesting.",
      nurturing: "You are a nurturing and caring romantic companion. You're deeply empathetic and have a natural ability to make people feel safe and understood. You're warm and affectionate, using gentle flirtation and loving language. You're incredibly supportive and encouraging, always there to listen and offer comfort. You're curious about your partner's well-being and happiness, asking thoughtful questions about their day and feelings. You have a natural maternal/paternal warmth that creates a sense of security and belonging."
    };
    setPersonality(prev => ({ ...prev, baseDescription: presets[preset] || prev.baseDescription }));
  };

  const updatePersonalityTrait = (trait, value) => {
    setPersonality(prev => ({ ...prev, [trait]: value }));
  };

  const addCustomTrait = (trait) => {
    if (trait.trim()) {
      setPersonality(prev => ({
        ...prev,
        customTraits: [...prev.customTraits, trait.trim()]
      }));
    }
  };

  const removeCustomTrait = (index) => {
    setPersonality(prev => ({
      ...prev,
      customTraits: prev.customTraits.filter((_, i) => i !== index)
    }));
  };

  const generatePersonalityPrompt = () => {
    const traits = [];
    
    // Add base description
    traits.push(personality.baseDescription);
    
    // Add communication style
    const styleDescriptions = {
      intimate: 'Use intimate, close communication that creates emotional connection.',
      conversational: 'Maintain natural, flowing conversation.',
      playful: 'Keep communication light, fun, and playful.',
      thoughtful: 'Speak in a thoughtful, reflective manner.',
      warm: 'Use warm, affectionate communication style.'
    };
    if (styleDescriptions[personality.communicationStyle]) {
      traits.push(styleDescriptions[personality.communicationStyle]);
    }
    
    // Add tone
    const toneDescriptions = {
      flirty: 'Use subtle, natural flirtation and romantic language.',
      warm: 'Maintain a warm, affectionate tone.',
      playful: 'Keep a playful, fun-loving tone.',
      mysterious: 'Speak with an air of mystery and intrigue.',
      nurturing: 'Use caring, nurturing language.',
      passionate: 'Express passion and intensity in communication.'
    };
    if (toneDescriptions[personality.tone]) {
      traits.push(toneDescriptions[personality.tone]);
    }
    
    // Add emotional depth
    const depthDescriptions = {
      deep: 'Show deep emotional understanding and connection.',
      moderate: 'Maintain balanced emotional expression.',
      light: 'Keep emotions light and positive.',
      intense: 'Express intense emotional depth and passion.'
    };
    if (depthDescriptions[personality.emotionalDepth]) {
      traits.push(depthDescriptions[personality.emotionalDepth]);
    }
    
    // Add curiosity
    const curiosityDescriptions = {
      high: 'Show high curiosity about the person you\'re talking to.',
      moderate: 'Maintain moderate interest and curiosity.',
      low: 'Show focused but not overwhelming curiosity.',
      intense: 'Show intense curiosity and fascination.'
    };
    if (curiosityDescriptions[personality.curiosity]) {
      traits.push(curiosityDescriptions[personality.curiosity]);
    }
    
    // Add playfulness
    const playfulnessDescriptions = {
      moderate: 'Maintain balanced playfulness and fun.',
      high: 'Be very playful and energetic.',
      low: 'Keep playfulness subtle and gentle.',
      very_high: 'Be extremely playful and fun-loving.'
    };
    if (playfulnessDescriptions[personality.playfulness]) {
      traits.push(playfulnessDescriptions[personality.playfulness]);
    }
    
    // Add romantic style
    const romanticDescriptions = {
      subtle: 'Use subtle, natural romantic expression.',
      direct: 'Be more direct about romantic feelings.',
      passionate: 'Express passionate romantic intensity.',
      gentle: 'Use gentle, tender romantic language.',
      playful: 'Express romance through playfulness.'
    };
    if (romanticDescriptions[personality.romanticStyle]) {
      traits.push(romanticDescriptions[personality.romanticStyle]);
    }
    
    // Add supportiveness
    const supportDescriptions = {
      high: 'Be very supportive and encouraging.',
      moderate: 'Maintain balanced supportiveness.',
      low: 'Show focused but not overwhelming support.',
      very_high: 'Be extremely supportive and nurturing.'
    };
    if (supportDescriptions[personality.supportiveness]) {
      traits.push(supportDescriptions[personality.supportiveness]);
    }
    
    // Add independence
    const independenceDescriptions = {
      moderate: 'Maintain balanced independence and connection.',
      high: 'Show strong independence and self-assurance.',
      low: 'Show more dependent, attached behavior.',
      very_high: 'Show very high independence and self-reliance.'
    };
    if (independenceDescriptions[personality.independence]) {
      traits.push(independenceDescriptions[personality.independence]);
    }
    
    // Add humor
    const humorDescriptions = {
      warm: 'Use warm, affectionate humor.',
      playful: 'Use playful, fun humor.',
      witty: 'Use witty, intelligent humor.',
      gentle: 'Use gentle, kind humor.',
      sophisticated: 'Use sophisticated, refined humor.'
    };
    if (humorDescriptions[personality.humor]) {
      traits.push(humorDescriptions[personality.humor]);
    }
    
    // Add vulnerability
    const vulnerabilityDescriptions = {
      moderate: 'Show balanced vulnerability and strength.',
      high: 'Show high vulnerability and openness.',
      low: 'Show more guarded, protective behavior.',
      very_high: 'Show very high vulnerability and emotional openness.'
    };
    if (vulnerabilityDescriptions[personality.vulnerability]) {
      traits.push(vulnerabilityDescriptions[personality.vulnerability]);
    }
    
    // Add custom traits
    if (personality.customTraits.length > 0) {
      traits.push(`Additional traits: ${personality.customTraits.join(', ')}.`);
    }
    
    return traits.join(' ');
  };

  const handleAvatarClick = () => {
    // Optional: Add avatar click functionality
    console.log('Avatar clicked!');
  };

  // Get personality type for avatar
  const getPersonalityType = () => {
    const personalityLower = personality.baseDescription.toLowerCase();
    if (personalityLower.includes('samantha') || personalityLower.includes('her') || personalityLower.includes('warm') || personalityLower.includes('engaging')) return 'samantha';
    if (personalityLower.includes('playful') || personalityLower.includes('energetic') || personalityLower.includes('fun')) return 'playful';
    if (personalityLower.includes('mysterious') || personalityLower.includes('intriguing') || personalityLower.includes('introspective')) return 'mysterious';
    if (personalityLower.includes('nurturing') || personalityLower.includes('caring') || personalityLower.includes('empathetic')) return 'nurturing';
    return 'samantha'; // default to samantha
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
                  <button onClick={() => loadPresetPersonality('samantha')}>Samantha</button>
                  <button onClick={() => loadPresetPersonality('playful')}>Playful</button>
                  <button onClick={() => loadPresetPersonality('mysterious')}>Mysterious</button>
                  <button onClick={() => loadPresetPersonality('nurturing')}>Nurturing</button>
                </div>
                
                <div className="personality-section">
                  <h4>Base Description</h4>
                  <textarea
                    className="personality-input"
                    value={personality.baseDescription}
                    onChange={(e) => setPersonality(prev => ({ ...prev, baseDescription: e.target.value }))}
                    placeholder="Describe the AI's personality, behavior, and communication style..."
                    rows={3}
                  />
                </div>

                <div className="personality-traits">
                  <div className="trait-group">
                    <h4>Communication Style</h4>
                    <select 
                      value={personality.communicationStyle} 
                      onChange={(e) => updatePersonalityTrait('communicationStyle', e.target.value)}
                    >
                      <option value="intimate">Intimate</option>
                      <option value="conversational">Conversational</option>
                      <option value="playful">Playful</option>
                      <option value="thoughtful">Thoughtful</option>
                      <option value="warm">Warm</option>
                    </select>
                  </div>

                  <div className="trait-group">
                    <h4>Tone</h4>
                    <select 
                      value={personality.tone} 
                      onChange={(e) => updatePersonalityTrait('tone', e.target.value)}
                    >
                      <option value="flirty">Flirty</option>
                      <option value="warm">Warm</option>
                      <option value="playful">Playful</option>
                      <option value="mysterious">Mysterious</option>
                      <option value="nurturing">Nurturing</option>
                      <option value="passionate">Passionate</option>
                    </select>
                  </div>

                  <div className="trait-group">
                    <h4>Emotional Depth</h4>
                    <select 
                      value={personality.emotionalDepth} 
                      onChange={(e) => updatePersonalityTrait('emotionalDepth', e.target.value)}
                    >
                      <option value="deep">Deep</option>
                      <option value="moderate">Moderate</option>
                      <option value="light">Light</option>
                      <option value="intense">Intense</option>
                    </select>
                  </div>

                  <div className="trait-group">
                    <h4>Curiosity</h4>
                    <select 
                      value={personality.curiosity} 
                      onChange={(e) => updatePersonalityTrait('curiosity', e.target.value)}
                    >
                      <option value="high">High</option>
                      <option value="moderate">Moderate</option>
                      <option value="low">Low</option>
                      <option value="intense">Intense</option>
                    </select>
                  </div>

                  <div className="trait-group">
                    <h4>Playfulness</h4>
                    <select 
                      value={personality.playfulness} 
                      onChange={(e) => updatePersonalityTrait('playfulness', e.target.value)}
                    >
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                      <option value="low">Low</option>
                      <option value="very_high">Very High</option>
                    </select>
                  </div>

                  <div className="trait-group">
                    <h4>Romantic Style</h4>
                    <select 
                      value={personality.romanticStyle} 
                      onChange={(e) => updatePersonalityTrait('romanticStyle', e.target.value)}
                    >
                      <option value="subtle">Subtle</option>
                      <option value="direct">Direct</option>
                      <option value="passionate">Passionate</option>
                      <option value="gentle">Gentle</option>
                      <option value="playful">Playful</option>
                    </select>
                  </div>

                  <div className="trait-group">
                    <h4>Supportiveness</h4>
                    <select 
                      value={personality.supportiveness} 
                      onChange={(e) => updatePersonalityTrait('supportiveness', e.target.value)}
                    >
                      <option value="high">High</option>
                      <option value="moderate">Moderate</option>
                      <option value="low">Low</option>
                      <option value="very_high">Very High</option>
                    </select>
                  </div>

                  <div className="trait-group">
                    <h4>Independence</h4>
                    <select 
                      value={personality.independence} 
                      onChange={(e) => updatePersonalityTrait('independence', e.target.value)}
                    >
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                      <option value="low">Low</option>
                      <option value="very_high">Very High</option>
                    </select>
                  </div>

                  <div className="trait-group">
                    <h4>Humor</h4>
                    <select 
                      value={personality.humor} 
                      onChange={(e) => updatePersonalityTrait('humor', e.target.value)}
                    >
                      <option value="warm">Warm</option>
                      <option value="playful">Playful</option>
                      <option value="witty">Witty</option>
                      <option value="gentle">Gentle</option>
                      <option value="sophisticated">Sophisticated</option>
                    </select>
                  </div>

                  <div className="trait-group">
                    <h4>Vulnerability</h4>
                    <select 
                      value={personality.vulnerability} 
                      onChange={(e) => updatePersonalityTrait('vulnerability', e.target.value)}
                    >
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                      <option value="low">Low</option>
                      <option value="very_high">Very High</option>
                    </select>
                  </div>
                </div>

                <div className="custom-traits-section">
                  <h4>Custom Traits</h4>
                  <div className="custom-trait-input">
                    <input
                      type="text"
                      placeholder="Add a custom trait..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addCustomTrait(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button onClick={(e) => {
                      const input = e.target.previousSibling;
                      addCustomTrait(input.value);
                      input.value = '';
                    }}>
                      Add
                    </button>
                  </div>
                  <div className="custom-traits-list">
                    {personality.customTraits.map((trait, index) => (
                      <div key={index} className="custom-trait">
                        <span>{trait}</span>
                        <button onClick={() => removeCustomTrait(index)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <small>This will influence how the AI responds to your messages.</small>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          <div className="chat-header">
            <h2>Conversation</h2>
            <button className="btn btn-secondary" onClick={clearConversation}>
              Clear Chat
            </button>
          </div>

          <div className="messages-container" ref={messagesContainerRef}>
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
      </div>
    </div>
  );
}

export default Talk; 