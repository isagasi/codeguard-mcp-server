# Organizational Hosting Options for CodeGuard MCP Server

## Overview

The MCP server must be accessible to all developers. Choose the deployment method that fits your infrastructure.

---

## Option 1: Local Installation (Recommended)

Deploy the MCP server to a standard location on each developer's machine.

### Windows
```powershell
# Standard location
C:\org\codeguard-mcp\

# Installation script (run via Group Policy or Intune)
$installPath = "C:\org\codeguard-mcp"
git clone https://github.com/your-org/codeguard-mcp-server.git $installPath
cd $installPath
npm install --production
npm run build
```

### macOS/Linux
```bash
# Standard location
/opt/codeguard-mcp/

# Installation script
sudo mkdir -p /opt/codeguard-mcp
sudo git clone https://github.com/your-org/codeguard-mcp-server.git /opt/codeguard-mcp
cd /opt/codeguard-mcp
sudo npm install --production
sudo npm run build
sudo chmod -R 755 /opt/codeguard-mcp
```

**Pros:**
- ✅ Fast (no network latency)
- ✅ Works offline
- ✅ No network dependencies

**Cons:**
- ❌ Must install on every machine
- ❌ Updates require redeployment

**User config:**
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

---

## Option 2: Network Share (Windows Only)

Deploy once to a network file share accessible by all developers.

### Setup
```powershell
# Deploy to network share
\\fileserver\shared\codeguard-mcp\

# One-time deployment
git clone https://github.com/your-org/codeguard-mcp-server.git \\fileserver\shared\codeguard-mcp
cd \\fileserver\shared\codeguard-mcp
npm install --production
npm run build
```

**Pros:**
- ✅ Single deployment location
- ✅ Easy updates (change once, applies to all)
- ✅ Centralized management

**Cons:**
- ❌ Requires network connectivity
- ❌ Slower startup (network I/O)
- ❌ VPN required for remote workers
- ❌ Windows-only

**User config:**
```json
{
  "servers": {
    "codeguard": {
      "type": "stdio",
      "command": "node",
      "args": ["\\\\fileserver\\shared\\codeguard-mcp\\dist\\index.js"],
      "autoStart": true
    }
  }
}
```

---

## Option 3: npm Package (Best for Scale)

Publish the MCP server as an internal npm package.

### Setup

1. **Publish to internal npm registry:**

```json
// package.json
{
  "name": "@your-org/codeguard-mcp-server",
  "version": "1.0.0",
  "bin": {
    "codeguard-mcp": "./dist/index.js"
  },
  "publishConfig": {
    "registry": "https://npm.your-org.com"
  }
}
```

```bash
npm publish
```

2. **Developers install globally:**

```bash
npm install -g @your-org/codeguard-mcp-server
```

3. **User config:**

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

**Pros:**
- ✅ Standard npm tooling
- ✅ Easy updates (`npm update -g @your-org/codeguard-mcp-server`)
- ✅ Version management
- ✅ Works cross-platform

**Cons:**
- ❌ Requires internal npm registry
- ❌ Developers must install/update manually

---

## Option 4: npx (Public npm Package)

Publish to public npm and use npx for zero-install usage.

### Setup

```bash
# Publish to public npm
npm publish --access public
```

**User config:**
```json
{
  "servers": {
    "codeguard": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@your-org/codeguard-mcp-server"],
      "autoStart": true
    }
  }
}
```

**Pros:**
- ✅ No installation required
- ✅ Always latest version
- ✅ Zero maintenance for developers

**Cons:**
- ❌ Slower first start (downloads package)
- ❌ Requires internet connectivity
- ❌ Security rules exposed publicly

---

## Option 5: Docker Container (Advanced)

Run the MCP server in a container.

### Setup

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

```bash
docker build -t codeguard-mcp:latest .
docker run --rm -i codeguard-mcp:latest
```

**User config:**
```json
{
  "servers": {
    "codeguard": {
      "type": "stdio",
      "command": "docker",
      "args": ["run", "--rm", "-i", "codeguard-mcp:latest"],
      "autoStart": true
    }
  }
}
```

**Pros:**
- ✅ Isolated environment
- ✅ Reproducible builds
- ✅ Easy CI/CD integration

**Cons:**
- ❌ Requires Docker installed
- ❌ Slower startup
- ❌ Complex for simple use case

---

## Recommended Approach by Organization Size

### Small Teams (< 20 developers)
**→ Option 1: Local Installation**
- Simple deployment script
- Fast and reliable
- Easy troubleshooting

### Medium Organizations (20-200 developers)
**→ Option 3: Internal npm Package**
- Centralized version management
- Standard developer workflow
- Easy updates via `npm update`

### Large Enterprises (> 200 developers)
**→ Option 1 + Software Deployment Tool**
- Deploy via SCCM, Intune, or Jamf
- Automated installation
- Centralized monitoring

---

## Update Strategy

### Local Installation
```powershell
# Update script (run periodically via scheduled task)
cd C:\org\codeguard-mcp
git pull
npm install --production
npm run build
```

### npm Package
```bash
# Developers update manually
npm update -g @your-org/codeguard-mcp-server

# Or use npx (always latest)
# No update needed - npx fetches latest automatically
```

### Automated Updates (Enterprise)
- Use software deployment tools
- Schedule periodic updates
- Notify developers of security rule changes

---

## Security Considerations

- **Network Share**: Ensure proper ACLs, read-only access for developers
- **npm Package**: Use internal registry for proprietary rules
- **Local Installation**: Protect installation directory from tampering
- **All Options**: Use code signing for distributed executables

---

## Next Steps

1. Choose deployment method based on organization size
2. Update `scripts/setup-mcp-user-config.ps1` with chosen path
3. Document in internal wiki/onboarding materials
4. Test with pilot group before organization-wide rollout
