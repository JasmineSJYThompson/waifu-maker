#!/usr/bin/env python3
"""
API Status Checker for Waifu Maker
This script helps you check the status of your APIs and available models.
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def check_backend_health():
    """Check the backend health endpoint"""
    try:
        response = requests.get('http://localhost:5000/api/health', timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend is running!")
            print(f"   ElevenLabs configured: {data.get('elevenlabs_configured', False)}")
            print(f"   Mistral configured: {data.get('mistral_configured', False)}")
            print(f"   Mistral client initialized: {data.get('mistral_client_initialized', False)}")
            if data.get('available_mistral_models'):
                print(f"   Available Mistral models: {data['available_mistral_models']}")
            return True
        else:
            print(f"❌ Backend returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on http://localhost:5000")
        return False
    except Exception as e:
        print(f"❌ Error checking backend: {e}")
        return False

def check_elevenlabs_voices():
    """Check if ElevenLabs voices endpoint works"""
    try:
        response = requests.get('http://localhost:5000/api/voices', timeout=10)
        if response.status_code == 200:
            data = response.json()
            voices = data.get('voices', [])
            print(f"✅ ElevenLabs API working! Found {len(voices)} voices")
            if voices:
                print(f"   First voice: {voices[0]['name']} ({voices[0]['id']})")
            return True
        else:
            print(f"❌ ElevenLabs API error: {response.status_code}")
            if response.status_code == 500:
                try:
                    error_data = response.json()
                    print(f"   Error details: {error_data.get('error', 'Unknown error')}")
                except:
                    pass
            return False
    except Exception as e:
        print(f"❌ Error checking ElevenLabs: {e}")
        return False

def check_mistral_chat():
    """Test a simple Mistral chat request"""
    try:
        test_data = {
            "message": "Hello!",
            "voice_id": "test_voice_id",
            "conversation_history": [],
            "personality": "You are a helpful AI assistant."
        }
        response = requests.post('http://localhost:5000/api/chat', 
                               json=test_data, timeout=30)
        
        if response.status_code == 200:
            print("✅ Mistral chat API working!")
            return True
        elif response.status_code == 429:
            print("⚠️  Mistral API rate limited (this is normal)")
            try:
                error_data = response.json()
                print(f"   Details: {error_data.get('details', 'Rate limit exceeded')}")
            except:
                pass
            return True  # This is actually working, just rate limited
        else:
            print(f"❌ Mistral chat API error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error details: {error_data.get('error', 'Unknown error')}")
            except:
                pass
            return False
    except Exception as e:
        print(f"❌ Error checking Mistral chat: {e}")
        return False

def main():
    print("🔍 Waifu Maker API Status Checker")
    print("=" * 50)
    
    # Check environment variables
    elevenlabs_key = os.getenv('ELEVENLABS_API_KEY')
    mistral_key = os.getenv('MISTRAL_API_KEY')
    
    print(f"ElevenLabs API Key: {'✅ Set' if elevenlabs_key else '❌ Not set'}")
    print(f"Mistral API Key: {'✅ Set' if mistral_key else '❌ Not set'}")
    print()
    
    # Check backend health
    if not check_backend_health():
        print("\n💡 To start the backend, run: cd backend && python app.py")
        return
    
    print()
    
    # Check APIs
    elevenlabs_ok = check_elevenlabs_voices()
    print()
    mistral_ok = check_mistral_chat()
    
    print("\n" + "=" * 50)
    print("📋 Summary:")
    print(f"   Backend: ✅ Running")
    print(f"   ElevenLabs: {'✅ Working' if elevenlabs_ok else '❌ Issues'}")
    print(f"   Mistral: {'✅ Working' if mistral_ok else '❌ Issues'}")
    
    if not elevenlabs_ok:
        print("\n💡 ElevenLabs issues:")
        print("   - Check your API key in backend/.env")
        print("   - Verify your ElevenLabs account has credits")
        print("   - Check ElevenLabs service status")
    
    if not mistral_ok:
        print("\n💡 Mistral issues:")
        print("   - Check your API key in backend/.env")
        print("   - Verify your Mistral AI Platform account")
        print("   - Check if you've hit rate limits")
        print("   - Ensure your API key has proper permissions")

if __name__ == "__main__":
    main() 