# MBTI Personality API

## Overview

The MBTI Personality API allows users to take the MBTI personality test and receive results based on their responses. It supports multiple languages, enabling users from various backgrounds to engage with the API. All requests are authenticated using an API key to ensure secure access.

## Base URL
https://vast-fortress-09703-4205e76f9182.herokuapp.com

## Features

- **MBTI Personality Test**: The API supports the MBTI personality test, allowing users to discover their personality type based on their responses.

- **Language Support**: Currently limited to five languages: English, Spanish, French, Portuguese, and Arabic.

- **API Key Authentication**: The API is secured using API keys. You can request one by contacting dev@luminaway-solutions.tech.

- **Rate Limiting**: Each IP is limited to 300 requests per 15 minutes to prevent abuse and ensure fair usage.

- **HTTPS**: The API uses HTTPS for secure communication, protecting data transmitted between the client and server.

- **Metrics Endpoint**: The API includes a `/metrics` endpoint for Prometheus to scrape metrics about the application's performance, useful for monitoring and optimization.

- **Logging**: All incoming requests and active connections are logged for tracking and debugging purposes, ensuring transparency and accountability.

## Getting Started

To use the API, you need an API key. You can request an API key by contacting dev@luminaway-solutions.tech.

### Base URL
The base URL for the API is: https://vast-fortress-09703-4205e76f9182.herokuapp.com

### Authentication
Each request requires an `x-api-key` header with your API key. 

**Example**:
```http
Headers: {
  "x-api-key": "<your_api_key>"
}
```

## Endpoints

### 1. Get MBTI Test Questions
**Description**: Retrieves the MBTI test questions in the specified language.

**URL**: `/v1/questions/:langCode`

**Method**: `GET`

**Headers**: 
x-api-key: <your_api_key>

**Response**: Returns 40 MBTI test questions in the specified language.

**Example**:
```GET https://vast-fortress-09703-4205e76f9182.herokuapp.com/v1/questions/en Headers: { "x-api-key": "<your_api_key>" }```

**Response**:

```json
[
    {
        "id": 1,
        "question": "I prefer to spend time alone or with a few close friends rather than in large groups.",
        "letter": "I",
        "answers": [
            "Strongly Agree",
            "Agree",
            "Neutral",
            "Disagree",
            "Strongly Disagree"
        ],
        "language_code": "en"
    },
    {
        "id": 2,
        "question": "I enjoy being the center of attention at social events.",
        "letter": "E",
        "answers": [
            "Strongly Agree",
            "Agree",
            "Neutral",
            "Disagree",
            "Strongly Disagree"
        ],
        "language_code": "en"
    },
    {
        "id": 3,
        "question": "I find myself daydreaming about future scenarios and opportunities.",
        "letter": "N",
        "answers": [
            "Strongly Agree",
            "Agree",
            "Neutral",
            "Disagree",
            "Strongly Disagree"
        ],
        "language_code": "en"
    },
    {
        "id": 4,
        "question": "I focus on the details and facts when solving problems.",
        "letter": "S",
        "answers": [
            "Strongly Agree",
            "Agree",
            "Neutral",
            "Disagree",
            "Strongly Disagree"
        ],
        "language_code": "en"
    },
    {
        "id": 5,
        "question": "I consider how my decisions will affect others’ emotions and well-being.",
        "letter": "F",
        "answers": [
            "Strongly Agree",
            "Agree",
            "Neutral",
            "Disagree",
            "Strongly Disagree"
        ],
        "language_code": "en"
    },
    // ... more questions up to id: 40
]
```
### 2. Submit MBTI Answers
**Description**: Submits the user's answers for the MBTI test and returns the calculated personality type along with detailed descriptions.

**Body**: JSON array of responses, each containing a questionId and user response (e.g., "Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"). 

**Important**: **No matter the selected language, all responses must be sent in English.** For example: "Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree".

**Example**:


**URL**: `/v1/mbti-test/:langCode`

**Method**: `POST`

**Headers**: 
x-api-key: <your_api_key>

**Body**: JSON array of responses, each containing a questionId and user response (e.g., "Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree").

**Example**:
POST https://vast-fortress-09703-4205e76f9182.herokuapp.com/v1/mbti-test/en Headers: { "x-api-key": "<your_api_key>" } Body: { "responses": [ "1: Strongly Disagree", "2: Strongly Agree", "3: Strongly Agree", "4: Disagree", "5: Disagree", "6: Strongly Agree", "7: Strongly Agree", "8: Disagree", "9: Strongly Agree", "10: Strongly Agree", // ... up to question 40 ] }


**Response**: Returns the calculated MBTI personality type, along with detailed descriptions and percentages for each dichotomy.

**Response**:

