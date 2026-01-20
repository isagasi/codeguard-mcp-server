---
applyTo: '**/*'
description: No Hardcoded Credentials (Organization Override)
version: 1.0.1
---

rule_id: codeguard-1-hardcoded-credentials

# No Hardcoded Credentials - Organization Policy

**This is a custom override of the default hardcoded credentials rule.**

NEVER store secrets, passwords, API keys, tokens or any other credentials directly in source code.

## Organization-Specific Requirements

### Approved Secret Management Solutions

Our organization REQUIRES using one of these approved solutions:

1. **Azure Key Vault** (Preferred for production)
   ```typescript
   import { SecretClient } from "@azure/keyvault-secrets";
   
   const client = new SecretClient(vaultUrl, credential);
   const secret = await client.getSecret("database-password");
   ```

2. **HashiCorp Vault** (For on-premise)
   ```python
   import hvac
   
   client = hvac.Client(url='https://vault.company.com')
   secret = client.secrets.kv.v2.read_secret_version(
       path='database/credentials'
   )
   ```

3. **Environment Variables** (For development only)
   ```bash
   # .env (NEVER commit to git!)
   DATABASE_PASSWORD=secret123
   API_KEY=abc123
   ```

### Secret Rotation Policy

- **Production secrets**: Rotate every 90 days
- **Staging secrets**: Rotate every 180 days
- **API keys**: Rotate immediately if compromised

### Detection & Prevention

Our CI/CD pipeline includes:
- **TruffleHog**: Scans for secrets in commits
- **GitLeaks**: Pre-commit hooks
- **SonarQube**: Static analysis for hardcoded secrets

### What to Do If You Commit a Secret

1. **Immediately** rotate the compromised secret
2. Notify security team: security@company.com
3. Use `git filter-branch` or BFG Repo-Cleaner to remove from history
4. File an incident report

### Examples of Banned Patterns

```typescript
// ❌ FORBIDDEN - Will fail CI/CD
const apiKey = "sk_live_abc123def456";
const dbPassword = "MyP@ssw0rd123";
const awsKey = "AKIAIOSFODNN7EXAMPLE";

// ✅ APPROVED
const apiKey = process.env.STRIPE_API_KEY;
const dbPassword = await secretManager.getSecret('db-password');
```

### Organization Contact

Questions? Contact Platform Security Team:
- Email: security@company.com
- Slack: #platform-security
- Wiki: https://wiki.company.com/security/secrets-management
