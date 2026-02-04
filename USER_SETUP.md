# VS Code User-Level MCP Configuration Guide

This guide shows how to configure the CodeGuard MCP server in VS Code using user-level configuration.

## Configuration Approach

**VS Code MCP Reality:**
- ✅ **User-level** (`%APPDATA%\Roaming\Code\User\mcp.json`) - **ONLY supported method**
- ❌ **Workspace-level** (`.vscode/mcp.json`) - **Does NOT work** in VS Code

**⚠️ CRITICAL:** Each developer must configure MCP on their local machine. This configuration:
- ❌ **Cannot** be committed to Git (it's outside the repository)
- ❌ **Cannot** be automatically distributed
- ✅ **Must** be set up manually by each developer
- ✅ Points to centralized MCP server installation

**Deployment Strategy:**
- Provide setup script for developers to run once
- MCP Auto-Starter extension enables automatic startup
- Central MCP server remains single source of truth for rules

---

## Step-by-Step Setup

### Step 1: Install MCP Auto-Starter Extension (Required)

**The MCP Auto-Starter extension is REQUIRED** for the MCP server to automatically start when VS Code opens.

1. **Open Extensions Panel:**
   - Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac)
   - Or click the Extensions icon in the Activity Bar

2. **Search and Install:**
   - Search for: `MCP Auto-Starter`
   - Publisher: `alankyshum`
   - Click **Install**

OR install via command line:
```bash
code --install-extension alankyshum.vscode-mcp-autostarter
```

**Why this is required:** VS Code's built-in MCP support doesn't auto-start servers by default. This extension enables the `autoStart: true` property in your MCP configuration.

### Step 2: Verify MCP Server Location

The MCP server should be deployed to a central location accessible by all developers:

**Common locations:**
```
Windows: C:\org\codeguard-mcp\
macOS:   /opt/codeguard-mcp/
Linux:   /opt/codeguard-mcp/
```

Verify it exists and is built:
```powershell
# Windows
Test-Path "C:\org\codeguard-mcp\dist\index.js"

# macOS/Linux  
ls /opt/codeguard-mcp/dist/index.js
```

### Step 3: Create User-Level MCP Configuration

**Method 1: Automated Script (Recommended)**

Run the provided setup script:

```powershell
# From repository root
.\scripts\setup-mcp-user-config.ps1
```

This creates `%APPDATA%\Roaming\Code\User\mcp.json` with the correct configuration.

**Method 2: Manual Creation**

1. **Navigate to VS Code User directory:**
   ```powershell
   cd $env:APPDATA\Code\User
   ```

2. **Create `mcp.json`** file:

**Windows:**
```json
{
  "servers": {
    "codeguard": {
      "type": "stdio",
      "command": "node",
      "args": ["C:\\org\\codeguard-mcp\\dist\\index.js"],
      "autoStart": true
    }
  }
}
```

**macOS/Linux:**
```json
{
  "servers": {
    "codeguard": {
      "type": "stdio",
      "command": "node",
      "args": ["/opt/codeguard-mcp/dist/index.js"],
      "autoStart": true
    }
  }
}
```

3. **Save** the file (no Git commit - this file is local to your machine)

### Step 4: Reload VS Code & Verify

1. **Reload VS Code Window:**
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type: "Developer: Reload Window"
   - Press Enter

2. **Check MCP Server Status:**
   - Press `Ctrl+Shift+P` / `Cmd+Shift+P`
   - Type: "MCP: List Servers"
   - You should see `codeguard` with status "Running"
   - ✅ **With MCP Auto-Starter installed, the server starts automatically!**

3. **Verify Tools Available:**
   - Open Copilot Chat (click Copilot icon)
   - Select **Agent** mode from dropdown
   - Click the **tools icon** (wrench/hammer)
   - Verify these tools appear:
     - `get_security_instructions`
     - `validate_code_security`

---

## Configuration Options

### Basic Configuration

Minimal setup (uses default rules from MCP server installation):

```json
{
  "servers": {
    "codeguard": {
      "command": "node",
      "args": ["C:\\org\\codeguard-mcp\\dist\\index.js"],
      "autoStart": true
    }
  }
}
```

### Advanced Configuration

With custom rules directory and logging:

```json
{
  "servers": {
    "codeguard": {
      "command": "node",
      "args": ["C:\\org\\codeguard-mcp\\dist\\index.js"],
      "env": {
        "CODEGUARD_RULES_DIR": "C:\\org\\security-rules",
        "LOG_LEVEL": "debug",
        "DEBUG_MATCHING": "true"
      }
    }
  }
}
```

### Multiple MCP Servers

You can configure multiple MCP servers alongside CodeGuard:

```json
{
  "servers": {
    "codeguard": {
      "command": "node",
      "args": ["C:\\org\\codeguard-mcp\\dist\\index.js"]
    },
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}
```

---

## Using the MCP Server

### Manual Tool Invocation

**In Copilot Chat (Agent mode):**

1. **Get security instructions:**
   ```
   Use the get_security_instructions tool to check authentication requirements
   ```

2. **Validate existing code:**
   ```
   Use the validate_code_security tool to check this password hashing function:
   
   function hashPassword(password) {
     return crypto.createHash('md5').update(password).digest('hex');
   }
   ```

