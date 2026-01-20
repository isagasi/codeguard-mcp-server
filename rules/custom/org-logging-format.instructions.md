---
applyTo: '**/*.ts,**/*.js,**/*.py,**/*.java,**/*.go'
description: Organization Logging Format
version: 1.0.0
---

rule_id: org-logging-format

# Organization Logging Format Standards

This is an example custom rule for your organization's logging standards.

## Required Fields

Every log entry MUST include:
```json
{
  "timestamp": "2026-01-20T12:34:56.789Z",
  "level": "INFO",
  "service": "user-service",
  "traceId": "abc-123-def",
  "message": "User login successful",
  "userId": "user-123",
  "metadata": {}
}
```

## Log Levels

Use these levels consistently:
- **DEBUG**: Detailed debugging information (dev only)
- **INFO**: General informational messages
- **WARN**: Warning messages (recoverable issues)
- **ERROR**: Error events (handled errors)
- **FATAL**: Critical errors requiring immediate attention

## Log Format Examples

### TypeScript/JavaScript
```typescript
import { logger } from '@org/logger';

logger.info('User logged in', {
  userId: user.id,
  email: user.email,
  ipAddress: request.ip,
  userAgent: request.headers['user-agent']
});
```

### Python
```python
from org_logger import logger

logger.info(
    "User logged in",
    extra={
        "user_id": user.id,
        "email": user.email,
        "ip_address": request.remote_addr
    }
)
```

### Java
```java
import com.org.logger.Logger;

logger.info("User logged in", Map.of(
    "userId", user.getId(),
    "email", user.getEmail(),
    "ipAddress", request.getRemoteAddr()
));
```

## What NOT to Log

**NEVER log sensitive data:**
- ❌ Passwords (even hashed)
- ❌ API keys or tokens
- ❌ Credit card numbers
- ❌ Social security numbers
- ❌ Personal health information

**Redact if necessary:**
```typescript
logger.info('Payment processed', {
  cardLast4: '4242',  // ✅ Last 4 digits only
  amount: 99.99,
  userId: user.id
});
```

## Structured Logging

Always use structured logging (JSON format):
```
✅ Good:
logger.info("User action", { action: "login", userId: "123" })

❌ Bad:
logger.info("User 123 performed login")
```

## Performance Monitoring

Include timing information:
```typescript
const start = Date.now();
await performOperation();
const duration = Date.now() - start;

logger.info('Operation completed', {
  operation: 'database_query',
  duration_ms: duration,
  recordCount: results.length
});
```

## Error Logging

Include stack traces for errors:
```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    userId: user.id,
    operation: 'riskyOperation'
  });
}
```

## Log Retention

- **Production**: 90 days
- **Staging**: 30 days  
- **Development**: 7 days
