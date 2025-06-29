from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from elevenlabs import generate, save, set_api_key, voices
import os
from dotenv import load_dotenv
import tempfile
import json
import time
from collections import defaultdict
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
CORS(app)

# Simple rate limiting
request_timestamps = defaultdict(list)
RATE_LIMIT_PER_MINUTE = 30  # Mistral has better rate limits

def check_rate_limit():
    """Simple rate limiting for Mistral API calls"""
    current_time = time.time()
    minute_ago = current_time - 60
    
    # Clean old timestamps
    request_timestamps['mistral'] = [ts for ts in request_timestamps['mistral'] if ts > minute_ago]
    
    # Check if we're over the limit
    if len(request_timestamps['mistral']) >= RATE_LIMIT_PER_MINUTE:
        return False
    
    # Add current request
    request_timestamps['mistral'].append(current_time)
    return True

# Set ElevenLabs API key
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')
if ELEVENLABS_API_KEY:
    set_api_key(ELEVENLABS_API_KEY)

# Set Mistral API key
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY')
mistral_client = None
if MISTRAL_API_KEY:
    try:
        mistral_client = MistralClient(api_key=MISTRAL_API_KEY)
        print("Successfully initialized Mistral client")
    except Exception as e:
        print(f"Error initializing Mistral client: {e}")
        mistral_client = None

# Default personality template
DEFAULT_PERSONALITY = """You are a helpful and friendly AI assistant. You respond in a conversational manner and try to be engaging and informative. Keep your responses concise but helpful."""

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    status = {
        'status': 'healthy',
        'message': 'Waifu Maker API is running',
        'elevenlabs_configured': bool(ELEVENLABS_API_KEY),
        'mistral_configured': bool(MISTRAL_API_KEY),
        'mistral_client_initialized': mistral_client is not None
    }
    
    # Check available Mistral models if API key is configured
    if MISTRAL_API_KEY and mistral_client:
        try:
            models = mistral_client.models.list()
            available_models = [model.id for model in models]
            status['available_mistral_models'] = available_models
        except Exception as e:
            status['mistral_models_error'] = str(e)
    
    return jsonify(status)

