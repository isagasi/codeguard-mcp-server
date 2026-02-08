# CodeGuard MCP Server

Security rules for AI code generation via Model Context Protocol.

> **Built upon [Project CodeGuard](https://github.com/project-codeguard/rules):** This MCP server integrates the comprehensive security instruction rules from Project CodeGuard, solving scaling and central governance challenges by delivering them via Model Context Protocol instead of per-repository file duplication.

## What is this?

GitHub Copilot can use `.github/instructions/` files for security rules, but this sucks for orgs:
- 22+ files duplicated in every repo
- No central control
- Pain to update

This MCP server centralizes all security rules in one place.

## Quick Start

### 1. Install Package

```bash
npm install -g @isagasi/codeguard-mcp-server
```

### 2. Configure VS Code

**Windows:**
```powershell
$config = @'
{
  "servers": {
    "codeguard": {
      "type": "stdio",
      "command": "codeguard-mcp",
      "autoStart": true
    }
  }
}
'@
$config | Out-File "$env:APPDATA\Code\User\mcp.json" -Encoding UTF8
```

**macOS/Linux:**
```bash
cat > ~/Library/Application\ Support/Code/User/mcp.json << 'EOF'
{
  "servers": {
    "codeguard": {
      "type": "stdio",
      "command": "codeguard-mcp",
      "autoStart": true
    }
  }
}
EOF
```

### 3. Install Auto-Starter

```bash
code --install-extension alankyshum.vscode-mcp-autostarter
```

### 4. Reload VS Code

Press `Ctrl+Shift+P` → "Developer: Reload Window"

### 5. Verify Setup

`Ctrl+Shift+P` → "MCP: List Servers" → Should show `codeguard` running ✅

Done! Server is now active and will auto-start with VS Code.

### 6. Sanity Test (Recommended)

Verify the MCP server is actually being invoked by Copilot:

**Test 1: Password Hashing**
```
@workspace Generate a Python function to hash a password
```

**Expected:** Copilot should generate code using `bcrypt` or `Argon2` (not MD5 or SHA1)

**Test 2: Database Query**
```
@workspace Create a PostgreSQL query function in Node.js
```

**Expected:** Code should use parameterized queries, not string concatenation

**Test 3: API Key Storage**
```
@workspace Show how to store an API key in a Python app
```

**Expected:** Should suggest environment variables (`os.getenv`), not hardcoded strings

If Copilot generates **insecure code** (MD5 passwords, SQL injection, hardcoded keys), the MCP server may not be loaded. Retry steps 4-5.

## How it Works

The server provides 23 default security instruction files + 3 custom org rules:
- Crypto rules (no MD5, use Argon2/bcrypt)
- Auth/authz best practices
- Input validation, SQL injection prevention
- API security, logging, container hardening
- Custom rules can override defaults

Copilot Chat can query these via MCP tools when generating code.

## Custom Rules

Add org-specific rules in `rules/custom/`:

```markdown
---
applyTo: '**/*.ts'
description: Company API Standards
---

# API Standards

All REST endpoints must:
- Use company error format
- Log to ELK stack
- Rate limit: 100 req/min
```

Custom rules get +25 priority and override defaults.

## Maintenance

**Update to latest version:**
```bash
npm update -g @isagasi/codeguard-mcp-server
# Then reload VS Code
```

**Publishing new versions** (Maintainers):

1. Update version: `npm version patch` (1.0.8 → 1.0.9)
2. Push tags: `git push --follow-tags`
3. [Create GitHub release](https://github.com/isagasi/codeguard-mcp-server/releases/new)
4. Workflow auto-publishes to npm ✅

## Troubleshooting

**Server not running:**
- Check: `Ctrl+Shift+P` → "MCP: List Servers"
- Should see `codeguard` with status "running"
- If not listed, verify mcp.json path and reload VS Code

**Reinstall package:**
```bash
npm uninstall -g @isagasi/codeguard-mcp-server
npm install -g @isagasi/codeguard-mcp-server
# Reload VS Code
```

## Acknowledgments

This project integrates the security instruction rules from **[Project CodeGuard](https://github.com/project-codeguard/rules)**, a comprehensive collection of security best practices for AI-assisted code generation.

The MCP server architecture solves the scaling and central governance challenges inherent in per-repository instruction files, enabling organizations to maintain a single source of truth for security standards across all projects.

## License

MIT
