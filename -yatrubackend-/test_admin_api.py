#!/usr/bin/env python3
"""
Test script for Admin KYC Verification System
This script tests the admin authentication and KYC management endpoints.
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_admin_login():
    """Test admin login with correct credentials"""
    print("\n1. Testing Admin Login...")
    print("-" * 50)
    
    url = f"{BASE_URL}/admin/login/"
    payload = {
        "email": "trekker_nepal@gmail.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Admin login successful!")
            print(f"Access Token: {data['access'][:50]}...")
            print(f"User: {data['user']}")
            return data['access']
        else:
            print(f"❌ Login failed: {response.json()}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_admin_login_invalid():
    """Test admin login with incorrect credentials"""
    print("\n2. Testing Admin Login with Invalid Credentials...")
    print("-" * 50)
    
    url = f"{BASE_URL}/admin/login/"
    payload = {
        "email": "wrong@example.com",
        "password": "wrongpassword"
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Correctly rejected invalid credentials")
            print(f"Error: {response.json()}")
        else:
            print(f"❌ Unexpected response: {response.json()}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_kyc_list(token):
    """Test listing KYC requests"""
    print("\n3. Testing KYC Request List...")
    print("-" * 50)
    
    if not token:
        print("❌ No token available, skipping test")
        return
    
    url = f"{BASE_URL}/admin/kyc-requests/"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Successfully retrieved {data['total']} KYC requests")
            
            if data['kyc_requests']:
                print("\nSample KYC Request:")
                print(json.dumps(data['kyc_requests'][0], indent=2))
            else:
                print("No KYC requests found in database")
        else:
            print(f"❌ Failed: {response.json()}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_kyc_list_without_auth():
    """Test KYC request list without authentication"""
    print("\n4. Testing KYC Request List without Authentication...")
    print("-" * 50)
    
    url = f"{BASE_URL}/admin/kyc-requests/"
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code in [401, 403]:
            print("✅ Correctly rejected unauthorized access")
            print(f"Error: {response.json()}")
        else:
            print(f"❌ Unexpected response: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    print("=" * 50)
    print("Admin KYC Verification System - API Tests")
    print("=" * 50)
    print("\nNOTE: Make sure Django server is running on port 8000")
    print("Start server with: python3 manage.py runserver 8000")
    
    # Test 1: Valid admin login
    token = test_admin_login()
    
    # Test 2: Invalid admin login
    test_admin_login_invalid()
    
    # Test 3: List KYC requests with auth
    test_kyc_list(token)
    
    # Test 4: List KYC requests without auth
    test_kyc_list_without_auth()
    
    print("\n" + "=" * 50)
    print("Tests completed!")
    print("=" * 50)

if __name__ == "__main__":
    main()
