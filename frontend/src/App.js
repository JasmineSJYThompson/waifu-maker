import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mic, Play, Download, Volume2, Loader, MessageCircle, Home, Video, Bot } from 'lucide-react';
import VoiceGenerator from './VoiceGenerator';
import Talk from './Talk';
import VideoTest from './VideoTest';
import Agent from './Agent';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('voice'); // 'voice', 'talk', 'agent', or 'test'
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState(null);

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

  const generateVoice = async () => {
    if (!text.trim()) {
      setError('Please enter some text to generate voice.');
      return;
    }

    if (!selectedVoice) {
      setError('Please select a voice.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await axios.post(`${API_BASE_URL}/api/generate-voice-stream`, {
        text: text.trim(),
        voice_id: selectedVoice,
        model_id: 'eleven_monolingual_v1'
      }, {
        responseType: 'json'
      });

      if (response.data.audio) {
        // Convert base64 to audio URL
        const audioBlob = base64ToBlob(response.data.audio, 'audio/mpeg');
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setSuccess('Voice generated successfully!');
        
        // Clean up previous audio element
        if (audioElement) {
          URL.revokeObjectURL(audioElement.src);
        }
        setAudioElement(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate voice. Please try again.');
      console.error('Error generating voice:', err);
    } finally {
      setLoading(false);
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

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setError('Failed to play audio.');
      });
      
      setAudioElement(audio);
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = 'generated_voice.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleVoiceSelect = (voiceId) => {
    setSelectedVoice(voiceId);
  };

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl('');
    }
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
    }
    setIsPlaying(false);
    setSuccess('');
  };

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