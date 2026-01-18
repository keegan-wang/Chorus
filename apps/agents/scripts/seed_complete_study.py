"""
Seed a complete study with multiple interviews for testing analysis features.
This creates:
- Organization and user
- Study with research questions
- Multiple participants
- Interview sessions with realistic Q&A turns
- Session summaries
"""

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

# Sample interview data for a Hydroflask water bottle study
INTERVIEW_TEMPLATES = [
    {
        "participant": {"name": "Sarah Chen", "age": 28, "gender": "female", "city": "San Francisco"},
        "qa_turns": [
            {
                "question": "What factors influenced your decision to purchase a Hydroflask water bottle?",
                "answer": "I was looking for something eco-friendly and durable. I was tired of buying plastic bottles and wanted something that would last. The insulation was a big factor too - I wanted my water to stay cold during my hikes."
            },
            {
                "question": "How often do you use your Hydroflask, and in what situations?",
                "answer": "Every single day! I take it to work, to the gym, on hikes, everywhere. It's basically attached to me. I fill it up in the morning and it keeps my water cold all day long."
            },
            {
                "question": "What do you like most about your Hydroflask?",
                "answer": "The insulation is incredible. Ice water stays ice cold for like 24 hours. And it's so durable - I've dropped it so many times and it barely has a dent. Plus it looks good, I got the mint color."
            },
            {
                "question": "Is there anything you dislike or would change about it?",
                "answer": "It's pretty heavy when it's full, especially the 40oz one I have. And the mouth is kind of narrow so it's hard to clean inside. I have to use a special brush. Also it doesn't fit in my car cup holder."
            }
        ],
        "sentiment": "positive",
        "key_insights": [
            "Values sustainability and durability over convenience",
            "Uses product daily across multiple contexts",
            "Insulation performance exceeds expectations",
            "Weight and cleaning difficulty are minor pain points"
        ]
    },
    {
        "participant": {"name": "Marcus Johnson", "age": 35, "gender": "male", "city": "Austin"},
        "qa_turns": [
            {
                "question": "What factors influenced your decision to purchase a Hydroflask water bottle?",
                "answer": "Honestly, everyone at my CrossFit gym had one, so I figured I should get one too. Plus I wanted something that wouldn't sweat all over my gym bag."
            },
            {
                "question": "How has the Hydroflask performed compared to your expectations?",
                "answer": "It's solid. Keeps things cold like they say. No condensation which is great. But I gotta say, for the price, I expected it to be perfect. The paint started chipping after a few months."
            },
            {
                "question": "What situations do you use it in most?",
                "answer": "Mainly at the gym and at work. I work construction so I need something tough that can handle being tossed around in my truck. It's held up pretty well for that."
            },
            {
                "question": "Would you recommend it to others?",
                "answer": "Yeah, probably. It does what it's supposed to do. But I'd tell them there are cheaper options that work almost as well. The brand name definitely adds to the cost."
            }
        ],
        "sentiment": "neutral",
        "key_insights": [
            "Social proof was a major purchase driver",
            "Performance meets expectations but doesn't exceed them",
            "Durability is important for work environment",
            "Questions the value proposition given the price point"
        ]
    },
    {
        "participant": {"name": "Emily Rodriguez", "age": 24, "gender": "female", "city": "Seattle"},
        "qa_turns": [
            {
                "question": "What factors influenced your decision to purchase a Hydroflask water bottle?",
                "answer": "I saw it all over Instagram and TikTok. Everyone was decorating theirs with stickers and it looked really cute. Plus I'm trying to drink more water and I thought having a nice bottle would motivate me."
            },
            {
                "question": "Has it helped you drink more water?",
                "answer": "Oh my god, yes! I went from maybe 2 glasses a day to finishing this 32oz bottle twice a day. Having it with me all the time and it being cute really does help. I decorated mine with stickers from my favorite bands."
            },
            {
                "question": "What do you love most about it?",
                "answer": "How cold it keeps my water! I put ice in the morning and it's still there at night. And I love that I can personalize it. It's like an accessory now. I have three different colors for different moods."
            },
            {
                "question": "Any downsides?",
                "answer": "It's kind of expensive, especially if you want multiple colors like me. And the stickers I put on it are starting to peel off. Also I wish they had more fun colors - I want a lavender one but they only have boring colors."
            }
        ],
        "sentiment": "positive",
        "key_insights": [
            "Social media and aesthetics drove purchase decision",
            "Product successfully changed behavior (increased water intake)",
            "Personalization and self-expression are key value drivers",
            "Willing to buy multiple units for variety"
        ]
    },
    {
        "participant": {"name": "David Park", "age": 42, "gender": "male", "city": "Denver"},
        "qa_turns": [
            {
                "question": "What factors influenced your decision to purchase a Hydroflask water bottle?",
                "answer": "I needed something for my camping trips. I researched a lot of options and Hydroflask had good reviews for keeping things cold or hot for a long time. The lifetime warranty was also a selling point."
            },
            {
                "question": "How do you primarily use your Hydroflask?",
                "answer": "Camping, hiking, road trips. I use it for both water and coffee. The fact that it can do both hot and cold is really useful. I've taken it on week-long camping trips and it's been great."
            },
            {
                "question": "What's been your experience with the temperature retention?",
                "answer": "Excellent. I've had ice last for over 24 hours in summer heat. And my morning coffee stays hot for hours. It's exactly what I needed for outdoor activities."
            },
            {
                "question": "Any complaints or issues?",
                "answer": "The lid can be annoying. The flip cap one leaks sometimes if you don't close it perfectly. And I wish it was lighter - when you're backpacking, every ounce matters. But overall it's a quality product."
            }
        ],
        "sentiment": "positive",
        "key_insights": [
            "Research-driven purchase decision focused on performance",
            "Values versatility (hot and cold)",
            "Uses product in demanding outdoor conditions",
            "Weight is a concern for specific use cases"
        ]
    },
    {
        "participant": {"name": "Jessica Martinez", "age": 31, "gender": "female", "city": "Portland"},
        "qa_turns": [
            {
                "question": "What factors influenced your decision to purchase a Hydroflask water bottle?",
                "answer": "I wanted to reduce my plastic waste. I was buying bottled water constantly and felt guilty about it. Hydroflask seemed like a sustainable option that would last."
            },
            {
                "question": "How has it impacted your daily routine?",
                "answer": "Huge impact. I stopped buying plastic bottles completely. I fill it up at home and at work. It's saved me money too - I was spending like $30 a month on bottled water."
            },
            {
                "question": "What do you appreciate most about the product?",
                "answer": "That it's durable and will last for years. I like knowing I'm not contributing to plastic waste. And it keeps my water cold which is nice. The wide mouth makes it easy to add ice cubes."
            },
            {
                "question": "What could be improved?",
                "answer": "I wish it was easier to clean. The wide mouth helps but you still need a brush to get to the bottom. And I'd love to see them use recycled materials in manufacturing. That would make it even more sustainable."
            }
        ],
        "sentiment": "positive",
        "key_insights": [
            "Environmental sustainability is primary purchase driver",
            "Product successfully replaced single-use plastic habit",
            "Cost savings is a secondary benefit",
            "Interested in even more sustainable manufacturing"
        ]
    },
    {
        "participant": {"name": "Alex Thompson", "age": 26, "gender": "non-binary", "city": "Brooklyn"},
        "qa_turns": [
            {
                "question": "What factors influenced your decision to purchase a Hydroflask water bottle?",
                "answer": "My old water bottle broke and I needed a replacement. I'd heard good things about Hydroflask so I figured I'd try it. Plus they had a cool color I liked."
            },
            {
                "question": "How does it compare to your previous water bottle?",
                "answer": "It's better in some ways. The insulation is definitely superior. But it's also heavier and bulkier. My old one was lighter and fit in my bag better."
            },
            {
                "question": "What's your typical usage pattern?",
                "answer": "I bring it to work most days. Sometimes I forget it at home though because it's kind of bulky. When I do bring it, I appreciate having cold water all day."
            },
            {
                "question": "Would you buy another one?",
                "answer": "Maybe? It's good but I'm not sure it's worth the hype. There are cheaper alternatives that probably work just as well. I might try a different brand next time to compare."
            }
        ],
        "sentiment": "neutral",
        "key_insights": [
            "Purchase was somewhat impulsive/convenience-driven",
            "Recognizes quality but questions value proposition",
            "Portability is a barrier to consistent use",
            "Open to trying competitor products"
        ]
    },
    {
        "participant": {"name": "Rachel Kim", "age": 29, "gender": "female", "city": "Los Angeles"},
        "qa_turns": [
            {
                "question": "What factors influenced your decision to purchase a Hydroflask water bottle?",
                "answer": "I'm really into fitness and wellness. I wanted a high-quality water bottle that would motivate me to stay hydrated. Hydroflask has a great reputation in the fitness community."
            },
            {
                "question": "How has it supported your fitness goals?",
                "answer": "It's been amazing! I track my water intake and having a 40oz bottle means I know exactly how much I'm drinking. I aim for two full bottles a day. The cold water is so refreshing after workouts."
            },
            {
                "question": "What features do you value most?",
                "answer": "The size options are great - I have a 40oz for all day and a 20oz for quick gym sessions. The insulation is perfect. And I love that it doesn't retain flavors - I can switch from water to protein shakes."
            },
            {
                "question": "Any drawbacks?",
                "answer": "The 40oz is really heavy when full, so I can't take it on runs. And I wish they had a built-in tracker or smart features. Like an app that reminds you to drink. That would be next level."
            }
        ],
        "sentiment": "positive",
        "key_insights": [
            "Product is integrated into health and wellness routine",
            "Size variety enables different use cases",
            "Uses product as a tool for behavior tracking",
            "Interested in smart/connected product features"
        ]
    },
    {
        "participant": {"name": "Tom Anderson", "age": 38, "gender": "male", "city": "Chicago"},
        "qa_turns": [
            {
                "question": "What factors influenced your decision to purchase a Hydroflask water bottle?",
                "answer": "My wife bought one and loved it, so she got me one for my birthday. I wasn't really in the market for a water bottle but I've been using it."
            },
            {
                "question": "How has your experience been?",
                "answer": "It's fine. Does what it's supposed to do. Keeps things cold. I use it at work sometimes. Not sure I would have bought it myself though - seems expensive for what it is."
            },
            {
                "question": "Do you use it regularly?",
                "answer": "A few times a week maybe. I usually just drink from the water fountain at work or grab a bottle from the fridge. The Hydroflask is nice but it's not life-changing or anything."
            },
            {
                "question": "What would make you use it more often?",
                "answer": "I don't know, maybe if it was smaller? It's kind of a pain to carry around. And I forget to wash it so sometimes it just sits in my car. If it was easier to clean I might use it more."
            }
        ],
        "sentiment": "neutral",
        "key_insights": [
            "Low engagement - product was a gift, not actively sought",
            "Doesn't see significant value over alternatives",
            "Convenience barriers prevent regular use",
            "Cleaning difficulty impacts usage frequency"
        ]
    }
]

