# Organization Security Policy - CodeGuard Enforcement

## MANDATORY SECURITY REQUIREMENTS

**CRITICAL**: Before generating, modifying, or reviewing code that involves any of the following areas, you MUST call the `get_security_instructions` tool from the @codeguard MCP server:

### Security-Critical Code Areas (Tool Usage REQUIRED)

1. **Authentication & Authorization**
   - User login, session management, password handling
   - OAuth, SAML, OIDC implementations
   - API keys, tokens, credentials
   - Role-based or attribute-based access control
   - Multi-factor authentication (MFA)

2. **Cryptography & Encryption**
   - Any use of encryption algorithms (AES, RSA, etc.)
   - Hashing functions (SHA-256, bcrypt, etc.)
   - Key generation, storage, or exchange
   - Digital certificates, SSL/TLS configuration
   - Secure random number generation

3. **Data Security**
   - Database connections, queries, ORM operations
   - File uploads, downloads, or processing
   - Data serialization/deserialization (JSON, XML, etc.)
   - Logging sensitive information
   - Personal Identifiable Information (PII) handling

4. **Input Validation & Injection Prevention**
   - SQL queries, database operations
   - Command execution, shell operations
   - HTML rendering, template engines
   - API input validation
   - Regular expressions for validation

5. **Network & API Security**
   - HTTP/HTTPS requests, REST APIs
   - GraphQL endpoints
   - WebSocket connections
   - CORS configuration
   - Rate limiting, throttling

6. **Infrastructure & Deployment**
   - Container configurations (Dockerfile, docker-compose)
   - Kubernetes manifests
   - CI/CD pipeline scripts
   - Cloud infrastructure as code (Terraform, CloudFormation)
   - Environment variable handling

### How to Use the Security Tool

When you encounter any of the above scenarios:

```
# In Copilot Chat Agent mode:
@workspace Before implementing this authentication feature, I need security guidelines.

# Then explicitly request:
Use the get_security_instructions tool to check for authentication security requirements.
```

### Example Workflow

**User Request**: "Create a login endpoint with password validation"

**Your Response**:
1. First, use the `get_security_instructions` tool with context about authentication and password handling
2. Review the security instructions returned
3. Implement the code following the security guidelines
4. Validate the implementation against the security rules

### Non-Deterministic Compliance Notice

⚠️ **Important**: Due to the non-deterministic nature of AI language models, GitHub Copilot may not always follow these instructions perfectly. If you notice security-critical code being generated without consulting the CodeGuard MCP server:

1. **Stop and ask** the agent to use the security tool before proceeding
2. **Validate** the generated code against security best practices
3. **Report** any consistent failures to follow this policy to your security team

### Verification

To verify the CodeGuard MCP server is configured:
1. Open VS Code Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Run: `MCP: List Servers`
3. Confirm `codeguard` server is listed and running

### Tools Available

From the CodeGuard MCP server:
- `get_security_instructions` - Get applicable security rules for a specific context/language
- `validate_code_security` - Validate existing code against security rules

### Resources Available

You can also manually attach security instructions via:
- **Add Context** → **MCP Resources** → `codeguard://instructions/*`

---

**Policy Enforcement**: This policy is mandatory for all code generation, modification, and review within this organization. Failure to follow these guidelines may result in security vulnerabilities that violate organizational security standards.

**Last Updated**: February 2026
**Owner**: Security Engineering Team
