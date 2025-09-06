# API Documentation

## Overview

This document outlines the API endpoints, data structures, and integration details for the Scout Activities Platform. The API follows RESTful principles and uses JSON for data exchange. The platform is designed for Portuguese scout leaders with all content in Portuguese.

## OpenAPI Documentation

The API is fully documented using OpenAPI 3.0 specification and can be explored interactively:

- **Development:** `http://localhost:3000/api/docs`
- **Production:** `https://your-domain.com/api/docs`

**Note:** All API endpoints are thoroughly tested using PostgreSQL-based integration tests to ensure reliability and consistency with production database behavior. Epic 5 will enhance API documentation with OpenAPI/Swagger integration and improve error handling consistency.

### Features
- Interactive API explorer with Swagger UI
- Request/response examples for all endpoints
- Authentication flow documentation
- Schema definitions for all data models
- Export OpenAPI spec as JSON/YAML

### Client Generation
```bash
# Generate TypeScript client
npx openapi-generator-cli generate -i http://localhost:3000/api/docs/json -g typescript-fetch -o ./generated/client

# Generate Python client
npx openapi-generator-cli generate -i http://localhost:3000/api/docs/json -g python -o ./generated/python-client
```

## Base URL

- **Development:** `http://localhost:3000/api`
- **Production:** `https://your-domain.com/api`

## Authentication

### Authentication Flow

1. **Google OAuth Sign-in**
   ```
   POST /api/auth/signin/google
   ```

2. **Domain Validation**
   - Server validates email domain is `@escoteiros.pt`
   - Returns 403 if domain not allowed

3. **Session Management**
   - JWT tokens stored in HTTP-only cookies
   - Automatic token refresh
   - Session expires after 7 days

### Protected Endpoints

All protected endpoints require authentication and return:
- `401 Unauthorized` - No valid session
- `403 Forbidden` - Insufficient permissions

## API Endpoints

### Authentication

#### Sign In
```http
POST /api/auth/signin/google
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@escoteiros.pt",
    "name": "João Silva",
    "image": "https://...",
    "role": "user"
  }
}
```

#### Sign Out
```http
POST /api/auth/signout
```

**Response:**
```json
{
  "success": true
}
```

#### Get Session
```http
GET /api/auth/session
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@escoteiros.pt",
    "name": "João Silva",
    "image": "https://...",
    "role": "user"
  }
}
```

### Activities

#### List Activities
```http
GET /api/activities?search=game&group_size=medium&effort_level=low&duration_min=30&duration_max=60&page=1&limit=20
```

**Query Parameters:**
- `search` (string) - Text search in name, description, materials
- `group_size` (string[]) - Filter by group size: small, medium, large
- `effort_level` (string[]) - Filter by effort: low, medium, high
- `location` (string) - Filter by location: inside, outside
- `age_group` (string[]) - Filter by age group
- `activity_type` (string[]) - Filter by activity type
- `sdgs` (string[]) - Filter by SDG IDs
- `educational_goals` (string[]) - Filter by educational goal IDs
- `duration_min` (number) - Minimum duration in minutes
- `duration_max` (number) - Maximum duration in minutes
- `duration_operator` (string) - Duration comparison: >, <, =, >=, <=
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20)
- `view` (string) - View type: tiles, table (default: tiles)
- `sort` (string) - Sort field: name, duration, created_at
- `order` (string) - Sort order: asc, desc (default: asc)

