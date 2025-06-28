import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Avatar.css';

const Avatar = ({ 
  isSpeaking, 
  isListening, 
  personality = 'friendly',
  currentMessage = '',
  onAvatarClick 
}) => {
  const [currentGif, setCurrentGif] = useState(null);
  const [showIdle, setShowIdle] = useState(true);
  const [gifLoaded, setGifLoaded] = useState(false);
  const [gifError, setGifError] = useState(false);
  const gifRef = useRef(null);
  const idleImageRef = useRef(null);

  // Determine which GIF to use based on message length
  const getGifSource = (message) => {
    if (!message) return null;
    const wordCount = message.split(' ').length;
    // Use talking_long.gif for longer messages (more than 10 words)
    return wordCount > 10 ? '/talking_long.gif' : '/talking.gif';
  };

  // Handle GIF playback
  useEffect(() => {
    if (isSpeaking && currentMessage) {
      const gifSource = getGifSource(currentMessage);
      setCurrentGif(gifSource);
      setShowIdle(false);
      setGifError(false);
      setGifLoaded(false);
      
      // Preload the GIF
      const img = new Image();
      img.onload = () => {
        console.log('GIF loaded successfully');
        setGifLoaded(true);
        setGifError(false);
      };
      img.onerror = () => {
        console.error('Error loading GIF');
        setGifError(true);
        setShowIdle(true);
      };
      img.src = gifSource;
    } else {
      // Stop GIF and show idle
      setShowIdle(true);
      setCurrentGif(null);
      setGifLoaded(false);
      setGifError(false);
    }
  }, [isSpeaking, currentMessage]);

  const handleAvatarClick = () => {
    if (onAvatarClick) {
      onAvatarClick();
    }
  };

  return (
    <div className="avatar-container">
      <motion.div
        className="avatar"
        onClick={handleAvatarClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Idle Avatar Image */}
        <AnimatePresence>
          {showIdle && (
            <motion.img
              ref={idleImageRef}
              src="/idle_avatar.png"
              alt="Idle Avatar"
              className="avatar-image idle-avatar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>

        {/* Talking GIF */}
        <AnimatePresence>
          {!showIdle && currentGif && (
            <motion.img
              ref={gifRef}
              src={currentGif}
              alt="Talking Avatar"
              className="avatar-gif talking-gif"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>

        {/* Loading indicator for GIF */}
        {!showIdle && currentGif && !gifLoaded && !gifError && (
          <div className="gif-loading">
            <div className="loading-spinner"></div>
          </div>
        )}

        {/* Error indicator */}
        {gifError && (
          <div className="gif-error">
            <span>GIF Error</span>
          </div>
        )}

        {/* Status Indicators */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              className="speaking-indicator"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="sound-waves">
                <div className="wave" />
                <div className="wave" />
                <div className="wave" />
              </div>
            </motion.div>
          )}

          {isListening && (
            <motion.div
              className="listening-indicator"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="listening-dots">
                <div className="dot" />
                <div className="dot" />
                <div className="dot" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Personality Badge */}
        <div className="personality-badge">
          {personality.charAt(0).toUpperCase() + personality.slice(1)}
        </div>
      </motion.div>

      {/* Status Text */}
      <div className="avatar-status">
        {isSpeaking && (
          <motion.div
            className="status-text speaking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Speaking...
          </motion.div>
        )}
        {isListening && (
          <motion.div
            className="status-text listening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Listening...
          </motion.div>
        )}
        {!isSpeaking && !isListening && (
          <motion.div
            className="status-text idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Ready to chat
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Avatar; 