import React, { useEffect } from 'react';
import './Agent.css';

function Agent() {
  useEffect(() => {
    // Check if the script is already loaded globally
    if (window.elevenlabsConvaiLoaded) {
      return;
    }

    // Check if the custom element is already defined
    if (customElements.get('elevenlabs-convai')) {
      window.elevenlabsConvaiLoaded = true;
      return;
    }

    // Add the ElevenLabs Convai script to the document head
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    
    // Set a flag to prevent multiple loads
    window.elevenlabsConvaiLoaded = true;
    
    script.onload = () => {
      console.log('ElevenLabs Convai script loaded successfully');
    };
    
    script.onerror = () => {
      console.error('Failed to load ElevenLabs Convai script');
      window.elevenlabsConvaiLoaded = false;
    };
    
    document.head.appendChild(script);
    
    // Cleanup function
    return () => {
      // Don't remove the script on cleanup to prevent re-loading issues
      // The script will persist for the session
    };
  }, []);

  return (
    <div className="agent-container">
      <h1>Talk with Agent</h1>
      <div className="convai-widget-container">
        <elevenlabs-convai agent-id="agent_01jywdzbjmfz7agw4p9jy7hzj4"></elevenlabs-convai>
      </div>
    </div>
  );
}

export default Agent; 