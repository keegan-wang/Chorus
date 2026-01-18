import os
import random
from faker import Faker
from supabase import create_client, Client
from typing import List, Dict, Any

from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from the project root
# The script is in apps/agents/scripts/seed_participants.py
# The .env.local is in the root of the repo (3 levels up)
script_dir = Path(__file__).resolve().parent
project_root = script_dir.parents[2]
env_path = project_root / ".env.local"

if env_path.exists():
    print(f"Loading env from: {env_path}")
    load_dotenv(env_path)
else:
    print(f"Warning: .env.local not found at {env_path}")
    # Try just .env
    load_dotenv(project_root / ".env")

# Initialize Faker
fake = Faker()

# Supabase Setup
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") # Often renamed in JS projects, checking fallback
if not url:
    url = os.environ.get("SUPABASE_URL")
    
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.")

supabase: Client = create_client(url, key)

def get_first_organization() -> str:
    """Fetch the test organization ID from the database, or create one if none exist."""
    # Try to get the test org first (used by seed_session.py)
    response = supabase.table("organizations").select("id").eq("slug", "chorus-test-org").execute()

    if response.data:
        return response.data[0]["id"]

    # If not found, create it
    print("Test organization not found. Creating 'Chorus Test Org'...")
    new_org = {
        "name": "Chorus Test Org",
        "slug": "chorus-test-org",
    }
    insert_response = supabase.table("organizations").insert(new_org).execute()
    if insert_response.data:
        return insert_response.data[0]["id"]

    raise ValueError("Failed to create test organization.")

def generate_participant(org_id: str) -> Dict[str, Any]:
    """Generate a single fake participant record."""
    
    # Demographics
    age = random.randint(18, 75)
    gender = random.choice(["Male", "Female", "Non-binary", "Prefer not to say"])
    country = fake.country()
    city = fake.city()
    
    # Tags
    possible_tags = [
        "early_adopter", "tech_savvy", "price_sensitive", "brand_loyalist",
        "student", "parent", "retired", "gamer", "health_conscious", "traveler"
    ]
    tags = random.sample(possible_tags, k=random.randint(1, 4))
    
    # Metadata
    metadata = {
        "job_title": fake.job(),
        "education": random.choice(["High School", "Bachelor's", "Master's", "PhD"]),
        "household_income": random.choice(["<25k", "25k-50k", "50k-75k", "75k-100k", "100k+"]),
        "marital_status": random.choice(["Single", "Married", "Divorced", "Widowed"]),
        "hobbies": [fake.word() for _ in range(3)]
    }

    return {
        "organization_id": org_id,
        "email": fake.email(),
        "first_name": fake.first_name(),
        "last_name": fake.last_name(),
        "age": age,
        "gender": gender,
        "country": country,
        "city": city,
        "language": "en",  # Defaulting to EN for now
        "timezone": fake.timezone(),
        "tags": tags,
        "metadata": metadata,
        "status": "active"
    }

def seed_participants(count: int = 100):
    print(f"Starting seed of {count} participants...")
    
    try:
        org_id = get_first_organization()
        print(f"Using Organization ID: {org_id}")
        
        participants = []
        for _ in range(count):
            participants.append(generate_participant(org_id))
            
        # Batch insert (Supabase limit is usually around 1000 records, so 100 is fine)
        response = supabase.table("participants").insert(participants).execute()
        
        print(f"Successfully inserted {len(response.data)} participants.")
        
    except Exception as e:
        print(f"Error seeding participants: {e}")

if __name__ == "__main__":
    seed_participants(100)
