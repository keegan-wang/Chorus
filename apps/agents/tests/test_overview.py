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

API_URL = "http://localhost:8000/api/agents/overview"
SUMMARY_API_URL = "http://localhost:8000/api/agents/summary"

def seed_multiple_sessions_with_summaries(num_sessions=3):
    """Create multiple sessions with Q&A turns and generate summaries"""
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

    session_ids = []
    study_id = None

    # Sample conversations with different sentiments
    conversations = [
        [
            ("What do you like about our product?", "I love the user interface! It's so intuitive and easy to navigate. The design is clean and modern."),
            ("What could be improved?", "The loading times are a bit slow sometimes, especially during peak hours."),
            ("Would you recommend it to others?", "Absolutely! Despite the minor speed issues, it's the best tool I've used for this purpose."),
        ],
        [
            ("What frustrates you most?", "The customer support is terrible. I've been waiting 3 days for a response to my ticket."),
            ("What about the features?", "The features are okay, but nothing special. Some competitors have better options."),
            ("Any positive aspects?", "The pricing is fair compared to alternatives."),
        ],
        [
            ("How is your experience overall?", "It's been pretty good. The integration with other tools works seamlessly."),
            ("What stands out to you?", "The automation features save me hours every week. It's really powerful."),
            ("Any downsides?", "The mobile app needs work. It's missing some key features from the desktop version."),
        ]
    ]

    # Create the first session to get a study_id
    print(f"\n1. Creating session 1...")
    first_session_id = seed_session()
    session_ids.append(first_session_id)

    # Get the study_id from the first session
    session_data = supabase.table("interview_sessions").select("study_id, assignment_id, participant_id, avatar_id").eq("id", first_session_id).single().execute()
    study_id = session_data.data['study_id']
    assignment_id = session_data.data['assignment_id']

    # Add Q&A turns for first session
    for turn_index, (question, answer) in enumerate(conversations[0]):
        qa_turn = {
            "session_id": first_session_id,
            "turn_index": turn_index,
            "question_text": question,
            "answer_transcript": answer,
        }
        supabase.table("qa_turns").insert(qa_turn).execute()
    print(f"   ✅ Added {len(conversations[0])} Q&A turns")

    # Create remaining sessions for the SAME study
    for i in range(1, num_sessions):
        print(f"\n{i+1}. Creating session {i+1}...")

        # Get participant and avatar for new session
        from datetime import datetime
        participant_res = supabase.table("participants").select("id").limit(1).offset(i).execute()
        avatar_res = supabase.table("avatars").select("id").limit(1).execute()

        if not participant_res.data or not avatar_res.data:
            print(f"   ⚠️  Skipping session {i+1} - no participant or avatar available")
            continue

        participant_id = participant_res.data[0]['id']
        avatar_id = avatar_res.data[0]['id']

        # Create new assignment for same study
        new_assignment = supabase.table("study_participant_assignments").insert({
            "study_id": study_id,
            "participant_id": participant_id,
            "avatar_id": avatar_id,
            "invite_status": "started"
        }).execute()
        new_assignment_id = new_assignment.data[0]['id']

        # Create session for same study
        session_res = supabase.table("interview_sessions").insert({
            "assignment_id": new_assignment_id,
            "study_id": study_id,
            "participant_id": participant_id,
            "avatar_id": avatar_id,
            "status": "in_progress",
            "started_at": datetime.now().isoformat()
        }).execute()

        session_id = session_res.data[0]['id']
        session_ids.append(session_id)

        # Add Q&A turns
        for turn_index, (question, answer) in enumerate(conversations[i]):
            qa_turn = {
                "session_id": session_id,
                "turn_index": turn_index,
                "question_text": question,
                "answer_transcript": answer,
            }
            supabase.table("qa_turns").insert(qa_turn).execute()

        print(f"   ✅ Added {len(conversations[i])} Q&A turns")

    print(f"\n✅ Created {len(session_ids)} sessions for study {study_id}")
    return study_id, session_ids