```json
{
  "message": "MBTI test completed",
  "personalityData": {
    "id": 2,
    "language_code": "en",
    "personalityType": "ENTJ",
    "extraversion_introversion": "Extraverted, 54%",
    "sensing_intuition": "Intuitive, 87%",
    "thinking_feeling": "Thinking, 67%",
    "perceiving_judging": "Judging, 73%",
    "name": "Commander",
    "Description": "Commanders are born leaders with a strong desire to achieve their goals. Known for their strategic thinking, charisma, and confidence, they excel at organizing and motivating others. They are visionaries who thrive in competitive environments, often setting high standards for themselves and those around them. Commanders value efficiency and make decisive choices to bring their visions to life. In relationships, they appreciate partners who challenge them intellectually and share their ambitions, building long-term relationships based on mutual respect and growth.",
    "Strengths": [
      "Ambitious",
      "Energetic",
      "Confident",
      "Strategic",
      "Inspiring",
      "Decisive",
      "Charismatic",
      "Innovative",
      "Self-assured",
      "Efficient",
      "Bold",
      "Knowledgeable",
      "Determined"
    ],
    "Weaknesses": [
      "Stubborn",
      "Dominant",
      "Harsh",
      "Impatient",
      "Arrogant",
      "Intolerant",
      "Emotionally distant",
      "Insensitive",
      "Cold",
      "Ruthless"
    ],
    "DosInRelationship": [
      "Let them lead; they thrive in taking charge.",
      "Be supportive and gentle to complement their strong personality.",
      "Stay authentic - Commanders value sincerity and depth.",
      "Recognize their skills and creativity to affirm them."
    ],
    "DontsInRelationship": [
      "Don’t play manipulative games - Commanders hate that.",
      "Avoid jealousy or trying to make them insecure; they will move on quickly.",
      "Don’t engage in small talk or gossip - they find it uninteresting.",
      "Don’t push them to open up emotionally too soon."
    ],
    "Friendships": "Commanders seek friendships with those who value growth and personal development. They thrive around ambitious, goal-oriented friends. For Commanders, friendship means mutually inspiring each other to go further. They appreciate intellectual discussions, but also loyalty and trust with their closest friends. Commanders are energized by friends who share their level of enthusiasm and passion for meaningful activities.",
    "CareerPath": [
      "Aerospace Engineer",
      "Architect",
      "Architecture and Engineering Manager",
      "Chef",
      "Chief Information Officer",
      "Electrical Engineer",
      "Emergency Management Director",
      "Epidemiologist",
      "Market Research Analyst",
      "Pharmacist"
    ],
    "LifeValue": [
      "Family/Home",
      "Health",
      "Financial Security",
      "Friendships",
      "Success"
    ],
    "CompatibleConnections": [
      "The Architect (INTJ)",
      "The Logician (INTP)",
      "The Mediator (INFP)"
    ],
    "HasPotentialConnections": [
      "The Debater (ENTP)",
      "The Protagonist (ENFJ)",
      "The Campaigner (ENFP)",
      "The Advocate (INFJ)",
      "The Defender (ISFJ)",
      "The Virtuoso (ISTP)"
    ],
    "ChallengingConnections": [
      "The Adventurer (ISFP)",
      "The Consul (ESFJ)",
      "The Commander (ENTJ)",
      "The Executive (ESTJ)",
      "The Logistician (ISTJ)",
      "The Performer (ESFP)",
      "The Entrepreneur (ESTP)"
    ],
    "AttractedBy": [
      "Competent",
      "Rational",
      "Supportive",
      "Thoughtful",
      "Reliable",
      "Authentic",
      "Gentle and kind",
      "Loyal",
      "Caring",
      "Sincere",
      "Having depth",
      "Punctual"
    ],
    "PetPeeves": [
      "Controlling",
      "Too emotional",
      "Manipulative",
      "Lazy",
      "Disorganized",
      "Tardy",
      "Passive-aggressive",
      "Superficial",
      "Incompetent",
      "Insincere",
      "Too formal",
      "Irrational"
    ],
    "HowToBeCompanion": [
      "Challenge them intellectually - they love meaningful debates.",
      "Support their long-term vision and goals; they need a partner who believes in their aspirations.",
      "Be direct and assertive in communication; they respect confidence.",
      "Encourage their leadership while showing your own initiative.",
      "Give them space to focus on their work and personal projects.",
      "Stay passionate and motivated; they admire ambition and strength in a partner."
    ],
    "SecretDesire": "Although they often appear rational and decisive, Commanders secretly aspire for deeper meaning and fulfillment in their lives. Beyond material success, they seek relationships founded on emotional depth and openness. Their true desire is to create something lasting - to make an impact on the world that goes beyond their professional domain.",
    "Stereotypes": "Commanders are often perceived as workaholics, overly focused on their goals, and indifferent to social issues. However, in reality, they deeply care about inspiring others and helping them reach their full potential. Despite their tough exterior, they remain passionate about personal connections and creating meaningful change.",
    "Celebrities": [
      "Napoleon Bonaparte",
      "Franklin D. Roosevelt",
      "Bill Gates",
      "Warren Buffett",
      "Steve Jobs",
      "Dwayne Johnson",
      "Adele",
      "Queen Elizabeth I"
    ]
  }
}
```

### Error Handling
The API provides structured error handling. Common error responses include:

- **403 Forbidden**: Invalid API key.
- **404 Not Found**: Invalid endpoint or missing resource.
- **400 Bad Request**: Invalid request format or missing parameters.
- **500 Internal Server Error**: An error occurred while processing the request.

### API Key Management
To request an API key or for API-related support, email [dev@luminaway-solutions.tech](mailto:dev@luminaway-solutions.tech).

### Rate Limiting
This API is rate-limited to **300 requests per 15 minutes per IP**. Exceeding this limit will result in a **429 Too Many Requests** response.

### Security
The API includes several security measures:

- **HTTPS**: The API is served over HTTPS to ensure secure communication.
- **Helmet**: The API uses Helmet for enhanced security by setting appropriate HTTP headers.
- **Rate Limiting**: Rate limiting is implemented to protect the API from abuse.

### Monitoring
Prometheus is integrated for collecting and monitoring API metrics, which include request count, request duration, and error rates. You can scrape the metrics from the `/metrics` endpoint:

GET https://vast-fortress-09703-4205e76f9182.herokuapp.com/metrics

### Roadmap
- Add support for more languages.
- Implement API key revocation and generation via a dedicated admin panel.
- Improve caching for frequently requested resources.




