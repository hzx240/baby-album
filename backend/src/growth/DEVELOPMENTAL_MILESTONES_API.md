# Developmental Milestones API

## Overview

This API provides developmental milestones data for tracking child development across four key areas: motor skills, language, social interaction, and cognitive development.

## Endpoint

```
GET /api/children/:childId/growth/milestones
```

## Authentication

Requires JWT authentication (JwtAuthGuard).

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | Optional | Milestone category: `motor`, `language`, `social`, or `cognitive`. If omitted, returns all categories. |
| ageMonths | number | Yes | Child's age in months (0-36) |

## Response Format

### Single Category Response

When `category` parameter is provided:

```json
{
  "ageMonthsMin": 6,
  "ageMonthsMax": 9,
  "milestones": [
    {
      "name": "独坐",
      "description": "无需支撑能独立坐稳",
      "typical": 7
    },
    {
      "name": "爬行",
      "description": "开始爬行或匍匐前进",
      "typical": 8
    }
  ]
}
```

### All Categories Response

When `category` parameter is omitted:

```json
{
  "motor": {
    "ageMonthsMin": 6,
    "ageMonthsMax": 9,
    "milestones": [...]
  },
  "language": {
    "ageMonthsMin": 6,
    "ageMonthsMax": 9,
    "milestones": [...]
  },
  "social": {
    "ageMonthsMin": 6,
    "ageMonthsMax": 9,
    "milestones": [...]
  },
  "cognitive": {
    "ageMonthsMin": 6,
    "ageMonthsMax": 9,
    "milestones": [...]
  }
}
```

## Milestone Categories

### 1. Motor Skills (motor)
Physical development milestones including:
- Gross motor: head control, rolling, sitting, crawling, walking, running, jumping
- Fine motor: grasping, reaching, manipulating objects

### 2. Language Development (language)
Communication milestones including:
- Receptive language: understanding words and instructions
- Expressive language: vocalizations, words, sentences
- Social communication: responding to name, following directions

### 3. Social Interaction (social)
Social-emotional milestones including:
- Attachment: bonding with caregivers
- Social engagement: smiling, playing with others
- Emotional regulation: expressing and managing emotions

### 4. Cognitive Development (cognitive)
Thinking and learning milestones including:
- Problem-solving abilities
- Object permanence
- Cause and effect understanding
- Memory and attention

## Example Requests

### Get motor milestones for 8-month-old
```bash
GET /api/children/child-123/growth/milestones?category=motor&ageMonths=8
```

### Get all milestones for 12-month-old
```bash
GET /api/children/child-123/growth/milestones?ageMonths=12
```

## Data Source

Based on standard child development guidelines and pediatric references.

## Error Responses

### 400 Bad Request (Invalid Age)
```json
{
  "statusCode": 400,
  "message": "Invalid ageMonths parameter"
}
```

### 400 Bad Request (Invalid Category)
```json
{
  "statusCode": 400,
  "message": "Invalid milestone category"
}
```
