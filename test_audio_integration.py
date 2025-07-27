#!/usr/bin/env python3
"""
Test script for audio processing integration
"""
import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
TEST_AUDIO_FILE = "test.mp3"  # Make sure this file exists

def test_transcribe_only():
    """Test transcription only endpoint"""
    print("🎯 Testing /transcribe-only endpoint...")
    
    try:
        with open(TEST_AUDIO_FILE, "rb") as f:
            files = {"audio_file": f}
            response = requests.post(f"{BASE_URL}/transcribe-only", files=files)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Transcription successful!")
            print(f"📝 Transcript: {result['transcript']}")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            
    except FileNotFoundError:
        print(f"❌ Audio file '{TEST_AUDIO_FILE}' not found. Please ensure it exists.")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_process_audio():
    """Test full audio processing endpoint"""
    print("\n🎯 Testing /process-audio endpoint...")
    
    try:
        with open(TEST_AUDIO_FILE, "rb") as f:
            files = {"audio_file": f}
            data = {"target_language": "french"}
            response = requests.post(f"{BASE_URL}/process-audio", files=files, data=data)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Audio processing successful!")
            print(f"📝 Transcript: {result['transcript']}")
            print(f"📋 Summary: {result['summary']}")
            print(f"🌍 Target Language: {result['target_language']}")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            
    except FileNotFoundError:
        print(f"❌ Audio file '{TEST_AUDIO_FILE}' not found. Please ensure it exists.")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_translate_text():
    """Test text translation endpoint"""
    print("\n🎯 Testing /translate-text endpoint...")
    
    try:
        data = {"text": "Hello, this is an emergency. I need help.", "target_language": "french"}
        response = requests.post(f"{BASE_URL}/translate-text", params=data)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Translation successful!")
            print(f"🔤 Original: {result['original']}")
            print(f"🔄 Translated: {result['translated']}")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_create_session_and_process():
    """Test creating a session and processing audio with it"""
    print("\n🎯 Testing session creation + audio processing...")
    
    try:
        # First create a call session
        session_data = {
            "fullname": "John Doe",
            "phone_number": "+1234567890",
            "language": "english",
            "location": "New York",
            "sex": "male"
        }
        
        response = requests.post(f"{BASE_URL}/start-call", json=session_data)
        
        if response.status_code == 200:
            session_result = response.json()
            session_id = session_result["session_id"]
            print(f"✅ Session created! ID: {session_id}")
            
            # Now process audio with the session
            with open(TEST_AUDIO_FILE, "rb") as f:
                files = {"audio_file": f}
                data = {"session_id": session_id, "target_language": "french"}
                response = requests.post(f"{BASE_URL}/process-audio", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Audio processed and saved to session!")
                print(f"📝 Transcript: {result['transcript']}")
                print(f"📋 Summary: {result['summary']}")
                
                # Check the live feed to see our messages
                response = requests.get(f"{BASE_URL}/live-feed/{session_id}")
                if response.status_code == 200:
                    feed = response.json()
                    print(f"💬 Messages in session: {len(feed['messages'])}")
                    for msg in feed['messages']:
                        print(f"   {msg['sender_type']}: {msg['message'][:100]}...")
                        
            else:
                print(f"❌ Audio processing error: {response.status_code} - {response.text}")
        else:
            print(f"❌ Session creation error: {response.status_code} - {response.text}")
            
    except FileNotFoundError:
        print(f"❌ Audio file '{TEST_AUDIO_FILE}' not found. Please ensure it exists.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🧪 Starting Audio Integration Tests")
    print("=" * 50)
    
    # Test individual endpoints
    test_transcribe_only()
    test_process_audio() 
    test_translate_text()
    test_create_session_and_process()
    
    print("\n" + "=" * 50)
    print("🏁 Tests completed!")
    print("\nTo run the backend server:")
    print("cd emergency-call-backend && python main.py")