def test_overview_generation():
    print("="*60)
    print("MARKET RESEARCH OVERVIEW AGENT TEST")
    print("="*60)

    print("\n1. Setting up test data (sessions + summaries)...")
    try:
        study_id, session_ids = seed_multiple_sessions_with_summaries(num_sessions=3)
    except Exception as e:
        print(f"❌ Failed to setup test data: {e}")
        return

    print(f"\n2. Testing Overview Agent with Study ID: {study_id}")

    payload = {"studyId": study_id}

    try:
        response = requests.post(API_URL, json=payload)
        response.raise_for_status()
        data = response.json()

        print("\n✅ Market Research Report Generated Successfully!")
        print("\n" + "="*60)
        print("MARKET RESEARCH REPORT")
        print("="*60)

        print(f"\nStudy ID: {data['study_id']}")

        print(f"\n📊 SENTIMENT DISTRIBUTION:")
        sentiment = data['sentiment_distribution']
        print(f"   Positive: {sentiment['positive']}")
        print(f"   Neutral:  {sentiment['neutral']}")
        print(f"   Negative: {sentiment['negative']}")
        print(f"   Mixed:    {sentiment['mixed']}")

        print(f"\n📈 EXECUTIVE SUMMARY:")
        print(f"   {data['executive_summary']}")

        print(f"\n🔍 KEY FINDINGS ({len(data['key_findings'])}):")
        for i, finding in enumerate(data['key_findings'], 1):
            print(f"   {i}. {finding}")

        print(f"\n🎯 THEMES ({len(data['themes'])}):")
        for theme in data['themes']:
            print(f"   - {theme['name']} (frequency: {theme.get('frequency', 'N/A')})")
            if 'description' in theme:
                print(f"     {theme['description']}")

        print(f"\n✅ POSITIVE HIGHLIGHTS ({len(data['positive_highlights'])}):")
        for item in data['positive_highlights']:
            print(f"   + {item}")

        print(f"\n❌ NEGATIVE PAIN POINTS ({len(data['negative_pain_points'])}):")
        for item in data['negative_pain_points']:
            print(f"   - {item}")

        print(f"\n💡 RECOMMENDATIONS ({len(data['recommendations'])}):")
        for i, rec in enumerate(data['recommendations'], 1):
            print(f"   {i}. {rec}")

        print(f"\n💬 REPRESENTATIVE QUOTES ({len(data['participant_quotes'])}):")
        for quote_obj in data['participant_quotes']:
            print(f'   "{quote_obj["quote"]}"')
            if 'context' in quote_obj:
                print(f'   Context: {quote_obj["context"]}')

        print(f"\n📊 METADATA:")
        metadata = data['metadata']
        print(f"   Total Interviews: {metadata['total_interviews']}")
        print(f"   Total Insights: {metadata['total_insights']}")
        print(f"   Unique Themes: {metadata['unique_themes']}")
        print(f"   Total Positive Feedback: {metadata['total_positive_feedback']}")
        print(f"   Total Negative Feedback: {metadata['total_negative_feedback']}")

        print("\n" + "="*60)

        # Validation
        assert 'study_id' in data, "Missing study_id"
        assert 'executive_summary' in data, "Missing executive_summary"
        assert 'key_findings' in data, "Missing key_findings"
        assert 'themes' in data, "Missing themes"
        assert 'sentiment_distribution' in data, "Missing sentiment_distribution"
        assert 'recommendations' in data, "Missing recommendations"
        assert 'participant_quotes' in data, "Missing participant_quotes"
        assert 'positive_highlights' in data, "Missing positive_highlights"
        assert 'negative_pain_points' in data, "Missing negative_pain_points"
        assert 'metadata' in data, "Missing metadata"

        print("\n✅ ALL VALIDATIONS PASSED!")

    except requests.exceptions.ConnectionError:
        print(f"\n❌ Connection Error: Is the API running?")
        print("   Start it with: python main.py")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        if 'response' in locals():
            print(f"Response: {response.text}")

if __name__ == "__main__":
    test_overview_generation()
