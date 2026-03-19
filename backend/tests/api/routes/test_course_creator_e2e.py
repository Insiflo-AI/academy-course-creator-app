from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings

def test_course_creator_e2e_flow(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """
    Test the full Course Creator flow:
    1. AI Outline Generation (Mocked)
    2. Course Creation (using AI outcome)
    3. Verification of created resources
    """

    # 1. Define the deterministic "Mock" AI response
    mock_ai_response_text = """
    {
        "objectives": [
            "Understand AI basics",
            "Implement simple models"
        ],
        "modules": [
            {
                "title": "Introduction to AI",
                "description": "Basics and History"
            },
            {
                "title": "Neural Networks",
                "description": "Deep Learning Fundamentals"
            }
        ]
    }
    """

    # 2. Call the AI Endpoint with mocked service
    # We patch 'app.api.routes.ai.generate_ai_response' because that is where it is imported/used
    with patch("app.api.routes.ai.generate_ai_response", return_value=mock_ai_response_text) as mock_ai:
        
        outline_payload = {
            "title": "E2E Test Course",
            "targetAudience": "Developers",
            "shortDescription": "Testing flow"
        }
        
        response = client.post(
            f"{settings.API_V1_STR}/ai/course-outline",
            headers=superuser_token_headers,
            json=outline_payload,
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify the endpoint parsed our mock JSON correctly
        assert "learningObjectives" in data
        assert len(data["learningObjectives"]) == 2
        assert data["learningObjectives"][0] == "Understand AI basics"
        assert len(data["modules"]) == 2
        assert data["modules"][0]["title"] == "Introduction to AI"
        
        # Verify the mock was actually called
        mock_ai.assert_called_once()

    # 3. Create the Course using the data from the AI step
    course_payload = {
        "title": "E2E Test Course",
        "shortDescription": "Testing flow",
        "targetAudience": "Developers",
        "level": "Beginner",
        "contentStyle": "Technical",
        "learningObjectives": data["learningObjectives"],
        "modules": data["modules"],
        "status": "IN_PROGRESS"
    }

    create_response = client.post(
        f"{settings.API_V1_STR}/courses/",
        headers=superuser_token_headers,
        json=course_payload,
    )

    assert create_response.status_code == 201
    course_data = create_response.json()
    course_id = course_data["id"]

    assert course_data["title"] == "E2E Test Course"
    assert len(course_data["modules"]) == 2
    
    # 4. detailed verification of persistence
    # Fetch the course again to be sure
    get_response = client.get(
        f"{settings.API_V1_STR}/courses/{course_id}",
        headers=superuser_token_headers,
    )
    assert get_response.status_code == 200
    saved_course = get_response.json()
    
    assert saved_course["id"] == course_id
    assert saved_course["modules"][0]["title"] == "Introduction to AI"
    # Ensure modules are ordered
    assert saved_course["modules"][0]["order"] == 1
    assert saved_course["modules"][1]["order"] == 2
