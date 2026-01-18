import sys
import os
import requests
import json
from pathlib import Path

# Add scripts directory to path
script_dir = Path(__file__).resolve().parent.parent / "scripts"
sys.path.append(str(script_dir))

try:
    from seed_session import seed_session
except ImportError:
    print("Error: Could not import seed_session.")
    exit(1)

API_URL = "http://localhost:8000/api/agents/summary"

def seed_qa_turns(session_id):
    """Add sample Q&A turns to test with"""
    from supabase import create_client
    from dotenv import load_dotenv
    
    # Load env
    project_root = Path(__file__).resolve().parents[2]
    load_dotenv(project_root / ".env.local")
    load_dotenv(project_root / ".env")
    
    supabase = create_client(
        os.getenv("NEXT_PUBLIC_SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    )
    
    # Sample conversation
    qa_turns = [
        {
            "session_id": session_id,
            "turn_index": 0,
            "question_text": "What do you find most frustrating about online shopping?",
            "answer_transcript": "Honestly, it's the shipping costs. I'll fill up my cart and then see a $15 shipping fee at checkout. It makes me abandon the purchase every time.",
        },
        {
            "session_id": session_id,
            "turn_index": 1,
            "question_text": "Can you tell me more about when you last experienced this?",
            "answer_transcript": "Just yesterday! I was buying a pair of shoes for $40, and shipping was $12. That's almost 30% of the cost. I ended up not buying them.",
        },
        {
            "session_id": session_id,
            "turn_index": 2,
            "question_text": "What would make you complete the purchase despite shipping fees?",
            "answer_transcript": "If there was free shipping above a certain amount, like $50, I'd probably add another item. Or if they had a loyalty program where I could earn free shipping.",
        }
    ]
    
    for turn in qa_turns:
        supabase.table("qa_turns").insert(turn).execute()
    
    print(f"✅ Seeded {len(qa_turns)} Q&A turns")

def test_summary_generation():
    print("1. Seeding Session and Q&A Turns...")
    try:
        session_id = seed_session()
        seed_qa_turns(session_id)
    except Exception as e:
        print(f"❌ Failed to seed: {e}")
        return

    print(f"\n2. Testing Summary Agent with Session ID: {session_id}")
    
    payload = {"sessionId": session_id}
    
    try:
        response = requests.post(API_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        
        print("\n✅ Summary Generated Successfully!")
        print("\n" + "="*60)
        print("SESSION SUMMARY")
        print("="*60)
        print(f"\nSession ID: {data['session_id']}")
        print(f"\nSentiment: {data['sentiment']}")
        
        print(f"\nKey Insights ({len(data['key_insights'])}):")
        for i, insight in enumerate(data['key_insights'], 1):
            print(f"  {i}. {insight}")
        
        print(f"\nThemes ({len(data['themes'])}):")
        for theme in data['themes']:
            print(f"  - {theme}")
        
        print(f"\nNotable Quotes ({len(data['notable_quotes'])}):")
        for quote in data['notable_quotes']:
            print(f'  "{quote}"')

        print(f"\nPositive Feedback ({len(data['positive_feedback'])}):")
        for item in data['positive_feedback']:
            print(f"  + {item}")

        print(f"\nNegative Feedback ({len(data['negative_feedback'])}):")
        for item in data['negative_feedback']:
            print(f"  - {item}")

        print(f"\nSummary:")
        print(f"  {data['summary_text']}")
        print("\n" + "="*60)
        
        # Validation
        assert 'session_id' in data, "Missing session_id"
        assert 'key_insights' in data, "Missing key_insights"
        assert 'sentiment' in data, "Missing sentiment"
        assert 'themes' in data, "Missing themes"
        assert 'notable_quotes' in data, "Missing notable_quotes"
        assert 'positive_feedback' in data, "Missing positive_feedback"
        assert 'negative_feedback' in data, "Missing negative_feedback"
        assert 'summary_text' in data, "Missing summary_text"

        print("\n✅ ALL VALIDATIONS PASSED!")

    except requests.exceptions.ConnectionError:
        print(f"\n❌ Connection Error: Is the API running?")
        print("   Start it with: python main.py")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        if 'response' in locals():
            print(f"Response: {response.text}")

if __name__ == "__main__":
    test_summary_generation()