**Response:**
```json
{
  "activities": [
    {
      "id": "activity_123",
      "name": {
        "pt": "Jogo da Teia",
        "en": "Web Game"
      },
      "description": {
        "pt": "Um jogo cooperativo...",
        "en": "A cooperative game..."
      },
      "materials": {
        "pt": "Corda, espaço aberto",
        "en": "Rope, open space"
      },
      "approximate_duration_minutes": 30,
      "group_size": "medium",
      "effort_level": "low",
      "location": "outside",
      "age_group": "scouts",
      "activity_type": {
        "id": "type_1",
        "name": {
          "pt": "Jogo",
          "en": "Game"
        }
      },
      "image_url": "https://...",
      "educational_goals": [
        {
          "id": "goal_1",
          "title": {
            "pt": "Trabalho em Equipa",
            "en": "Teamwork"
          },
          "area": {
            "id": "area_1",
            "name": {
              "pt": "Competências Sociais",
              "en": "Social Skills"
            }
          }
        }
      ],
      "sdgs": [
        {
          "id": "sdg_1",
          "number": 17,
          "name": {
            "pt": "Parcerias para os Objetivos",
            "en": "Partnerships for the Goals"
          },
          "icon_url": "https://..."
        }
      ],
      "average_rating": 4.5,
      "rating_count": 12,
      "user_rating": 5,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  },
  "filters": {
    "applied": {
      "search": "game",
      "group_size": ["medium"],
      "effort_level": ["low"]
    },
    "available": {
      "group_sizes": ["small", "medium", "large"],
      "effort_levels": ["low", "medium", "high"],
      "locations": ["inside", "outside"],
      "age_groups": ["cub_scouts", "scouts", "adventurers", "rovers", "leaders"],
      "activity_types": [...],
      "sdgs": [...],
      "educational_goals": [...]
    }
  }
}
```

#### Get Activity
```http
GET /api/activities/{id}
```

**Response:**
```json
{
  "activity": {
    "id": "activity_123",
    "name": {
      "pt": "Jogo da Teia",
      "en": "Web Game"
    },
    "description": {
      "pt": "Um jogo cooperativo...",
      "en": "A cooperative game..."
    },
    "materials": {
      "pt": "Corda, espaço aberto",
      "en": "Rope, open space"
    },
    "approximate_duration_minutes": 30,
    "group_size": "medium",
    "effort_level": "low",
    "location": "outside",
    "age_group": "scouts",
    "activity_type": {
      "id": "type_1",
      "name": {
        "pt": "Jogo",
        "en": "Game"
      }
    },
    "image_url": "https://...",
    "educational_goals": [...],
    "sdgs": [...],
    "average_rating": 4.5,
    "rating_count": 12,
    "user_rating": 5,
    "reviews": [
      {
        "id": "review_1",
        "rating": 5,
        "comment": "Excelente atividade!",
        "user": {
          "id": "user_123",
          "name": "João Silva"
        },
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

#### Rate Activity
```http
POST /api/activities/{id}/rate
```

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excelente atividade para desenvolver trabalho em equipa!"
}
```

