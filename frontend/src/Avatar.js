import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import './Avatar.css';

const Avatar = ({ 
  isSpeaking, 
  isListening, 
  personality = 'friendly',
  currentMessage = '',
  onAvatarClick 
}) => {
  const [mouthOpen, setMouthOpen] = useState(false);
  const [blink, setBlink] = useState(false);
  const [expression, setExpression] = useState('neutral');
  const audioRef = useRef(null);
  const lipSyncInterval = useRef(null);

  // Spring animations for smooth movements
  const headBob = useSpring({
    transform: isSpeaking ? 'translateY(-2px)' : 'translateY(0px)',
    config: { tension: 300, friction: 20 }
  });

  const eyeBlink = useSpring({
    scaleY: blink ? 0.1 : 1,
    config: { tension: 400, friction: 30 }
  });

  const mouthAnimation = useSpring({
    scaleY: mouthOpen ? 1.2 : 0.8,
    config: { tension: 500, friction: 25 }
  });

  // Personality-based expressions
  const getExpression = (personality) => {
    const expressions = {
      friendly: { eyes: 'happy', mouth: 'smile', color: '#FFB6C1' },
      professional: { eyes: 'focused', mouth: 'neutral', color: '#87CEEB' },
      creative: { eyes: 'sparkly', mouth: 'grin', color: '#DDA0DD' },
      casual: { eyes: 'relaxed', mouth: 'slight-smile', color: '#98FB98' }
    };
    return expressions[personality] || expressions.friendly;
  };

  const currentExpression = getExpression(personality);

  // Lip sync animation
  useEffect(() => {
    if (isSpeaking && currentMessage) {
      // Calculate words per second for lip sync
      const words = currentMessage.split(' ').length;
      const estimatedDuration = words * 0.5; // Rough estimate: 0.5 seconds per word
      const lipSyncSpeed = Math.max(100, Math.min(300, estimatedDuration * 1000 / words));

      lipSyncInterval.current = setInterval(() => {
        setMouthOpen(prev => !prev);
      }, lipSyncSpeed);

      return () => {
        if (lipSyncInterval.current) {
          clearInterval(lipSyncInterval.current);
          setMouthOpen(false);
        }
      };
    } else {
      setMouthOpen(false);
      if (lipSyncInterval.current) {
        clearInterval(lipSyncInterval.current);
      }
    }
  }, [isSpeaking, currentMessage]);

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Expression changes based on personality and state
  useEffect(() => {
    if (isListening) {
      setExpression('attentive');
    } else if (isSpeaking) {
      setExpression('speaking');
    } else {
      setExpression('neutral');
    }
  }, [isSpeaking, isListening]);

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
        {/* Avatar Background */}
        <animated.div 
          className="avatar-background"
          style={{
            ...headBob,
            backgroundColor: currentExpression.color
          }}
        />

        {/* Head */}
        <div className="avatar-head">
          {/* Eyes */}
          <div className="eyes">
            <animated.div 
              className="eye left-eye"
              style={eyeBlink}
            >
              <div className={`eye-inner ${currentExpression.eyes}`} />
            </animated.div>
            <animated.div 
              className="eye right-eye"
              style={eyeBlink}
            >
              <div className={`eye-inner ${currentExpression.eyes}`} />
            </animated.div>
          </div>

          {/* Mouth */}
          <animated.div 
            className="mouth-container"
            style={mouthAnimation}
          >
            <div className={`mouth ${currentExpression.mouth} ${mouthOpen ? 'open' : ''}`} />
          </animated.div>

          {/* Cheeks */}
          <div className="cheeks">
            <div className="cheek left-cheek" />
            <div className="cheek right-cheek" />
          </div>
        </div>

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