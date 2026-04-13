# WHO Growth Standards API

## Overview

This API provides WHO (World Health Organization) child growth standards data for displaying reference curves in growth charts.

## Endpoint

```
GET /api/children/:childId/growth/who-standards
```

## Authentication

Requires JWT authentication (JwtAuthGuard).

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| measurementType | string | Yes | Type of measurement: `height`, `weight`, or `headCirc` |
| gender | string | Yes | Child's gender: `male` or `female` |
| ageMonths | number | Yes | Age in months (0-60) |

## Response

Returns percentile values for the specified measurement:

```json
{
  "p3": 46.3,
  "p15": 48.0,
  "p50": 49.9,
  "p85": 51.8,
  "p97": 53.5
}
```

## Response Fields

- `p3`: 3rd percentile value
- `p15`: 15th percentile value
- `p50`: 50th percentile (median)
- `p85`: 85th percentile value
- `p97`: 97th percentile value

## Example Request

```bash
GET /api/children/child-123/growth/who-standards?measurementType=height&gender=male&ageMonths=12
```

## Example Response

```json
{
  "p3": 71.0,
  "p15": 73.4,
  "p50": 75.7,
  "p85": 78.1,
  "p97": 80.5
}
```

## Features

- **Linear Interpolation**: For ages between data points, values are calculated using linear interpolation
- **Boundary Handling**: Ages outside the 0-60 month range use the closest boundary values
- **Static Data**: Uses pre-loaded JSON data for optimal performance

## Data Source

WHO Child Growth Standards (0-5 years)
- Height: Length/height-for-age (cm)
- Weight: Weight-for-age (kg)
- Head Circumference: Head circumference-for-age (cm)

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid measurement type or gender"
}
```

### 400 Bad Request (Invalid Age)
```json
{
  "statusCode": 400,
  "message": "Invalid ageMonths parameter"
}
```

## Implementation Notes

1. Data is stored in `src/growth/data/who-standards.json`
2. Supports ages 0-60 months with key data points at 0, 1, 2, 3, 6, 9, 12, 18, 24, 36, 48, and 60 months
3. Linear interpolation provides smooth curves between data points
4. No database queries required - all data loaded from JSON file
