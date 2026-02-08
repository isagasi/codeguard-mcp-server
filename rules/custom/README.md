# Custom Rules Directory

This directory contains **organization-specific** security instruction files that extend or override the default CodeGuard rules.

## How Custom Rules Work

### 1. **Override Default Rules**

If a custom rule has the **same ID** as a default rule, it completely replaces the default:

```
rules/
  codeguard-1-hardcoded-credentials.instructions.md  ← Default
  
rules/custom/
  codeguard-1-hardcoded-credentials.instructions.md  ← OVERRIDES default
```

When loaded, only the custom version will be used.

### 2. **Add New Organization Rules**

Create entirely new rules specific to your organization:

```
rules/custom/
  org-api-standards.instructions.md
  org-logging-format.instructions.md
  org-code-review-checklist.instructions.md
```

These are loaded alongside default rules.

### 3. **Priority Boost**

Custom rules automatically get:
- **+25 baseline score** boost
- **Elevated priority tier** (LOW→MEDIUM, MEDIUM→HIGH)
- **Higher ranking** in search results

This ensures organization-specific rules appear before generic ones.

---

## Creating Custom Rules

### File Naming

- Must end with `.instructions.md`
- Use descriptive IDs: `org-[topic].instructions.md`
- To override: match exact ID of default rule

### File Structure

```markdown
---
applyTo: '**/*.ts,**/*.js'
description: 'Your Rule Description'
version: '1.0.0'
---

rule_id: org-your-rule-id

# Your Rule Title

Your organization-specific guidance...
```

### Required Frontmatter

- `applyTo`: Glob patterns (e.g., `**/*.py`, `**/auth/**`)
- `description`: Brief rule description
- `version`: Semantic version

---

## Example Custom Rules

### 1. API Standards (`org-api-standards.instructions.md`)

Defines organization's REST API conventions:
- Response format
- Status codes
- Pagination
- Error handling

**Applies to:** TypeScript, JavaScript, Python, Java

### 2. Logging Format (`org-logging-format.instructions.md`)

Standardizes logging across services:
- Required fields (timestamp, traceId, service, etc.)
- Log levels (DEBUG, INFO, WARN, ERROR, FATAL)
- What NOT to log (passwords, PII, etc.)
- Structured logging examples

**Applies to:** TypeScript, JavaScript, Python, Java, Go

### 3. Hardcoded Credentials Override

Overrides default credentials rule with:
- Organization-approved secret managers (Azure Key Vault, HashiCorp Vault)
- Secret rotation policies
- Detection tools (TruffleHog, GitLeaks)
- Incident response procedures

**Overrides:** `codeguard-1-hardcoded-credentials`

---

## Best Practices

### ✅ DO:
- Keep rules **concise and actionable**
- Include **code examples** for clarity
- Update `version` when modifying rules
- Document organization-specific tools/contacts
- Test rules after changes (`npm test`)

### ❌ DON'T:
- Duplicate content from default rules
- Make rules too generic (defeats custom purpose)
- Hardcode secrets in examples
- Forget to update `applyTo` patterns

---

## Testing Custom Rules

```bash
# Run all tests including custom rule tests
npm test

# Build and test integration
npm run test:integration
```

Custom rule tests verify:
- ✅ Custom rules load from `rules/custom/`
- ✅ Override mechanism works correctly
- ✅ Priority boosting functions
- ✅ No rule duplication

---

## Deployment

Custom rules are **automatically loaded** when the MCP server starts:

```
[SERVER STARTING] Loading instructions from: /path/to/rules
Custom rule 'codeguard-1-hardcoded-credentials' overrides default rule
Custom rule 'org-api-standards' overrides default rule
Custom rule 'org-logging-format' overrides default rule
Loaded 23 default + 3 custom = 25 total instruction files
```

---

## Versioning & Updates

When updating custom rules:

1. **Increment version** in frontmatter
2. **Document changes** in commit message
3. **Restart MCP server** to reload rules
4. **Notify team** of important changes

Example:
```markdown
---
version: '1.1.0'  ← Updated from 1.0.0
---

# Changelog
v1.1.0 - Added GraphQL examples
v1.0.0 - Initial version
```

---

## Support

Questions about custom rules?
- Review examples in this directory
- Check [ROADMAP.md](../ROADMAP.md) for feature status  
- Run tests to verify custom rule behavior
- See [README.md](../README.md) for architecture details
