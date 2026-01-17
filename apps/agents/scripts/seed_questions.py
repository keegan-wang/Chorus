import os
import json
from dotenv import load_dotenv
from pathlib import Path
from supabase import create_client, Client

# Load environment variables
script_dir = Path(__file__).resolve().parent
project_root = script_dir.parents[2]
env_path = project_root / ".env.local"

if env_path.exists():
    print(f"Loading env from: {env_path}")
    load_dotenv(env_path)
else:
    load_dotenv(project_root / ".env")

# Supabase Setup
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
if not url:
    url = os.environ.get("SUPABASE_URL")
    
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(url, key)

def get_organization_id() -> str:
    """Fetch the first organization ID."""
    response = supabase.table("organizations").select("id").limit(1).execute()
    if not response.data:
        raise ValueError("No organizations found. Run seed_organization.py first.")
    return response.data[0]["id"]

def seed_questions():
    print("Seeding Research Questions...")
    try:
        org_id = get_organization_id()
        
        questions = [
            {
                "organization_id": org_id,
                "root_question": "What are the primary factors influencing your decision to purchase organic food?",
                "specific_product": "Organic Produce Delivery Service",
                "demographics": {"age_range": "25-45", "location": "Urban"},
                "selected_dataset": "General Consumer Survey 2024",
                "other_info": "Focus on price sensitivity vs health benefits.",
                "other_questions": ["Do you prioritize local sourcing?", "How often do you cook at home?"]
            },
            {
                "organization_id": org_id,
                "root_question": "How do you manage your daily productivity and task tracking?",
                "specific_product": "Productivity SaaS App",
                "demographics": {"occupation": "Knowledge Worker", "tech_literacy": "High"},
                "selected_dataset": "Remote Work Trends",
                "other_info": "Looking for pain points in existing tools like Notion or Jira.",
                "other_questions": ["What is your biggest frustration with current tools?", "Do you use mobile or desktop more?"]
            },
            {
                "organization_id": org_id,
                "root_question": "What motivates you to exercise regularly?",
                "specific_product": "Fitness Wearable",
                "demographics": {"interest": "Fitness", "age_range": "18-60"},
                "selected_dataset": "Health & Wellness Report",
                "other_info": "Explore intrinsic vs extrinsic motivation.",
                "other_questions": ["Do you track your workouts?", "Do you prefer group classes or solo training?"]
            },
            {
                "organization_id": org_id,
                "root_question": "How do you discover new music?",
                "specific_product": "Music Streaming Service",
                "demographics": {"age_range": "16-35"},
                "selected_dataset": "Media Consumption Data",
                "other_info": "Focus on algorithm recommendations vs friend suggestions.",
                "other_questions": ["Do you use playlists or albums?", "How important is audio quality?"]
            },
            {
                "organization_id": org_id,
                "root_question": "What are your main concerns when booking travel accommodations?",
                "specific_product": "Travel Booking Platform",
                "demographics": {"segments": ["Business Travelers", "Families"]},
                "selected_dataset": "Travel Industry Insights",
                "other_info": "Investigate trust, price, and amenities.",
                "other_questions": ["Do you read reviews?", "Do you prefer hotels or rentals?"]
            }
        ]
        
        # Insert
        response = supabase.table("research_questions").insert(questions).execute()
        print(f"Successfully inserted {len(response.data)} research questions.")
        
    except Exception as e:
        print(f"Error seeding questions: {e}")

if __name__ == "__main__":
    seed_questions()
