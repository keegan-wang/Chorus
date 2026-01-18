import os
import uuid
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

# Sample company users to seed
SAMPLE_USERS = [
    {"full_name": "Sarah Chen", "email": "sarah.chen@acme.com", "role": "owner"},
    {"full_name": "Michael Rodriguez", "email": "michael.r@acme.com", "role": "admin"},
    {"full_name": "Emily Watson", "email": "emily.watson@techcorp.io", "role": "owner"},
    {"full_name": "James Park", "email": "james.park@techcorp.io", "role": "member"},
    {"full_name": "Lisa Thompson", "email": "lisa.t@innovate.co", "role": "owner"},
    {"full_name": "David Kim", "email": "david.kim@innovate.co", "role": "admin"},
    {"full_name": "Amanda Foster", "email": "amanda.f@startup.xyz", "role": "owner"},
    {"full_name": "Ryan Mitchell", "email": "ryan.m@startup.xyz", "role": "member"},
]

def get_or_create_organization(name: str, slug: str, billing_email: str):
    """Get existing organization or create a new one"""
    response = supabase.table("organizations").select("*").eq("slug", slug).execute()

    if response.data:
        print(f"  Organization '{name}' already exists.")
        return response.data[0]

    new_org = {
        "name": name,
        "slug": slug,
        "billing_email": billing_email,
        "plan": "pro",
        "settings": {"theme": "light"}
    }

    response = supabase.table("organizations").insert(new_org).execute()
    if response.data:
        print(f"  Created organization: {name}")
        return response.data[0]
    return None

def seed_users():
    print("Seeding Company Users...")

    # Create organizations for our sample users
    orgs = {
        "acme.com": get_or_create_organization("Acme Corporation", "acme-corp", "billing@acme.com"),
        "techcorp.io": get_or_create_organization("TechCorp Industries", "techcorp", "billing@techcorp.io"),
        "innovate.co": get_or_create_organization("Innovate Labs", "innovate-labs", "billing@innovate.co"),
        "startup.xyz": get_or_create_organization("Startup XYZ", "startup-xyz", "billing@startup.xyz"),
    }

    # Seed users
    for user_data in SAMPLE_USERS:
        email = user_data["email"]
        domain = email.split("@")[1]
        org = orgs.get(domain)

        if not org:
            print(f"  Skipping {email} - no organization found for domain {domain}")
            continue

        # Check if user already exists
        existing = supabase.table("users").select("*").eq("email", email).execute()
        if existing.data:
            print(f"  User '{email}' already exists. Skipping.")
            continue

        # Create the user with a generated UUID
        new_user = {
            "id": str(uuid.uuid4()),
            "organization_id": org["id"],
            "email": email,
            "full_name": user_data["full_name"],
            "role": user_data["role"],
        }

        try:
            response = supabase.table("users").insert(new_user).execute()
            if response.data:
                print(f"  Created user: {user_data['full_name']} ({email})")
            else:
                print(f"  Failed to create user: {email}")
        except Exception as e:
            print(f"  Error creating user {email}: {e}")

    print("\nDone seeding users!")

    # Print summary
    users_response = supabase.table("users").select("id, full_name, email, organization_id").execute()
    print(f"\nTotal users in database: {len(users_response.data or [])}")
    for user in (users_response.data or []):
        print(f"  - {user['full_name']} ({user['email']})")

if __name__ == "__main__":
    seed_users()
