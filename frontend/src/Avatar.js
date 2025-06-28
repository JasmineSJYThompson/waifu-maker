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
  const [currentVideo, setCurrentVideo] = useState(null);
  const [showIdle, setShowIdle] = useState(true);
  const videoRef = useRef(null);
  const idleImageRef = useRef(null);

  // Determine which video to use based on message length
  const getVideoSource = (message) => {
    if (!message) return null;
    const wordCount = message.split(' ').length;
    // Use talking_long.mp4 for longer messages (more than 10 words)
    return wordCount > 10 ? '/talking_long.mp4' : '/talking.mp4';
  };

  // Handle video playback
  useEffect(() => {
    if (isSpeaking && currentMessage) {
      const videoSource = getVideoSource(currentMessage);
      setCurrentVideo(videoSource);
      setShowIdle(false);
      
      // Start video playback
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(err => {
          console.error('Error playing video:', err);
          setShowIdle(true);
        });
      }
    } else {
      // Stop video and show idle
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setShowIdle(true);
      setCurrentVideo(null);
    }
  }, [isSpeaking, currentMessage]);

  // Handle video end
  const handleVideoEnd = () => {
    if (isSpeaking) {
      // Loop the video while still speaking
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(err => {
          console.error('Error looping video:', err);
          setShowIdle(true);
        });
      }
    } else {
      setShowIdle(true);
    }
  };

  // Handle video error
  const handleVideoError = () => {
    console.error('Video playback error');
    setShowIdle(true);
  };

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

        {/* Talking Video */}
        <AnimatePresence>
          {!showIdle && currentVideo && (
            <motion.video
              ref={videoRef}
              className="avatar-video talking-video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onEnded={handleVideoEnd}
              onError={handleVideoError}
              muted
              playsInline
            >
              <source src={currentVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </motion.video>
          )}
        </AnimatePresence>

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