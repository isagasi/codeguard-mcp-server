# CodeGuard MCP Server - Deployment Guide

This guide explains how to deploy the CodeGuard MCP server in your organization to enforce security rules across all AI-assisted code generation.

## Table of Contents

- [Deployment Models](#deployment-models)
- [Hybrid Approach (Recommended)](#hybrid-approach-recommended)
- [Installation & Configuration](#installation--configuration)
- [Limitations & Workarounds](#limitations--workarounds)
- [Migration from Repository Instructions](#migration-from-repository-instructions)
- [Troubleshooting](#troubleshooting)

---

## Deployment Models

### Option 1: Repository Instructions (Not Recommended)

**Pros:**
- ✅ Automatic enforcement in all IDEs (VS Code, JetBrains, etc.)
- ✅ Works with inline completions and chat
- ✅ No configuration required by developers

**Cons:**
- ❌ **Vulnerable to tampering**: Developers can modify `.github/instructions/` files locally
- ❌ **File duplication**: Must copy 22+ instruction files to every repository
- ❌ **Maintenance nightmare**: Updates require changes across all repos
- ❌ **No central control**: Each repo can diverge from security standards

### Option 2: MCP Server Only (Recommended for VS Code)

**Pros:**
- ✅ Centralized security rules (single source of truth)
- ✅ Easy updates (change once, applies everywhere)
- ✅ Custom organization rules with override capability
- ✅ One small file per repo (vs 22+ instruction files)

**Cons:**
- ❌ **Not automatic**: Requires explicit tool invocation in Agent mode
- ❌ **Only works in Chat**: No support for inline completions
- ⚠️ **VS Code**: Requires `.vscode/mcp.json` in each repository (workspace-level only)

### Option 3: MCP + Organization Instructions (✅ RECOMMENDED)

Combines MCP server + organization instructions to achieve:
- ✅ **Central control**: Security rules managed in one place
- ✅ **Version controlled**: `.vscode/mcp.json` committed to repos
- ✅ **Enforcement mandate**: Organization instructions require tool usage
- ✅ **Easy rollout**: Just commit 1 file per repo (vs 22+ instruction files)

**Limitations:**
- ⚠️ **Non-deterministic**: Copilot may not always follow organization instructions
- ⚠️ **GitHub.com only**: Organization instructions only work in GitHub.com Copilot (not VS Code IDE)
- ⚠️ **Workspace-level**: Each repo needs `.vscode/mcp.json` (but can be templated)

---

## MCP + Organization Instructions (Recommended)

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  GitHub Enterprise Organization Settings                │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Organization Custom Instructions                  │  │
│  │ "MUST use @codeguard tool for security code..."  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
                    (Mandates tool usage)
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Git Repository (all repos)                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │ .vscode/mcp.json (Workspace-level)                │  │
│  │ {                                                 │  │
│  │   "servers": {                                   │  │
│  │     "codeguard": {                               │  │
│  │       "command": "node",                        │  │
│  │       "args": ["C:\\...\\dist\\index.js"]      │  │
│  │     }                                            │  │
│  │   }                                              │  │
│  │ }                                                │  │
│  └───────────────────────────────────────────────────┘  │
│                    ↓                                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │ CodeGuard MCP Server (Centralized)                │  │
│  │ - Deployed to C:\org\codeguard-mcp                │  │
│  │ - Loads security rules from central location      │  │
│  │ - Returns applicable rules via tools/resources    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Step-by-Step Setup

#### 1. Deploy MCP Server (One Time, Central)

```powershell
# Clone the CodeGuard MCP server to a shared/central location
git clone https://github.com/your-org/contextpilot-server.git C:\org\codeguard-mcp

# Install dependencies and build
cd C:\org\codeguard-mcp
npm install
npm run build
```

#### 2. Configure Organization Instructions (GitHub Enterprise Admins)

1. Navigate to your GitHub Enterprise Organization Settings
2. Go to **Copilot** → **Policies and Features**
3. Enable **Custom Instructions**
4. Copy the content from `.github/copilot-instructions.md` in this repository
5. Paste into **Organization Custom Instructions** field
6. Save changes

**Note**: Organization instructions only work on GitHub.com (Copilot Chat, Review, Agent), not in VS Code IDE.

#### 3. Add `.vscode/mcp.json` to Repositories

**Create in EACH repository:**

```powershell
# In your repository root
mkdir .vscode -Force

# Create mcp.json
@'
{
  "servers": {
    "codeguard": {
      "command": "node",
      "args": ["C:\\org\\codeguard-mcp\\dist\\index.js"],
      "autoStart": true
    }
  }
}
'@ | Out-File .vscode/mcp.json -Encoding UTF8

# Commit to repository
git add .vscode/mcp.json
git commit -m "Add CodeGuard MCP server configuration"
git push
```

**macOS/Linux:**
```bash
mkdir -p .vscode
cat > .vscode/mcp.json <<EOF
{
  "servers": {
    "codeguard": {
      "command": "node",
      "args": ["/opt/codeguard-mcp/dist/index.js"],
      "autoStart": true
    }
  }
}
EOF
git add .vscode/mcp.json
git commit -m "Add CodeGuard MCP server configuration"
git push
```

#### 4. Verify Installation

**In VS Code:**
1. Open Command Palette: `Ctrl+Shift+P` (Windows) / `Cmd+Shift+P` (Mac)
2. Run: `MCP: List Servers`
3. Verify `codeguard` server appears and status is "Running"

**In Copilot Chat:**
1. Open Copilot Chat
2. Select **Agent** mode from dropdown
3. Click **Configure Tools** (tools icon)
4. Verify `get_security_instructions` and `validate_code_security` tools are available

#### 5. Test Security Enforcement

**Ask Copilot in Agent mode:**
```
Create a user authentication endpoint with password hashing
```

**Expected behavior:**
- Copilot should mention using the security tool
- It should call `get_security_instructions` automatically
- Generated code should follow security best practices (bcrypt, no MD5, etc.)

**If Copilot doesn't use the tool:**
- Explicitly request it: "Use the get_security_instructions tool first"
- This demonstrates the non-deterministic limitation

---

## Installation & Configuration

### Custom Organization Rules

Add organization-specific security rules in `rules/custom/`:

```markdown
---
applyTo: '**/*.ts,**/*.js'
description: Organization API Standards
priority: high
version: 1.0.0
---

# Organization API Security Standards

All REST APIs must:
- Use Azure API Management for external endpoints
- Implement OAuth 2.0 with Azure AD
- Use Azure Key Vault for secrets
...
```

Custom rules get a **+25 priority boost** and can override default CodeGuard rules.

### Environment Variables

Configure via environment in settings.json:

```jsonc
{
  "chat.mcp.servers": {
    "codeguard": {
      "command": "node",
      "args": ["C:\\org\\codeguard-mcp\\dist\\index.js"],
      "env": {
        // Custom rules directory
        "CODEGUARD_RULES_DIR": "C:\\org\\custom-security-rules",
        
        // Logging level (debug, info, warn, error)
        "LOG_LEVEL": "info",
        
        // Enable detailed matching logs
        "DEBUG_MATCHING": "false"
      }
    }
  }
}
```

### Updating Security Rules

**Centralized Updates:**
```powershell
# Pull latest rules from central repository
cd C:\org\codeguard-mcp
git pull

# Rebuild if code changed
npm run build

# Restart VS Code or reload MCP server
# In VS Code: Ctrl+Shift+P → "Developer: Reload Window"
```

All developers automatically get updated rules on next server restart.

---

## Limitations & Workarounds

### Limitation 1: Non-Deterministic Enforcement

**Problem:** Copilot may not always follow organization instructions to use security tools.

**Workarounds:**
1. **Manual verification**: Review generated code for security issues
2. **Explicit requests**: Ask "Use the get_security_instructions tool first"
3. **Code review gates**: Require security review before merge
4. **Static analysis**: Use SAST tools (SonarQube, Snyk) in CI/CD

**Example:**
```
# Instead of:
"Create a login endpoint"

# Say:
"Before creating the login endpoint, use get_security_instructions 
tool to check authentication security requirements, then implement."
```

### Limitation 2: Organization Instructions Only Work on GitHub.com

**Problem:** Organization custom instructions only apply to GitHub.com Copilot features (Chat, Review, Agent), not VS Code IDE.

**Workarounds:**
1. **Repository instructions as fallback**: Add `.github/instructions/codeguard-reminder.md` in each repo:
   ```markdown
   # Security Reminder
   
   For security-critical code, consult the @codeguard MCP server:
   - Use get_security_instructions tool
   - Or attach resources: codeguard://instructions/all
   ```

2. **Developer training**: Educate team on manual tool invocation
3. **Slash commands**: Use `/mcp.codeguard.get_security_instructions` in Chat

### Limitation 3: Requires User-Level Configuration

**Problem:** Each developer must manually configure settings.json.

**Workarounds:**
1. **Onboarding script**: Automate settings.json modification
   ```powershell
   # onboard-codeguard.ps1
   $settingsPath = "$env:APPDATA\Code\User\settings.json"
   # ... script to merge MCP config into settings.json
   ```

2. **Documentation**: Provide clear setup instructions in wiki/README
3. **Configuration management**: Use GPO (Windows) or MDM to deploy settings

### Limitation 4: No Support for Inline Completions

**Problem:** MCP tools only work in Chat/Agent mode, not inline tab-completions.

**Workarounds:**
- Repository instructions still work for inline completions (with tampering risk)
- Train developers to use Agent mode for security-critical code
- Combine MCP (for Chat) + repository instructions (for inline)

---

## Migration from Repository Instructions

If you're currently using `.github/instructions/` files in repositories:

### Migration Strategy

**Phase 1: Parallel Operation** (Recommended for 2-4 weeks)
- Keep existing repository instructions
- Deploy MCP server to user settings
- Add organization instructions
- Monitor compliance and gather feedback

**Phase 2: Gradual Removal**
- Remove repository instruction files from low-risk repos
- Keep critical repos with both approaches
- Monitor for any security regression

**Phase 3: Full Migration**
- Remove all repository instruction files
- Rely solely on MCP + organization instructions
- Document known limitations

### Comparison

| Feature | Repository Instructions | MCP Hybrid Approach |
|---------|------------------------|---------------------|
| Automatic enforcement | ✅ Yes | ⚠️ Non-deterministic |
| Tamper-proof | ❌ No | ✅ Yes |
| Central management | ❌ No | ✅ Yes |
| Easy updates | ❌ No | ✅ Yes |
| Inline completions | ✅ Yes | ❌ No (repo fallback needed) |
| Works in all IDEs | ✅ Yes | ⚠️ VS Code only |

---

## Troubleshooting

### MCP Server Not Showing in List

**Check:**
```powershell
# 1. Verify settings.json is correct
code $env:APPDATA\Code\User\settings.json

# 2. Check MCP server can start manually
node C:\org\codeguard-mcp\dist\index.js

# 3. Check VS Code MCP logs
# Open: Output panel → "Model Context Protocol"
```

**Common issues:**
- Incorrect path to `dist/index.js`
- Missing dependencies (run `npm install`)
- Node.js not in PATH
- Syntax error in settings.json

### Tools Not Available in Agent Mode

**Verify:**
1. MCP server is running: `MCP: List Servers` shows "Running"
2. Tools are enabled: Click tools icon in Chat → verify both tools checked
3. Agent mode selected: Dropdown must show "Agent" not "Chat"

### Security Instructions Not Loading

**Debug:**
```powershell
# Run server with debug logging
$env:LOG_LEVEL="debug"
$env:DEBUG_MATCHING="true"
node C:\org\codeguard-mcp\dist\index.js
```

Check logs for:
- Rules loading errors
- File path issues
- Matching logic problems

### Copilot Not Using Tools Automatically

**This is expected** - see Limitation 1 above. Workarounds:
- Explicitly request tool usage in your prompt
- Use organization instructions to mandate it (non-deterministic)
- Manually invoke via slash command: `/mcp.codeguard.get_security_instructions`

---

## Future Enhancements

When GitHub Copilot adds **automatic MCP prompt injection** support:
- ✅ MCP prompts will be automatically included in every request
- ✅ No organization instructions needed for enforcement
- ✅ True automatic enforcement achieved
- ✅ Current MCP server is forward-compatible (prompts already implemented)

**Current status**: No timeline announced by GitHub/Microsoft for this feature.

---

## Support & Feedback

**Issues:** [GitHub Issues](https://github.com/your-org/contextpilot-server/issues)
**Documentation:** See [README.md](./README.md) and [USAGE.md](./USAGE.md)
**Security Team:** security-engineering@your-org.com

**Last Updated:** February 3, 2026
