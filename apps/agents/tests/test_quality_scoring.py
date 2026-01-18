import sys
import os
import requests
import json
from pathlib import Path

# Add scripts directory to path to import seed_session
script_dir = Path(__file__).resolve().parent.parent / "scripts"
sys.path.append(str(script_dir))

try:
    from seed_session import seed_session
except ImportError:
    print("Error: Could not import seed_session. Ensure apps/agents/scripts/seed_session.py exists.")
    exit(1)

API_URL = "http://localhost:8000/api/agents/quality"

def test_quality_scoring():
    print("1. Seeding Session for Database Integrity...")
    try:
        session_id = seed_session()
    except Exception as e:
        print(f"❌ Failed to seed session: {e}")
        return

    print(f"\n2. Testing Quality Agent with Session ID: {session_id}")
    
    payload = {
        "sessionId": session_id,
        "questionText": "What frustrates you most about your current workflow?",
        "answerText": "It's just really slow. I have to click like ten times to get to the report I need, and half the time it creates a duplicate entry that I have to delete manually. It drives me crazy.",
        "conversationHistory": [
            {"question": "How long have you been using the tool?", "answer": "About 3 years."}
        ]
    }
    
    try:
        response = requests.post(API_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        
        print("\n✅ API Response Received:")
        print(json.dumps(data, indent=2))
        
        # Validation
        if data.get('qaTurnId') and data.get('qualityLabelId'):
            print("\n✅ SUCCESS: Database records created!")
            print(f"   - QA Turn ID: {data['qaTurnId']}")
            print(f"   - Quality Label ID: {data['qualityLabelId']}")
        else:
            print("\n❌ FAILURE: Database IDs missing from response.")
            
        if "overall_score" in data:
            print(f"\n✅ Score Generated: {data['overall_score']}")
        else:
            print("\n❌ FAILURE: No score generated.")

    except requests.exceptions.ConnectionError:
        print(f"\n❌ Connection Error: Is the API running? (uvicorn main:app --port 8000)")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        if 'response' in locals():
            print(response.text)

if __name__ == "__main__":
    test_quality_scoring()
