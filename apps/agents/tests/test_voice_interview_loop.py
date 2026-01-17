import os
import requests
import json
from dotenv import load_dotenv
from pathlib import Path
from supabase import create_client, Client

# 1. Setup Environment
script_dir = Path(__file__).resolve().parent
project_root = script_dir.parents[2]
env_path = project_root / ".env.local"

if env_path.exists():
    print(f"Loading env from: {env_path}")
    load_dotenv(env_path)
else:
    load_dotenv(project_root / ".env")

QUESTION_API_URL = "http://localhost:8000/api/agents/question"
TRANSCRIBE_API_URL = "http://localhost:8000/api/agents/transcribe/upload"

# 2. Setup Supabase
try:
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    supabase: Client = create_client(url, key)
except Exception as e:
    print(f"Error initializing Supabase: {e}")
    print("Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

def get_test_data():
    """Fetch one participant and one question to test with."""
    print("Fetching test data from Supabase...")
    p_res = supabase.table("participants").select("id, full_name").limit(1).execute()
    q_res = supabase.table("research_questions").select("id, root_question").limit(1).execute()

    if not p_res.data or not q_res.data:
        print("Error: Could not find participants or research questions in DB.")
        print("Run 'python apps/agents/scripts/seed_participants.py' and 'seed_questions.py' first.")
        exit(1)

    return p_res.data[0], q_res.data[0]

def transcribe_audio(file_path):
    """Uploads audio file to transcription service and returns text."""
    if not os.path.exists(file_path):
        print(f"❌ Error: File not found: {file_path}")
        return None
        
    print(f"🎤 Uploading {os.path.basename(file_path)}...")
    try:
        with open(file_path, "rb") as f:
            files = {"file": (os.path.basename(file_path), f, "audio/mpeg")}
            response = requests.post(TRANSCRIBE_API_URL, files=files)
            
        if response.status_code == 200:
            text = response.json().get("text")
            print(f"📝 Transcribed: \"{text}\"")
            return text
        else:
            print(f"❌ Transcription Failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Transcription Error: {e}")
        return None

def run_voice_loop():
    participant, question = get_test_data()
    
    print("\n" + "="*50)
    print(f"VOICE INTERVIEW SESSION START")
    print(f"Participant: {participant['full_name']} ({participant['id']})")
    print(f"Topic: {question['root_question']}")
    print("="*50 + "\n")

    history = []
    
    # Loop for 5 turns
    for i in range(5):
        print(f"\n[Turn {i+1}] Generating Agent Question...")
        
        payload = {
            "sessionId": "voice-test-session-1",
            "studyId": "voice-test-study-1",
            "participantId": participant['id'],
            "questionId": question['id'],
            "conversationHistory": history
        }

        try:
            # 1. Get Agent Question
            response = requests.post(QUESTION_API_URL, json=payload)
            response.raise_for_status()
            data = response.json()
            
            agent_question_text = data.get("text")
            print(f"\n🤖 Agent: {agent_question_text}")
            
            # 2. User Voice Answer
            while True:
                audio_path = input("\n🎙️  Enter path to answer audio file (or 'text:your answer' to bypass): ").strip()
                
                user_answer_text = ""
                
                if audio_path.lower().startswith("text:"):
                    # Bypass transcription for quick testing
                    user_answer_text = audio_path[5:]
                    break
                
                # Transcribe
                transcription = transcribe_audio(audio_path)
                if transcription:
                    user_answer_text = transcription
                    break
                else:
                    print("Please try again with a valid audio file.")

            # Update history
            history.append({"question": agent_question_text, "answer": user_answer_text})
            
        except requests.exceptions.ConnectionError:
            print(f"\n❌ Error: Could not connect to API.")
            print("Ensure Agents API is running (uvicorn main:app --port 8000)")
            break
        except Exception as e:
            print(f"\n❌ Loop Error: {e}")
            break

if __name__ == "__main__":
    run_voice_loop()
