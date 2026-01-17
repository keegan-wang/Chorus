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

API_URL = "http://localhost:8000/api/agents/question"

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

def run_interactive_test():
    participant, question = get_test_data()
    
    print("\n" + "="*50)
    print(f"INTERVIEW SESSION START")
    print(f"Participant: {participant['full_name']} ({participant['id']})")
    print(f"Topic: {question['root_question']}")
    print("="*50 + "\n")

    history = []
    
    # Loop for 5 turns
    for i in range(5):
        print(f"\n[Turn {i+1}] Generating Agent Question...")
        
        payload = {
            "sessionId": "test-session-123",
            "studyId": "test-study-456",
            "participantId": participant['id'],
            "questionId": question['id'],
            "conversationHistory": history
        }

        try:
            response = requests.post(API_URL, json=payload)
            response.raise_for_status()
            data = response.json()
            
            agent_question = data.get("text")
            print(f"\n🤖 Agent: {agent_question}")
            
            # User input
            user_answer = input("\n👤 You (Answer): ")
            
            # Update history for next turn
            history.append({"question": agent_question, "answer": user_answer})
            
        except requests.exceptions.ConnectionError:
            print(f"\n❌ Error: Could not connect to {API_URL}.")
            print("Is the Agent API running? (uvicorn main:app --port 8000)")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            if response:
                print(f"Response: {response.text}")
            break

if __name__ == "__main__":
    run_interactive_test()