**Response:**
```json
{
  "success": true,
  "review": {
    "id": "review_1",
    "rating": 5,
    "comment": "Excelente atividade para desenvolver trabalho em equipa!",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

### Programs

#### List User Programs
```http
GET /api/programs?page=1&limit=20
```

**Response:**
```json
{
  "programs": [
    {
      "id": "program_123",
      "name": "Acampamento de Verão",
      "date": "2024-07-15",
      "start_time": "09:00",
      "is_public": false,
      "entry_count": 8,
      "total_duration_minutes": 480,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "total_pages": 1
  }
}
```

#### Get Program
```http
GET /api/programs/{id}
```

**Response:**
```json
{
  "program": {
    "id": "program_123",
    "name": "Acampamento de Verão",
    "date": "2024-07-15",
    "start_time": "09:00",
    "is_public": false,
    "user": {
      "id": "user_123",
      "name": "João Silva"
    },
    "entries": [
      {
        "id": "entry_1",
        "position": 1,
        "start_time": "09:00",
        "end_time": "09:30",
        "entry_type": "activity",
        "activity": {
          "id": "activity_123",
          "name": {
            "pt": "Jogo da Teia",
            "en": "Web Game"
          },
          "approximate_duration_minutes": 30,
          "group_size": "medium",
          "effort_level": "low",
          "location": "outside",
          "activity_type": {
            "name": {
              "pt": "Jogo",
              "en": "Game"
            }
          }
        }
      },
      {
        "id": "entry_2",
        "position": 2,
        "start_time": "09:30",
        "end_time": "10:00",
        "entry_type": "custom",
        "custom_title": "Pequeno-almoço",
        "custom_duration_minutes": 30
      }
    ],
    "summary": {
      "educational_goals": [
        {
          "id": "goal_1",
          "title": {
            "pt": "Trabalho em Equipa",
            "en": "Teamwork"
          }
        }
      ],
      "sdgs": [
        {
          "id": "sdg_1",
          "number": 17,
          "name": {
            "pt": "Parcerias para os Objetivos",
            "en": "Partnerships for the Goals"
          }
        }
      ]
    },
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

#### Create Program
```http
POST /api/programs
```

**Request Body:**
```json
{
  "name": "Novo Programa",
  "date": "2024-07-15",
  "start_time": "09:00",
  "is_public": false
}
```

**Response:**
```json
{
  "success": true,
  "program": {
    "id": "program_124",
    "name": "Novo Programa",
    "date": "2024-07-15",
    "start_time": "09:00",
    "is_public": false,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

#### Update Program
```http
PUT /api/programs/{id}
```

**Request Body:**
```json
{
  "name": "Programa Atualizado",
  "date": "2024-07-15",
  "start_time": "09:00",
  "is_public": true
}
```

#### Delete Program
```http
DELETE /api/programs/{id}
```

**Response:**
```json
{
  "success": true
}
```

#### Add Entry to Program
```http
POST /api/programs/{id}/entries
```

**Request Body:**
```json
{
  "entry_type": "activity",
  "activity_id": "activity_123",
  "position": 1
}
```

**Or for custom entry:**
```json
{
  "entry_type": "custom",
  "custom_title": "Pequeno-almoço",
  "custom_duration_minutes": 30,
  "position": 1
}
```

#### Update Program Entry
```http
PUT /api/programs/{id}/entries/{entry_id}
```

**Request Body:**
```json
{
  "position": 2,
  "custom_title": "Pequeno-almoço",
  "custom_duration_minutes": 45
}
```

#### Delete Program Entry
```http
DELETE /api/programs/{id}/entries/{entry_id}
```

#### Reorder Program Entries
```http
PUT /api/programs/{id}/entries/reorder
```

**Request Body:**
```json
{
  "entries": [
    {
      "id": "entry_1",
      "position": 1
    },
    {
      "id": "entry_2",
      "position": 2
    }
  ]
}
```

### Public Programs

#### List Public Programs
```http
GET /api/programs/public?search=acampamento&page=1&limit=20
```

**Query Parameters:**
- `search` (string) - Search in program names
- `page` (number) - Page number
- `limit` (number) - Items per page

**Response:**
```json
{
  "programs": [
    {
      "id": "program_123",
      "name": "Acampamento de Verão",
      "date": "2024-07-15",
      "start_time": "09:00",
      "user": {
        "id": "user_123",
        "name": "João Silva"
      },
      "entry_count": 8,
      "total_duration_minutes": 480,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "total_pages": 2
  }
}
```

#### Use Program as Template
```http
POST /api/programs/{id}/use-as-template
```

**Request Body:**
```json
{
  "name": "Meu Programa Baseado no Template"
}
```

**Response:**
```json
{
  "success": true,
  "program": {
    "id": "program_125",
    "name": "Meu Programa Baseado no Template",
    "based_on": {
      "id": "program_123",
      "name": "Acampamento de Verão",
      "user": {
        "name": "João Silva"
      }
    }
  }
}
```

### Exports

#### Export Program to Excel
```http
GET /api/programs/{id}/export/excel
```

**Response:** Excel file download

#### Export Program to PDF
```http
GET /api/programs/{id}/export/pdf
```

**Response:** PDF file download

### Admin Endpoints

#### List All Users (Admin Only)
```http
GET /api/admin/users?page=1&limit=20
```

**Response:**
```json
{
  "users": [
    {
      "id": "user_123",
      "email": "user@escoteiros.pt",
      "name": "João Silva",
      "role": "user",
      "created_at": "2024-01-15T10:00:00Z",
      "last_login": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "total_pages": 3
  }
}
```

#### Update User Role (Admin Only)
```http
PUT /api/admin/users/{id}/role
```

**Request Body:**
```json
{
  "role": "admin"
}
```

#### Create Activity (Admin Only)
```http
POST /api/admin/activities
```

**Request Body:**
```json
{
  "name": {
    "pt": "Nova Atividade",
    "en": "New Activity"
  },
  "description": {
    "pt": "Descrição da atividade...",
    "en": "Activity description..."
  },
  "materials": {
    "pt": "Materiais necessários",
    "en": "Required materials"
  },
  "approximate_duration_minutes": 30,
  "group_size": "medium",
  "effort_level": "low",
  "location": "outside",
  "age_group": "scouts",
  "activity_type_id": "type_1",
  "educational_goal_ids": ["goal_1", "goal_2"],
  "sdg_ids": ["sdg_1", "sdg_2"]
}
```

#### Update Activity (Admin Only)
```http
PUT /api/admin/activities/{id}
```

#### Delete Activity (Admin Only)
```http
DELETE /api/admin/activities/{id}
```

### Taxonomies

#### List Activity Types
```http
GET /api/taxonomies/activity-types
```

**Response:**
```json
{
  "activity_types": [
    {
      "id": "type_1",
      "name": {
        "pt": "Jogo",
        "en": "Game"
      },
      "description": {
        "pt": "Atividades lúdicas...",
        "en": "Playful activities..."
      }
    }
  ]
}
```

#### List Educational Areas
```http
GET /api/taxonomies/educational-areas
```

#### List Educational Goals
```http
GET /api/taxonomies/educational-goals?area_id=area_1
```

#### List SDGs
```http
GET /api/taxonomies/sdgs
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados de entrada inválidos",
    "details": {
      "field": "name",
      "issue": "Nome é obrigatório"
    }
  }
}
```

**Note:** Epic 5 will standardize all error messages to Portuguese and implement centralized error handling utilities for consistent error responses across all API endpoints.

### Common Error Codes
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `CONFLICT` - Resource conflict
- `INTERNAL_ERROR` - Server error

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

- **Authenticated requests:** 1000 requests per hour
- **Unauthenticated requests:** 100 requests per hour
- **File uploads:** 10 uploads per hour

## Caching

### Cache Headers
- **Activities list:** `Cache-Control: public, max-age=300` (5 minutes)
- **Taxonomies:** `Cache-Control: public, max-age=3600` (1 hour)
- **Public programs:** `Cache-Control: public, max-age=600` (10 minutes)

### Cache Invalidation
- Activities cache invalidated when activities are updated
- Taxonomies cache invalidated when taxonomies are updated
- User-specific data not cached

## File Uploads

### Image Upload
```http
POST /api/upload/image
```

**Request:** Multipart form data with image file

**Response:**
```json
{
  "success": true,
  "url": "https://uploadthing.com/f/abc123.jpg",
  "filename": "activity-image.jpg",
  "size": 1024000
}
```

### Supported Formats
- **Images:** JPEG, PNG, WebP
- **Max size:** 5MB
- **Max dimensions:** 2048x2048px

## Webhooks (Future)

### Program Published
```http
POST /webhook/program-published
```

**Payload:**
```json
{
  "event": "program.published",
  "data": {
    "program_id": "program_123",
    "user_id": "user_123",
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { ScoutAPI } from '@scout/api';

const api = new ScoutAPI({
  baseURL: 'https://api.scout-toolkit.com',
  authToken: 'your-token'
});

// List activities
const activities = await api.activities.list({
  search: 'game',
  group_size: ['medium'],
  page: 1,
  limit: 20
});

// Create program
const program = await api.programs.create({
  name: 'My Program',
  date: '2024-07-15',
  start_time: '09:00'
});
```

### Python
```python
import requests

class ScoutAPI:
    def __init__(self, base_url, auth_token):
        self.base_url = base_url
        self.headers = {'Authorization': f'Bearer {auth_token}'}
    
    def list_activities(self, **params):
        response = requests.get(
            f'{self.base_url}/api/activities',
            headers=self.headers,
            params=params
        )
        return response.json()

# Usage
api = ScoutAPI('https://api.scout-toolkit.com', 'your-token')
activities = api.list_activities(search='game', group_size=['medium'])
```
