import os
import random
from dotenv import load_dotenv
from pathlib import Path
from supabase import create_client, Client

# Load environment variables from the project root
script_dir = Path(__file__).resolve().parent
project_root = script_dir.parents[2]
env_path = project_root / ".env.local"

if env_path.exists():
    print(f"Loading env from: {env_path}")
    load_dotenv(env_path)
else:
    # Try just .env
    load_dotenv(project_root / ".env")

# Supabase Setup
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
if not url:
    url = os.environ.get("SUPABASE_URL")
    
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.")

supabase: Client = create_client(url, key)

def seed_organization():
    print("Seeding Organization...")
    
    # Check if 'Chorus Test Org' exists
    org_slug = "chorus-test-org"
    response = supabase.table("organizations").select("*").eq("slug", org_slug).execute()
    
    if response.data:
        print(f"Organization '{org_slug}' already exists. Skipping creation.")
        print(f"Org ID: {response.data[0]['id']}")
        return response.data[0]
    
    # Create Organization
    new_org = {
        "name": "Chorus Test Org",
        "slug": org_slug,
        "billing_email": "test-admin@chorus.ai",
        "plan": "pro",  # seeding as a Pro plan
        "settings": {
            "theme": "dark",
            "mfa_enabled": False
        }
    }
    
    try:
        response = supabase.table("organizations").insert(new_org).execute()
        if response.data:
            print(f"Successfully created organization: {response.data[0]['name']}")
            print(f"Org ID: {response.data[0]['id']}")
            return response.data[0]
        else:
            print("Failed to create organization (no data returned).")
            
    except Exception as e:
        print(f"Error creating organization: {e}")

if __name__ == "__main__":
    seed_organization()
