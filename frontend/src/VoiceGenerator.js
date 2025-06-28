import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mic, Play, Download, Volume2, Loader } from 'lucide-react';

function VoiceGenerator() {
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
    <>
      <div className="card">
        <h2>Voice Generation</h2>
        
        <div className="form-group">
          <label htmlFor="text">Text to Convert</label>
          <textarea
            id="text"
            className="input textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the text you want to convert to speech..."
            rows={4}
          />
        </div>

        <div className="form-group">
          <label>Select Voice</label>
          {loading && !voices.length ? (
            <div className="loading-container">
              <div className="loading"></div>
              <span>Loading voices...</span>
            </div>
          ) : (
            <div className="voice-grid">
              {voices.map((voice) => (
                <div
                  key={voice.id}
                  className={`voice-card ${selectedVoice === voice.id ? 'selected' : ''}`}
                  onClick={() => handleVoiceSelect(voice.id)}
                >
                  <h3>{voice.name}</h3>
                  <p><strong>Category:</strong> {voice.category}</p>
                  {voice.description && <p><strong>Description:</strong> {voice.description}</p>}
                  {voice.accent && <p><strong>Accent:</strong> {voice.accent}</p>}
                  {voice.age && <p><strong>Age:</strong> {voice.age}</p>}
                  {voice.gender && <p><strong>Gender:</strong> {voice.gender}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="controls">
          <button
            className="btn"
            onClick={generateVoice}
            disabled={loading || !text.trim() || !selectedVoice}
          >
            {loading ? (
              <>
                <Loader className="loading" />
                Generating...
              </>
            ) : (
              <>
                <Mic size={20} />
                Generate Voice
              </>
            )}
          </button>

          {audioUrl && (
            <>
              <button
                className="btn btn-secondary"
                onClick={playAudio}
                disabled={isPlaying}
              >
                <Play size={20} />
                {isPlaying ? 'Playing...' : 'Play'}
              </button>

              <button
                className="btn btn-secondary"
                onClick={downloadAudio}
              >
                <Download size={20} />
                Download
              </button>

              <button
                className="btn btn-secondary"
                onClick={clearAudio}
              >
                <Volume2 size={20} />
                Clear
              </button>
            </>
          )}
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {audioUrl && (
          <div className="audio-section">
            <h3>Generated Audio</h3>
            <audio
              className="audio-player"
              controls
              src={audioUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          </div>
        )}
      </div>

      <div className="card">
        <h2>About</h2>
        <p>
          This application uses ElevenLabs' advanced AI voice synthesis technology to convert text into natural-sounding speech. 
          Choose from a variety of voices and generate high-quality audio files.
        </p>
        <p>
          <strong>Note:</strong> You'll need a valid ElevenLabs API key to use this application. 
          Set it in your backend environment variables.
        </p>
      </div>
    </>
  );
}

export default VoiceGenerator; 