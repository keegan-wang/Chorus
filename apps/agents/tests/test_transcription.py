import requests
import sys
import os

API_URL = "http://localhost:8000/api/agents/transcribe/upload"

def test_transcription(file_path):
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        return

    print(f"Uploading {file_path} to {API_URL}...")
    
    try:
        with open(file_path, "rb") as f:
            files = {"file": (os.path.basename(file_path), f, "audio/mpeg")}
            response = requests.post(API_URL, files=files)
            
        if response.status_code == 200:
            print("\n✅ Transcription Success:")
            print(response.json())
        else:
            print(f"\n❌ Failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python apps/agents/tests/test_transcription.py <path_to_audio_file>")
        print("Example: python apps/agents/tests/test_transcription.py sample.mp3")
    else:
        test_transcription(sys.argv[1])
