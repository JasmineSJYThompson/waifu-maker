import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';
import './VoiceInput.css';

const VoiceInput = ({ onTranscription, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError('');
      setIsProcessing(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Set up audio analysis for visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      microphoneRef.current.connect(analyserRef.current);
      
      // Update audio level for visualization
      const updateAudioLevel = () => {
        if (isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average);
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      // Set up MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        setIsProcessing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await sendAudioToServer(audioBlob);
        } catch (err) {
          setError('Failed to process audio. Please try again.');
          console.error('Error processing audio:', err);
        } finally {
          setIsProcessing(false);
          setRecordingTime(0);
          setAudioLevel(0);
        }
      };
      
      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsProcessing(false);
      
      // Start timer
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Start audio visualization
      updateAudioLevel();
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check permissions.');
      setIsProcessing(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      // Stop all tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const sendAudioToServer = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.transcript) {
      onTranscription(data.transcript);
    } else {
      throw new Error('No transcript received');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMicClick = () => {
    if (disabled || isProcessing) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Generate audio bars for visualization
  const audioBars = Array.from({ length: 20 }, (_, i) => {
    const height = isRecording ? Math.max(5, (audioLevel / 255) * 50 * Math.random()) : 5;
    return (
      <div
        key={i}
        className={`audio-bar ${isRecording ? 'active' : ''}`}
        style={{ height: `${height}px` }}
      />
    );
  });

  return (
    <div className="voice-input">
      <div className="voice-controls">
        <button
          className={`mic-button ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
          onClick={handleMicClick}
          disabled={disabled || isProcessing}
          type="button"
        >
          {isProcessing ? (
            <Loader size={24} className="spinning" />
          ) : isRecording ? (
            <MicOff size={24} />
          ) : (
            <Mic size={24} />
          )}
        </button>
        
        <div className="audio-visualizer">
          {audioBars}
        </div>
        
        <div className={`voice-status ${isRecording ? 'recording' : ''}`}>
          {isProcessing ? 'Processing...' : 
           isRecording ? 'Recording...' : 'Click to record'}
        </div>
        
        {isRecording && (
          <div className="recording-time">
            {formatTime(recordingTime)}
          </div>
        )}
      </div>
      
      {error && (
        <div className="voice-error">
          {error}
        </div>
      )}
      
      <div className="voice-instructions">
        {isRecording 
          ? 'Click the microphone again to stop recording'
          : 'Click the microphone to start voice recording. Speak clearly for better transcription.'
        }
      </div>
    </div>
  );
};

export default VoiceInput; 