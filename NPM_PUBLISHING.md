# Publishing CodeGuard MCP Server as npm Package

This guide explains how to publish and use the CodeGuard MCP server as an internal npm package.

## Prerequisites

- Internal npm registry (Verdaccio, Artifactory, Azure Artifacts, etc.)
- npm configured to authenticate with your registry
- Node.js 18+ installed

---

## Step 1: Configure npm Registry

### Option A: Azure Artifacts (Microsoft)

```bash
# Install vsts-npm-auth for authentication
npm install -g vsts-npm-auth

# Configure registry
npm config set registry https://pkgs.dev.azure.com/your-org/_packaging/your-feed/npm/registry/

# Authenticate
vsts-npm-auth -config .npmrc
```

### Option B: GitHub Packages

```bash
# Configure registry for scoped packages
npm config set @your-org:registry https://npm.pkg.github.com

# Authenticate (use Personal Access Token)
npm login --scope=@your-org --registry=https://npm.pkg.github.com
```

### Option C: Verdaccio (Self-hosted)

```bash
# Configure registry
npm config set registry http://npm.your-org.com

# Authenticate
npm adduser --registry http://npm.your-org.com
```

---

## Step 2: Update package.json

The package.json has already been updated with:

```json
{
  "name": "@your-org/codeguard-mcp-server",
  "bin": {
    "codeguard-mcp": "./dist/index.js"
  },
  "files": ["dist", "rules", "README.md"],
  "publishConfig": {
    "registry": "https://npm.your-org.com",
    "access": "restricted"
  }
}
```

**Update:**
- Replace `@your-org` with your actual organization scope
- Replace `https://npm.your-org.com` with your registry URL

---

## Step 3: Build and Publish

```bash
# Ensure you're in the project root
cd C:\repo\contextpilot-server

# Build the project
npm run build

# Verify build succeeded
ls dist/index.js

# Publish to internal registry
npm publish

# Verify publication
npm view @your-org/codeguard-mcp-server
```

### Publishing Updates

```bash
# Bump version
npm version patch  # 1.0.0 -> 1.0.1
# or
npm version minor  # 1.0.0 -> 1.1.0
# or
npm version major  # 1.0.0 -> 2.0.0

# Build and publish
npm run build
npm publish
```

---

## Step 4: Developer Installation

### One-Time Setup

Each developer installs the package globally:

```bash
# Install globally
npm install -g @your-org/codeguard-mcp-server

# Verify installation
codeguard-mcp --version
which codeguard-mcp  # Should show global npm bin path
```

### Configure MCP

Run the setup script:

```powershell
# Uses npm package by default
.\scripts\setup-mcp-user-config.ps1
```

This creates `%APPDATA%\Roaming\Code\User\mcp.json`:

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

### Install MCP Auto-Starter Extension

```bash
code --install-extension alankyshum.vscode-mcp-autostarter
```

### Reload VS Code

The CodeGuard MCP server will auto-start on next VS Code launch!

---

## Step 5: Updating

Developers can update to the latest version:

```bash
# Update to latest
npm update -g @your-org/codeguard-mcp-server

# Or reinstall specific version
npm install -g @your-org/codeguard-mcp-server@1.2.0
```

**No MCP config changes needed** - the `codeguard-mcp` command automatically uses the latest installed version.

---

## Automated Deployment

### Option 1: Installation Script

```powershell
# deploy-codeguard.ps1
# Run via Group Policy, Intune, or onboarding script

# Install/update package
npm install -g @your-org/codeguard-mcp-server

# Configure MCP
$userConfigDir = Join-Path $env:APPDATA "Code\User"
New-Item -ItemType Directory -Force -Path $userConfigDir | Out-Null

$mcpConfig = @{
    servers = @{
        codeguard = @{
            type = "stdio"
            command = "codeguard-mcp"
            autoStart = $true
        }
    }
} | ConvertTo-Json -Depth 10

$mcpConfig | Out-File -FilePath (Join-Path $userConfigDir "mcp.json") -Encoding UTF8

# Install extension
code --install-extension alankyshum.vscode-mcp-autostarter

Write-Host "✅ CodeGuard MCP Server deployed successfully"
```

### Option 2: Package.json in Developer Tools

Include in your organization's developer setup package:

```json
{
  "name": "@your-org/dev-tools",
  "dependencies": {
    "@your-org/codeguard-mcp-server": "^1.0.0"
  },
  "scripts": {
    "setup": "node scripts/setup-codeguard.js"
  }
}
```

---

## CI/CD Integration

### Automated Publishing

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://npm.your-org.com'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Publish
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Troubleshooting

### Package not found

```bash
# Verify registry configuration
npm config get registry
npm config get @your-org:registry

# Try explicit registry
npm install -g @your-org/codeguard-mcp-server --registry=https://npm.your-org.com
```

### Permission denied

```bash
# Check authentication
npm whoami --registry=https://npm.your-org.com

# Re-authenticate
npm login --registry=https://npm.your-org.com
```

### Command not found: codeguard-mcp

```bash
# Check npm global bin directory
npm config get prefix

# Add to PATH (Windows)
$env:PATH += ";$(npm config get prefix)"

# Verify
which codeguard-mcp
```

### Wrong version running

```bash
# Check installed version
npm list -g @your-org/codeguard-mcp-server

# Force reinstall
npm uninstall -g @your-org/codeguard-mcp-server
npm install -g @your-org/codeguard-mcp-server
```

---

## Version Management

### Semantic Versioning

- **Patch (1.0.x)**: Bug fixes, rule updates
- **Minor (1.x.0)**: New rules, backward-compatible changes
- **Major (x.0.0)**: Breaking changes, removal of deprecated rules

### Recommended Update Policy

```json
// Allow patch updates automatically
"@your-org/codeguard-mcp-server": "~1.0.0"

// Allow minor updates automatically
"@your-org/codeguard-mcp-server": "^1.0.0"

// Pin to specific version
"@your-org/codeguard-mcp-server": "1.0.0"
```

---

## Security Considerations

- Use **restricted access** (`"access": "restricted"` in publishConfig)
- Enable **two-factor authentication** for npm registry
- Use **scoped packages** (`@your-org/`) to avoid naming conflicts
- Implement **code signing** for published packages
- Configure **registry audit** policies

---

## Cost Considerations

### Registries by Organization Size

| Registry | Best For | Cost |
|----------|----------|------|
| **Verdaccio** | Self-hosted, any size | Free (infrastructure only) |
| **Azure Artifacts** | Microsoft shops | Free tier: 2GB, Paid: $4/user/month |
| **GitHub Packages** | GitHub Enterprise | Included with Enterprise |
| **Artifactory** | Large enterprises | ~$150-500/month |

---

## Next Steps

1. ✅ Set up internal npm registry (if not already done)
2. ✅ Update package.json with your organization scope
3. ✅ Build and publish first version
4. ✅ Test installation on pilot machine
5. ✅ Roll out to development team
6. ✅ Document in internal developer portal