@app.route('/api/voices', methods=['GET'])
def get_voices():
    """Get available voices from ElevenLabs"""
    try:
        if not ELEVENLABS_API_KEY:
            return jsonify({'error': 'ElevenLabs API key not configured'}), 500
        
        available_voices = voices()
        voice_list = []
        
        for voice in available_voices:
            voice_list.append({
                'id': voice.voice_id,
                'name': voice.name,
                'category': voice.category,
                'description': voice.labels.get('description', ''),
                'accent': voice.labels.get('accent', ''),
                'age': voice.labels.get('age', ''),
                'gender': voice.labels.get('gender', '')
            })
        
        return jsonify({'voices': voice_list})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat_with_voice():
    """Chat with AI and get voice response"""
    try:
        if not MISTRAL_API_KEY:
            return jsonify({'error': 'Mistral API key not configured'}), 500
        
        if not ELEVENLABS_API_KEY:
            return jsonify({'error': 'ElevenLabs API key not configured'}), 500
        
        data = request.get_json()
        message = data.get('message', '')
        voice_id = data.get('voice_id', '')
        conversation_history = data.get('conversation_history', [])
        personality = data.get('personality', DEFAULT_PERSONALITY)
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        if not voice_id:
            return jsonify({'error': 'Voice ID is required'}), 400
        
        if not mistral_client:
            return jsonify({'error': 'Mistral client not initialized'}), 500
        
        # Check rate limit
        if not check_rate_limit():
            return jsonify({
                'error': 'Rate limit exceeded. Please wait a moment before sending another message.',
                'details': f'Maximum {RATE_LIMIT_PER_MINUTE} requests per minute allowed.',
                'retry_after': 'Please wait about 1 minute before trying again.'
            }), 429
        
        # Prepare conversation messages for Mistral
        messages = []
        
        # Add personality as system message
        messages.append(ChatMessage(role="system", content=personality))
        
        # Add conversation history
        for msg in conversation_history:
            role = "assistant" if msg.get('role') == 'assistant' else "user"
            messages.append(ChatMessage(role=role, content=msg.get('content', '')))
        
        # Add current message
        messages.append(ChatMessage(role="user", content=message))
        
        # Get AI response with better error handling
        try:
            response = mistral_client.chat(
                model="mistral-large-latest",  # Using the latest model
                messages=messages,
                max_tokens=500,  # Limit response length
                temperature=0.7  # Add some creativity
            )
            ai_response = response.choices[0].message.content
        except Exception as mistral_error:
            error_msg = str(mistral_error)
            if "429" in error_msg or "quota" in error_msg.lower() or "rate" in error_msg.lower():
                return jsonify({
                    'error': 'Mistral API rate limit exceeded. Please try again later.',
                    'details': 'You have hit the rate limit. Please wait before trying again.',
                    'retry_after': 'Please wait a few minutes before trying again.'
                }), 429
            elif "model" in error_msg.lower() and "not found" in error_msg.lower():
                return jsonify({
                    'error': 'Mistral model not available. Please check your API configuration.',
                    'details': error_msg
                }), 500
            else:
                return jsonify({
                    'error': 'Failed to get AI response',
                    'details': error_msg
                }), 500
        
        # Generate voice for the AI response
        audio = generate(
            text=ai_response,
            voice=voice_id,
            model='eleven_monolingual_v1'
        )
        
        # Convert to base64
        import base64
        
        # Save to temporary file first
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
            save(audio, temp_file.name)
            temp_file_path = temp_file.name
        
        # Read the file and convert to base64
        with open(temp_file_path, 'rb') as audio_file:
            audio_data = audio_file.read()
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        return jsonify({
            'ai_response': ai_response,
            'audio': audio_base64,
            'format': 'mp3',
            'voice_id': voice_id,
            'model_used': 'mistral-large-latest',
            'personality': personality
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-voice', methods=['POST'])
def generate_voice():
    """Generate voice from text using ElevenLabs"""
    try:
        if not ELEVENLABS_API_KEY:
            return jsonify({'error': 'ElevenLabs API key not configured'}), 500
        
        data = request.get_json()
        text = data.get('text', '')
        voice_id = data.get('voice_id', '')
        model_id = data.get('model_id', 'eleven_monolingual_v1')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        if not voice_id:
            return jsonify({'error': 'Voice ID is required'}), 400
        
        # Generate audio
        audio = generate(
            text=text,
            voice=voice_id,
            model=model_id
        )
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
            save(audio, temp_file.name)
            temp_file_path = temp_file.name
        
        # Return the audio file
        return send_file(
            temp_file_path,
            mimetype='audio/mpeg',
            as_attachment=True,
            download_name='generated_voice.mp3'
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-voice-stream', methods=['POST'])
def generate_voice_stream():
    """Generate voice and return as base64 encoded audio"""
    try:
        if not ELEVENLABS_API_KEY:
            return jsonify({'error': 'ElevenLabs API key not configured'}), 500
        
        data = request.get_json()
        text = data.get('text', '')
        voice_id = data.get('voice_id', '')
        model_id = data.get('model_id', 'eleven_monolingual_v1')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        if not voice_id:
            return jsonify({'error': 'Voice ID is required'}), 400
        
        # Generate audio
        audio = generate(
            text=text,
            voice=voice_id,
            model=model_id
        )
        
        # Convert to base64
        import base64
        
        # Save to temporary file first
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
            save(audio, temp_file.name)
            temp_file_path = temp_file.name
        
        # Read the file and convert to base64
        with open(temp_file_path, 'rb') as audio_file:
            audio_data = audio_file.read()
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        return jsonify({
            'audio': audio_base64,
            'format': 'mp3',
            'text': text,
            'voice_id': voice_id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload-audio', methods=['POST'])
def upload_audio():
    """Upload custom audio file for voice cloning (placeholder)"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # This is a placeholder for voice cloning functionality
        # In a real implementation, you would upload to ElevenLabs for voice cloning
        
        return jsonify({
            'message': 'Audio upload endpoint (voice cloning not implemented)',
            'filename': file.filename
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def serve():
    """Serve the React app"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    """Serve static files and handle React routing"""
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True) 