import os
import random
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

def seed_assignments():
    print("🌱 Seeding Assignments...")

    # 1. Fetch All Participants
    participants = supabase.table("participants").select("id, full_name, organization_id").execute().data
    if not participants:
        print("❌ No participants found. Run seed_participants.py first.")
        return

    # 2. Fetch All Questions grouped by organization
    questions = supabase.table("research_questions").select("id, root_question, organization_id").execute().data
    if not questions:
        print("❌ No questions found. Run seed_questions.py first.")
        return

    # Group questions by organization
    questions_by_org = {}
    for q in questions:
        org_id = q['organization_id']
        if org_id not in questions_by_org:
            questions_by_org[org_id] = []
        questions_by_org[org_id].append(q)

    print(f"Found {len(participants)} participants and {len(questions)} questions across {len(questions_by_org)} organizations.")

    # 3. Clear existing assignments
    print("Clearing existing assignments...")
    supabase.table("research_question_assignments").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

    assignments_created = 0
    
    # 4. Create 2-4 assignments per participant from their organization
    for p in participants:
        org_id = p['organization_id']
        
        # Get questions for this participant's organization
        org_questions = questions_by_org.get(org_id, [])
        
        if not org_questions:
            print(f"⚠️  No questions found for org {org_id}, skipping {p['full_name']}")
            continue
        
        # Assign 2-4 random questions (or all if fewer than 2)
        num_to_assign = min(random.randint(2, 4), len(org_questions))
        selected_qs = random.sample(org_questions, k=num_to_assign)
        
        for q in selected_qs:
            status = random.choice(['pending', 'pending', 'invited', 'in_progress'])  # Weighted toward pending
            
            data = {
                "participant_id": p['id'],
                "research_question_id": q['id'],
                "status": status
            }
            
            try:
                supabase.table("research_question_assignments").insert(data).execute()
                assignments_created += 1
            except Exception as e:
                print(f"Error creating assignment: {e}")

    print(f"✅ Created {assignments_created} assignments ({assignments_created / len(participants):.1f} per participant on average).")

if __name__ == "__main__":
    seed_assignments()
