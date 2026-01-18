import os
import uuid
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pathlib import Path
from supabase import create_client, Client

# Setup Environment
script_dir = Path(__file__).resolve().parent
project_root = script_dir.parents[2]
env_path = project_root / ".env.local"

if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv(project_root / ".env")

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    raise ValueError("Missing Supabase credentials")

supabase: Client = create_client(url, key)

def seed_session():
    print("Seeding Session...")
    
    # 1. Get Organization
    org_res = supabase.table("organizations").select("id").eq("slug", "chorus-test-org").execute()
    if not org_res.data:
        print("Creating Organization...")
        org_res = supabase.table("organizations").insert({
            "name": "Chorus Test Org",
            "slug": "chorus-test-org"
        }).execute()
    org_id = org_res.data[0]['id']
    
    # 2. Get/Create User (Fake)
    user_id = str(uuid.uuid4())
    # Try to find existing user or insert
    # Simplification: just insert a new fake user for this run or check if we have one
    # efficient way: just use a static UUID for "Test User"
    test_user_id = "00000000-0000-0000-0000-000000000001"
    try:
        supabase.table("users").insert({
            "id": test_user_id,
            "organization_id": org_id,
            "email": "test@chorus.ai",
            "full_name": "Test User",
            "role": "admin"
        }).execute()
    except:
        pass # Already exists

    # 3. Create Study
    study_res = supabase.table("studies").insert({
        "organization_id": org_id,
        "created_by": test_user_id,
        "title": f"Quality Test Study {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "research_intent": {"goal": "Test Quality Scoring"},
        "interview_config": {"duration": 30},
        "status": "active"
    }).execute()
    study_id = study_res.data[0]['id']
    
    # 4. Get Participant
    p_res = supabase.table("participants").select("id").eq("organization_id", org_id).limit(1).execute()
    if not p_res.data:
        raise ValueError("No participants found. Run seed_participants.py")
    participant_id = p_res.data[0]['id']
    
    # 5. Get Avatar
    a_res = supabase.table("avatars").select("id").limit(1).execute()
    if not a_res.data:
        raise ValueError("No avatars found.")
    avatar_id = a_res.data[0]['id']
    
    # 6. Create Assignment
    assign_res = supabase.table("study_participant_assignments").insert({
        "study_id": study_id,
        "participant_id": participant_id,
        "avatar_id": avatar_id,
        "invite_status": "started"
    }).execute()
    assignment_id = assign_res.data[0]['id']
    
    # 7. Create Session
    session_res = supabase.table("interview_sessions").insert({
        "assignment_id": assignment_id,
        "study_id": study_id,
        "participant_id": participant_id,
        "avatar_id": avatar_id,
        "status": "in_progress",
        "started_at": datetime.now().isoformat()
    }).execute()
    
    session_id = session_res.data[0]['id']
    print(f"✅ Created Session: {session_id}")
    return session_id

if __name__ == "__main__":
    seed_session()
