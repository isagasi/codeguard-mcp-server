---
applyTo: '**/*.ts,**/*.js,**/*.py,**/*.java'
description: Organization API Standards
version: 1.0.0
---

rule_id: org-api-standards

# Organization API Standards

This is an example custom rule for your organization's API development standards.

## REST API Conventions

### HTTP Methods
- **GET**: Read-only operations, never modify data
- **POST**: Create new resources
- **PUT**: Full resource replacement
- **PATCH**: Partial resource update
- **DELETE**: Remove resources

### Response Status Codes
```
200 OK - Successful GET, PUT, PATCH
201 Created - Successful POST
204 No Content - Successful DELETE
400 Bad Request - Invalid input
401 Unauthorized - Missing auth
403 Forbidden - Insufficient permissions
404 Not Found - Resource doesn't exist
500 Internal Server Error - Server error
```

### Request/Response Format
```json
{
  "data": { /* actual response data */ },
  "meta": {
    "timestamp": "2026-01-20T00:00:00Z",
    "requestId": "uuid-here"
  },
  "errors": [ /* if applicable */ ]
}
```

### Pagination
```
GET /api/resources?page=1&limit=20

Response:
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasMore": true
  }
}
```

## Error Handling

Always return structured errors:
```json
{
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Invalid email format",
      "field": "email"
    }
  ]
}
```

## Rate Limiting

- Include rate limit headers:
  - `X-RateLimit-Limit: 1000`
  - `X-RateLimit-Remaining: 999`
  - `X-RateLimit-Reset: 1640000000`

## Authentication

- All endpoints require Bearer token authentication
- Token format: `Authorization: Bearer <jwt_token>`
- Tokens expire after 1 hour
- Use refresh tokens for long-lived sessions

## Versioning

- API version in URL: `/api/v1/resource`
- Maintain backward compatibility for at least 2 versions
- Deprecation notice period: 90 days
