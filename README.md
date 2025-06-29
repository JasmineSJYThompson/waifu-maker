# Waifu Maker - AI Voice Generation & Chat

A modern web application that combines ElevenLabs voice generation with Mistral AI for interactive conversations. Features a 2D talking avatar that visualizes AI speech with lip-sync animations.

## ✨ Features

### 🎤 Voice Generation
- **ElevenLabs Integration**: High-quality text-to-speech with multiple voice options
- **Voice Selection**: Choose from various AI voices with different characteristics
- **Real-time Generation**: Instant audio generation from text input
- **Audio Playback**: Built-in audio player with controls

### 💬 AI Chat with Talking Avatar
- **Mistral AI Integration**: Advanced conversational AI powered by Mistral
- **2D Talking Avatar**: Animated character that visualizes AI speech
- **Lip-sync Animation**: Mouth movements synchronized with speech
- **Personality System**: Customize AI behavior and communication style
- **Conversation History**: Full chat history with audio playback
- **Visual Feedback**: Avatar expressions and status indicators

### 🎭 Avatar Features
- **GIF-based Avatar**: Realistic talking animations using GIF files
- **Smart GIF Selection**: Automatically chooses between talking.gif and talking_long.gif based on message length
- **Idle State**: Shows idle_avatar.png when not speaking
- **Seamless Transitions**: Smooth transitions between idle and talking states
- **Status Indicators**: Visual feedback for speaking, listening, and idle states
- **Responsive Design**: Adapts to different screen sizes
- **Automatic Looping**: GIFs loop during speech for continuous talking effect

### 🎨 Modern UI
- **Glassmorphism Design**: Beautiful glass-like interface
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Dark Theme**: Easy on the eyes with modern aesthetics
- **Smooth Transitions**: Fluid animations throughout the app

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- ElevenLabs API key
- Mistral AI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd waifu_maker
   ```

2. **Set up the backend**
   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Set up environment variables
   cp backend/env.example backend/.env
   # Edit backend/.env with your API keys
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   ```

4. **Start the application**
   ```bash
   # From the root directory
   ./start.sh
   ```

   Or start manually:
   ```bash
   # Terminal 1 - Backend
   cd backend
   python app.py
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

5. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📖 Usage

### Voice Generation
1. Navigate to the **Voice Generator** page
2. Select a voice from the available options
3. Enter your text in the input field
4. Click "Generate Voice" to create audio
5. Use the audio controls to play, pause, or download

### AI Chat with Avatar
1. Navigate to the **Talk** page
2. Choose your preferred AI voice
3. Configure the AI personality (optional):
   - Use preset personalities: Friendly, Professional, Creative, Casual
   - Or write a custom personality description
4. Start chatting! The avatar will:
   - Show listening indicators while processing
   - Animate with lip-sync during speech
   - Display personality-based expressions
   - Provide visual feedback for all states

### Avatar Interactions
- **Click the avatar** for additional interactions (customizable)
- **Watch the expressions** change based on personality and conversation state
- **Observe lip-sync** animations synchronized with speech timing
- **See status indicators** for speaking, listening, and ready states

## 🔧 Configuration

### Environment Variables
Create `backend/.env` with:
```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key
MISTRAL_API_KEY=your_mistral_api_key
```

### API Keys
- **ElevenLabs**: Get your API key from [ElevenLabs Console](https://elevenlabs.io/)
- **Mistral AI**: Get your API key from [Mistral AI Platform](https://console.mistral.ai/)

## 🎨 Customization

### Avatar GIFs
The avatar uses GIF files for realistic talking animations:

- **idle_avatar.png**: Static image shown when not speaking
- **talking.gif**: Short talking animation for brief messages (≤10 words)
- **talking_long.gif**: Longer talking animation for extended messages (>10 words)

### GIF Selection Logic
The system automatically chooses the appropriate GIF based on message length:
- Messages with 10 words or fewer use `talking.gif`
- Messages with more than 10 words use `talking_long.gif`

### Custom Personalities
Write custom personality descriptions to create unique AI behaviors. The personality badge on the avatar will display the detected personality type.

## 📱 API Endpoints

### Voice Generation
- `GET /api/voices` - List available voices
- `POST /api/generate-voice` - Generate audio from text

### Chat
- `POST /api/chat` - Send message and get AI response with audio
- `GET /api/health` - Check API status and available models

## 🛠️ Development

### Project Structure
```
waifu_maker/
├── backend/
│   ├── app.py              # Flask API server
│   └── env.example         # Environment variables template
├── frontend/
│   ├── public/
│   │   ├── idle_avatar.png # Idle avatar image
│   │   ├── talking.gif     # Short talking animation
│   │   ├── talking_long.gif # Long talking animation
│   │   └── index.html      # Main HTML file
│   ├── src/
│   │   ├── App.js          # Main app component
│   │   ├── VoiceGenerator.js # Voice generation page
│   │   ├── Talk.js         # Chat page with avatar
│   │   ├── Avatar.js       # GIF-based avatar component
│   │   └── *.css           # Component styles
│   └── package.json        # Frontend dependencies
├── requirements.txt        # Python dependencies
└── start.sh               # Startup script
```

### Adding New Features
- **New Avatar GIFs**: Replace or add new GIF files in `frontend/public/`
- **GIF Selection Logic**: Modify the word count threshold in `Avatar.js`
- **Additional Personalities**: Update personality presets in `Talk.js`
- **Custom Animations**: Extend Framer Motion animations for transitions

## 🐛 Troubleshooting

### Common Issues
1. **API Key Errors**: Ensure your API keys are correctly set in `backend/.env`
2. **CORS Issues**: The backend is configured to allow requests from `localhost:3000`
3. **Audio Playback**: Check browser autoplay policies and ensure audio is enabled
4. **Avatar Not Animating**: Verify that GIF files are accessible and properly formatted

### Rate Limiting
- ElevenLabs: Check your account limits
- Mistral AI: Monitor your API usage to avoid quota limits

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you encounter any issues or have questions, please open an issue on the repository.