# CodeGuard MCP Server

Security rules for AI code generation via Model Context Protocol.

## What is this?

GitHub Copilot can use `.github/instructions/` files for security rules, but this sucks for orgs:
- 22+ files duplicated in every repo
- No central control
- Pain to update

This MCP server centralizes all security rules in one place.

## Quick Start

### 1. Install Package

```bash
# Option 1: From GitHub Packages (recommended)
# Create token: https://github.com/settings/tokens (scope: read:packages)
echo "@isagasi:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_TOKEN" >> ~/.npmrc
npm install -g @isagasi/codeguard-mcp-server

# Option 2: Direct from Git (if package install fails)
npm install -g git+https://github.com/isagasi/codeguard-mcp-server.git
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

Done. Server auto-starts on next launch.

## How it Works

The server provides 24 security instruction files:
- Crypto rules (no MD5, use Argon2/bcrypt)
- Auth/authz best practices
- Input validation, SQL injection prevention
- API security, logging, container hardening
- 3 custom org rules (override defaults)

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

## Updating

Developers:
```bash
npm update -g @isagasi/codeguard-mcp-server
```

Maintainers:
```bash
npm version patch  # 1.0.0 -> 1.0.1
git push --follow-tags
# Create GitHub release
```

## Troubleshooting

**Server not starting:**

Check: `Ctrl+Shift+P` → "MCP: List Servers" → Should see `codeguard` running

**Package not found:**
```bash
npm whoami --registry=https://npm.pkg.github.com  # Re-auth if fails
```

**Wrong version:**
```bash
npm uninstall -g @isagasi/codeguard-mcp-server
npm install -g @isagasi/codeguard-mcp-server
```

## License

MIT