### Slash Commands (MCP Prompts)

Use slash commands to invoke predefined prompts:

```
/mcp.codeguard.get_security_instructions
```

### Attach Resources

Add security rules as context:

1. In Chat, click **Add Context** (+ icon)
2. Select **MCP Resources**
3. Choose from:
   - `codeguard://instructions/all` - All applicable rules
   - `codeguard://instructions/python` - Python-specific rules
   - `codeguard://instructions/javascript` - JavaScript rules
   - `codeguard://instructions/file?path=auth.ts` - Rules for specific file

---

## Troubleshooting

### Server Not Starting

**Check the path is correct:**
```powershell
# Verify the file exists
Test-Path "C:\org\codeguard-mcp\dist\index.js"

# Try running manually
node "C:\org\codeguard-mcp\dist\index.js"
```

**Common issues:**
- ❌ Path has single backslashes (use `\\` in JSON on Windows)
- ❌ Node.js not installed or not in PATH
- ❌ Missing dependencies (run `npm install` in MCP server directory)
- ❌ Syntax error in mcp.json (check for missing commas, brackets)

### Server Shows "Error" Status

**View logs:**
1. Open Output panel: `View` → `Output`
2. Select **Model Context Protocol** from dropdown
3. Look for error messages

**Common errors:**
```
Error: Cannot find module 'X'
→ Solution: Run npm install in MCP server directory

Error: ENOENT: no such file or directory
→ Solution: Check CODEGUARD_RULES_DIR path is correct

Error: Permission denied
→ Solution: Ensure you have read permissions on MCP server files
```

### Tools Not Appearing

**Verify:**
1. Server is running: `MCP: List Servers` → "Running"
2. You're in Agent mode (not just Chat)
3. Reload window: `Developer: Reload Window`

**Force refresh tools:**
```
1. Ctrl+Shift+P → "MCP: List Servers"
2. Click "Restart" next to codeguard server
3. Wait for "Running" status
4. Tools should now appear
```

### JSON Syntax Errors

**JSON is very strict about syntax:**

❌ **Wrong:**
```json
{
  "servers": {
    "codeguard": {
      "command": "node"
      "args": ["C:\path\to\file.js"]
    }
  }
}
```

✅ **Correct:**
```json
{
  "servers": {
    "codeguard": {
      "command": "node",
      "args": ["C:\\path\\to\\file.js"]
    }
  }
}
```

**Use VS Code's JSON validator:**
- VS Code will show red underlines for syntax errors
- Hover over the error to see what's wrong
- Missing commas and single backslashes are most common mistakes

---

## Updating the MCP Server

When your organization updates the CodeGuard MCP server:

```powershell from central location
cd C:\org\codeguard-mcp
git pull

# Rebuild (if code changed)
npm run build

# Restart VS Code or reload window
# Ctrl+Shift+P → "Developer: Reload Window"
```

Your `.vscode/mcp.json` configuration remains unchanged - it points to the same location, which now has the updated code.

---

## Uninstalling

To remove the CodeGuard MCP server from a repository:

1. **Delete `.vscode/mcp.json`:**
   ```powershell
   Remove-Item .vscode/mcp.json
   ```

2. **Reload VS Code:**
   - `Ctrl+Shift+P` → "Developer: Reload Window"

3. **Verify removal:**
   - `MCP: List Servers` should not show `codeguard`

---

## Organization-Specific Setup

Your organization may have specific requirements:

### Network Proxy

If behind a corporate proxy:

```json
{
  "servers": {
    "codeguard": {
      "command": "node",
      "args": ["C:\\org\\codeguard-mcp\\dist\\index.js"],
      "env": {
        "HTTP_PROXY": "http://proxy.company.com:8080",
        "HTTPS_PROXY": "http://proxy.company.com:8080"
      }
    }
  }
}
```

### Custom Rules Repository

If your organization maintains custom rules separately:

```json
{
  "servers": {
    "codeguard": {
      "command": "node",
      "args": ["C:\\org\\codeguard-mcp\\dist\\index.js"],
      "env": {
        "CODEGUARD_RULES_DIR": "C:\\org\\security-policies\\codeguard-rules"
      }
    }
  }
}
```

### VPN/Remote Access

If MCP server is on a network share:

```json
{
  "servers": {
    "codeguard": {
      "command": "node",
      "args": ["\\\\fileserver\\shared\\codeguard-mcp\\dist\\index.js"]
    }
  }
}
```

---

## Best Practices

1. **Commit `.vscode/mcp.json` to Git** - Share configuration with team
2. **Use consistent MCP server path** - Follow organization's standard location
3. **Update regularly** - Pull latest rules from organization's repository
4. **Test after updates** - Verify tools work after MCP server updatesion
4. **Update regularly** - Pull latest rules from organization's repository
5. **Report issues** - Contact security team if tools aren't working

---

## Getting Help

**MCP Server Status:**
```powershell
# Check server is running
# Ctrl+Shift+P → "MCP: List Servers"
```

**View Logs:**
```powershell
# Open Output panel
# View → Output → "Model Context Protocol"
```

**Contact:**
- **Security Team:** security@your-org.com
- **IT Support:** help@your-org.com
- **GitHub Issues:** https://github.com/your-org/contextpilot-server/issues

---

**Last Updated:** February 3, 2026