def seed_complete_study():
    print("=" * 80)
    print("SEEDING COMPLETE STUDY WITH MULTIPLE INTERVIEWS")
    print("=" * 80)

    # 1. Get or Create Organization
    print("\n[1/8] Setting up organization...")
    org_res = supabase.table("organizations").select("id").eq("slug", "chorus-test-org").execute()
    if not org_res.data:
        print("Creating organization...")
        org_res = supabase.table("organizations").insert({
            "name": "Chorus Test Org",
            "slug": "chorus-test-org",
            "billing_email": "admin@chorus-test.com",
            "plan": "pro"
        }).execute()
    org_id = org_res.data[0]['id']
    print(f"✅ Organization ID: {org_id}")

    # 2. Get or Create Test User
    print("\n[2/8] Setting up test user...")
    test_user_id = "fe572319-1ee3-40a2-840d-ad736cc18502"  # Use the existing user from your system
    try:
        user_check = supabase.table("users").select("id").eq("id", test_user_id).execute()
        if not user_check.data:
            supabase.table("users").insert({
                "id": test_user_id,
                "organization_id": org_id,
                "email": "test@chorus.ai",
                "full_name": "Test User",
                "role": "admin"
            }).execute()
            print(f"✅ Created test user: {test_user_id}")
        else:
            print(f"✅ Using existing user: {test_user_id}")
    except Exception as e:
        print(f"User setup: {e}")

    # 3. Create Study
    print("\n[3/8] Creating study...")
    study_data = {
        "organization_id": org_id,
        "created_by": test_user_id,
        "title": "Hydroflask Water Bottle User Research",
        "description": "Understanding customer satisfaction, usage patterns, and pain points with Hydroflask water bottles",
        "status": "active",
        "target_participant_count": 10,
        "research_intent": {
            "goal": "Understand why customers buy Hydroflask and how they use it",
            "type": "product_research"
        },
        "interview_config": {
            "max_follow_ups": 3,
            "max_questions": 5,
            "allow_skip": True
        },
        "target_demographics": {
            "age": "18-45",
            "gender": "all"
        },
        "guardrail_profile": "balanced"
    }

    study_res = supabase.table("studies").insert(study_data).execute()
    study_id = study_res.data[0]['id']
    print(f"✅ Study created: {study_id}")
    print(f"   Title: {study_data['title']}")

    # 4. Create Research Questions
    print("\n[4/8] Creating research questions...")
    research_questions = [
        {
            "organization_id": org_id,
            "root_question": "Why do customers choose Hydroflask over competitors?",
            "specific_product": "Hydroflask Water Bottle",
            "demographics": {"age": "18-45", "gender": "all"},
            "participant_count": 8
        },
        {
            "organization_id": org_id,
            "root_question": "What are the main use cases and usage patterns for Hydroflask?",
            "specific_product": "Hydroflask Water Bottle",
            "demographics": {"age": "18-45", "gender": "all"},
            "participant_count": 8
        }
    ]

    rq_ids = []
    for rq in research_questions:
        rq_res = supabase.table("research_questions").insert(rq).execute()
        rq_ids.append(rq_res.data[0]['id'])
        print(f"✅ Research question: {rq['root_question'][:60]}...")

    # 5. Get Avatar
    print("\n[5/8] Getting avatar...")
    avatar_res = supabase.table("avatars").select("id, name").limit(1).execute()
    if not avatar_res.data:
        print("❌ No avatars found. Please run seed avatars first.")
        return
    avatar_id = avatar_res.data[0]['id']
    print(f"✅ Using avatar: {avatar_res.data[0]['name']}")

    # 6. Create Participants and Sessions
    print(f"\n[6/8] Creating {len(INTERVIEW_TEMPLATES)} participants and interviews...")

    for idx, template in enumerate(INTERVIEW_TEMPLATES, 1):
        print(f"\n  Interview {idx}/{len(INTERVIEW_TEMPLATES)}: {template['participant']['name']}")

        # Create participant
        name_parts = template['participant']['name'].split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        # Add timestamp to email to avoid duplicates
        email_base = template['participant']['name'].lower().replace(' ', '.')
        unique_email = f"{email_base}.{int(datetime.now().timestamp())}@example.com"

        participant_data = {
            "organization_id": org_id,
            "first_name": first_name,
            "last_name": last_name,
            "email": unique_email,
            "age": template['participant']['age'],
            "gender": template['participant']['gender'],
            "city": template['participant']['city'],
            "country": "USA",
            "tags": ["hydroflask_user", "active"],
            "metadata": {"source": "seed_script"}
        }

        p_res = supabase.table("participants").insert(participant_data).execute()
        participant_id = p_res.data[0]['id']
        print(f"    ✓ Participant created")

        # Create assignment
        assignment_data = {
            "study_id": study_id,
            "participant_id": participant_id,
            "avatar_id": avatar_id,
            "invite_status": "completed",
            "invite_sent_at": (datetime.now() - timedelta(days=random.randint(1, 7))).isoformat(),
            "completed_at": datetime.now().isoformat()
        }

        assign_res = supabase.table("study_participant_assignments").insert(assignment_data).execute()
        assignment_id = assign_res.data[0]['id']

        # Link participant to research questions
        for rq_id in rq_ids:
            supabase.table("research_question_assignments").insert({
                "research_question_id": rq_id,
                "participant_id": participant_id,
                "status": "completed"
            }).execute()

        # Create session
        session_start = datetime.now() - timedelta(days=random.randint(1, 7), hours=random.randint(0, 23))
        session_duration = random.randint(300, 900)  # 5-15 minutes

        session_data = {
            "assignment_id": assignment_id,
            "study_id": study_id,
            "participant_id": participant_id,
            "avatar_id": avatar_id,
            "status": "completed",
            "started_at": session_start.isoformat(),
            "ended_at": (session_start + timedelta(seconds=session_duration)).isoformat(),
            "duration_seconds": session_duration
        }

        session_res = supabase.table("interview_sessions").insert(session_data).execute()
        session_id = session_res.data[0]['id']
        print(f"    ✓ Session created")

        # Create Q&A turns
        for turn_idx, qa in enumerate(template['qa_turns']):
            qa_turn_data = {
                "session_id": session_id,
                "turn_index": turn_idx,
                "question_text": qa['question'],
                "answer_transcript": qa['answer'],
                "answer_word_count": len(qa['answer'].split())
            }

            turn_res = supabase.table("qa_turns").insert(qa_turn_data).execute()
            turn_id = turn_res.data[0]['id']

            # Add quality scores
            overall_score = random.uniform(70, 95) if template['sentiment'] == 'positive' else random.uniform(50, 75)
            quality_data = {
                "qa_turn_id": turn_id,
                "label": "good" if overall_score > 70 else "neutral",
                "scores": {
                    "overall": overall_score,
                    "relevance": random.uniform(70, 95),
                    "depth": random.uniform(65, 90),
                    "clarity": random.uniform(75, 95),
                    "actionability": random.uniform(60, 85)
                },
                "reasoning": "Detailed response with specific examples"
            }

            supabase.table("qa_quality_labels").insert(quality_data).execute()

        print(f"    ✓ {len(template['qa_turns'])} Q&A turns created")

        # Create session summary
        positive_feedback = [qa['answer'][:100] for qa in template['qa_turns'] if 'love' in qa['answer'].lower() or 'great' in qa['answer'].lower()][:2]
        negative_feedback = [qa['answer'][:100] for qa in template['qa_turns'] if 'dislike' in qa['answer'].lower() or 'wish' in qa['answer'].lower()][:2]

        summary_data = {
            "session_id": session_id,
            "summary_text": f"Interview with {template['participant']['name']} revealed {template['sentiment']} sentiment towards Hydroflask. Key themes included product quality, daily usage patterns, and value considerations. Key insights: {'; '.join(template['key_insights'][:2])}",
            "key_themes": ["product_quality", "usability", "value_proposition"],
            "sentiment_overview": {
                "sentiment": template['sentiment'],
                "key_insights": template['key_insights'],
                "positive_feedback": positive_feedback,
                "negative_feedback": negative_feedback
            },
            "quotes": [{"quote": template['qa_turns'][2]['answer'][:200], "context": "Product feedback"}]
        }

        supabase.table("interview_summaries").insert(summary_data).execute()
        print(f"    ✓ Summary created")

    # 7. Summary
    print("\n" + "=" * 80)
    print("✅ SEEDING COMPLETE!")
    print("=" * 80)
    print(f"\nStudy ID: {study_id}")
    print(f"Organization ID: {org_id}")
    print(f"User ID: {test_user_id}")
    print(f"\nCreated:")
    print(f"  - 1 Study: 'Hydroflask Water Bottle User Research'")
    print(f"  - {len(rq_ids)} Research Questions")
    print(f"  - {len(INTERVIEW_TEMPLATES)} Participants")
    print(f"  - {len(INTERVIEW_TEMPLATES)} Completed Interview Sessions")
    print(f"  - {sum(len(t['qa_turns']) for t in INTERVIEW_TEMPLATES)} Q&A Turns")
    print(f"  - {len(INTERVIEW_TEMPLATES)} Session Summaries")
    print(f"\n🎯 Next Steps:")
    print(f"  1. Log in as: test@chorus.ai")
    print(f"  2. Navigate to Studies")
    print(f"  3. Click on 'Hydroflask Water Bottle User Research'")
    print(f"  4. Click '📊 Analyze Study' to generate insights!")
    print("=" * 80)

if __name__ == "__main__":
    seed_complete_study()
