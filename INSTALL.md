# Setup for Developers

## Install

### 1. Get GitHub Token

https://github.com/settings/tokens → Generate token (classic) → Scopes: `read:packages`

### 2. Configure npm

**Windows:**
```powershell
@"
@isagasi:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_TOKEN
"@ | Out-File "$env:USERPROFILE\.npmrc" -Append
```

**macOS/Linux:**
```bash
cat >> ~/.npmrc << 'EOF'
@isagasi:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_TOKEN
EOF
```

### 3. Install Package

```bash
# From GitHub Packages
npm install -g @isagasi/codeguard-mcp-server

# Or direct from Git (if above fails)
npm install -g git+https://github.com/isagasi/codeguard-mcp-server.git

# Verify
codeguard-mcp --version
```

### 4. Configure MCP

Create MCP config file:

**Windows:** `%APPDATA%\Roaming\Code\User\mcp.json`
**macOS:** `~/Library/Application Support/Code/User/mcp.json`

```json
{
  "servers": {
    "codeguard": {
      "type": "stdio",
      "command": "codeguard-mcp",
      "autoStart": true
    }
  }
}
```

**Or use setup script:**
```powershell
git clone https://github.com/isagasi/codeguard-mcp-server
cd codeguard-mcp-server
.\scripts\setup-mcp-user-config.ps1
```

### 5. Install Auto-Starter

```bash
code --install-extension alankyshum.vscode-mcp-autostarter
```

### 6. Reload VS Code

`Ctrl+Shift+P` → "Developer: Reload Window"

Wait 5-10 seconds. Done.

## Verify

`Ctrl+Shift+P` → "MCP: List Servers" → Should show `codeguard` running ✅

## Update

```bash
npm update -g @isagasi/codeguard-mcp-server
```

Reload VS Code.
