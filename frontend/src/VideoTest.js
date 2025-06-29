import React, { useRef, useEffect, useState } from 'react';

const VideoTest = () => {
  const gifRef = useRef(null);
  const [currentGif, setCurrentGif] = useState('/talking.gif');
  const [gifLoaded, setGifLoaded] = useState(false);

  useEffect(() => {
    // Test GIF accessibility
    const testGif = async () => {
      try {
        const response = await fetch('/talking.gif', { method: 'HEAD' });
        console.log('GIF accessibility:', response.ok);
        
        if (response.ok) {
          console.log('GIF headers:', response.headers);
        }
      } catch (error) {
        console.error('GIF test error:', error);
      }
    };
    
    testGif();
  }, []);

  const switchGif = () => {
    const newGif = currentGif === '/talking.gif' ? '/talking_long.gif' : '/talking.gif';
    setCurrentGif(newGif);
    setGifLoaded(false);
  };

  const handleGifLoad = () => {
    console.log('GIF loaded successfully');
    setGifLoaded(true);
  };

  const handleGifError = () => {
    console.error('GIF load error');
    setGifLoaded(false);
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3>GIF Test</h3>
      <button onClick={switchGif} style={{ margin: '10px' }}>
        Switch to {currentGif === '/talking.gif' ? 'Long' : 'Short'} GIF
      </button>
      <div style={{ margin: '20px' }}>
        <img
          ref={gifRef}
          src={currentGif}
          style={{ 
            width: '200px', 
            height: '200px', 
            border: '1px solid #ccc',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
          onLoad={handleGifLoad}
          onError={handleGifError}
          alt="Test GIF"
        />
      </div>
      <p>Current GIF: {currentGif}</p>
      <p>Status: {gifLoaded ? 'Loaded' : 'Loading...'}</p>
      <p>Check console for GIF accessibility and load status</p>
    </div>
  );
};

export default VideoTest; 