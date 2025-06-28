# Waifu Maker API Documentation

## Base URL
```
http://localhost:5000
```

## Endpoints

### Health Check
**GET** `/api/health`

Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "message": "Waifu Maker API is running"
}
```

### Get Available Voices
**GET** `/api/voices`

Retrieve all available voices from ElevenLabs.

**Response:**
```json
{
  "voices": [
    {
      "id": "voice_id",
      "name": "Voice Name",
      "category": "voice_category",
      "description": "Voice description",
      "accent": "accent_info",
      "age": "age_info",
      "gender": "gender_info"
    }
  ]
}
```

### Generate Voice (File Download)
**POST** `/api/generate-voice`

Generate voice from text and return as downloadable MP3 file.

**Request Body:**
```json
{
  "text": "Text to convert to speech",
  "voice_id": "voice_id_from_elevenlabs",
  "model_id": "eleven_monolingual_v1"
}
```

**Response:** MP3 file download

### Generate Voice (Stream)
**POST** `/api/generate-voice-stream`

Generate voice from text and return as base64 encoded audio.

**Request Body:**
```json
{
  "text": "Text to convert to speech",
  "voice_id": "voice_id_from_elevenlabs",
  "model_id": "eleven_monolingual_v1"
}
```

**Response:**
```json
{
  "audio": "base64_encoded_audio_data",
  "format": "mp3",
  "text": "original_text",
  "voice_id": "voice_id_used"
}
```

### Upload Audio (Placeholder)
**POST** `/api/upload-audio`

Upload custom audio file for voice cloning (placeholder endpoint).

**Request:** Multipart form data with audio file

**Response:**
```json
{
  "message": "Audio upload endpoint (voice cloning not implemented)",
  "filename": "uploaded_filename.mp3"
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400` - Bad Request (missing required fields)
- `500` - Internal Server Error (API key issues, ElevenLabs errors)

## Environment Variables

Required environment variables:
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key

## Usage Examples

### Using curl to generate voice:

```bash
# Get available voices
curl http://localhost:5000/api/voices

# Generate voice (stream)
curl -X POST http://localhost:5000/api/generate-voice-stream \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test of the voice generation!",
    "voice_id": "your_voice_id_here"
  }'
```

### Using JavaScript/Axios:

```javascript
import axios from 'axios';

// Generate voice
const response = await axios.post('http://localhost:5000/api/generate-voice-stream', {
  text: 'Hello, world!',
  voice_id: 'voice_id_here'
});

// Convert base64 to audio
const audioBlob = base64ToBlob(response.data.audio, 'audio/mpeg');
const audioUrl = URL.createObjectURL(audioBlob);
``` 