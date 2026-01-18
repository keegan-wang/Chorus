#!/usr/bin/env python3
"""
Create product-based studies and link research questions to them.
"""
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(url, key)

def create_product_studies():
    print("🏗️  Creating product-based studies...")
    
    # Get all research questions grouped by product
    questions = supabase.table('research_questions').select('*').execute().data
    
    # Group by specific_product
    products = {}
    for q in questions:
        product = q['specific_product']
        if product not in products:
            products[product] = []
        products[product].append(q)
    
    print(f"Found {len(products)} unique products:")
    for product in products.keys():
        print(f"  - {product} ({len(products[product])} questions)")
    
    # Create a study for each product
    study_map = {}
    for product, product_questions in products.items():
        org_id = product_questions[0]['organization_id']
        
        # Check if study already exists
        existing = supabase.table('studies').select('id').eq('title', f'{product} Study').execute().data
        
        if existing:
            study_id = existing[0]['id']
            print(f"✓ Study already exists: {product} Study")
        else:
            # Create new study
            study_data = {
                'organization_id': org_id,
                'title': f'{product} Study',
                'status': 'active',
                'research_intent': f'Research study for {product}',
                'interview_config': {
                    'allow_skip': False,
                    'require_audio_response': False
                }
            }
            
            result = supabase.table('studies').insert(study_data).execute()
            study_id = result.data[0]['id']
            print(f"✓ Created study: {product} Study")
        
        study_map[product] = study_id
        print(f"  → Study ID: {study_id}")
    
    return study_map

def update_assignments(study_map):
    print("\n📋 Analyzing research_question_assignments...")
    
    # Get all assignments
    assignments = supabase.table('research_question_assignments').select('*, research_questions(*)').execute().data
    
    # Group by participant and product
    participant_studies = {}
    for assignment in assignments:
        participant_id = assignment['participant_id']
        product = assignment['research_questions']['specific_product']
        
        if participant_id not in participant_studies:
            participant_studies[participant_id] = set()
        
        participant_studies[participant_id].add(product)
    
    print(f"Found {len(participant_studies)} participants with assignments")
    print(f"Total unique participant-study combinations: {sum(len(products) for products in participant_studies.values())}")
    
    return participant_studies

if __name__ == '__main__':
    study_map = create_product_studies()
    participant_studies = update_assignments(study_map)
    
    print("\n✅ Product-based studies created successfully!")
    print(f"   Studies created: {len(study_map)}")
    for product, study_id in study_map.items():
        print(f"   - {product}: {study_id}")
