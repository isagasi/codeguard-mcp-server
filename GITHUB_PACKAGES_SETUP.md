# GitHub Packages Setup for Developers

This guide shows developers how to install and use the CodeGuard MCP server from GitHub Packages.

## One-Time Setup

### Step 1: Create GitHub Personal Access Token (PAT)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **Generate new token (classic)**
3. Give it a name: "CodeGuard MCP Package Access"
4. Select scopes:
   - ✅ `read:packages` - Download packages from GitHub Packages
5. Click **Generate token**
6. **Copy the token** - you won't see it again!

### Step 2: Configure npm to use GitHub Packages

**Windows:**
```powershell
# Create or edit .npmrc in your home directory
$npmrcPath = Join-Path $env:USERPROFILE ".npmrc"

# Add GitHub Packages configuration
@"
@suren2787:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN_HERE
"@ | Out-File -FilePath $npmrcPath -Append -Encoding UTF8

# Replace YOUR_GITHUB_TOKEN_HERE with your actual token
```

**macOS/Linux:**
```bash
# Add to ~/.npmrc
echo "@suren2787:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN_HERE" >> ~/.npmrc

# Replace YOUR_GITHUB_TOKEN_HERE with your actual token
```

### Step 3: Install the Package

```bash
# Install globally
npm install -g @suren2787/codeguard-mcp-server

# Verify installation
codeguard-mcp --version
which codeguard-mcp
```

### Step 4: Configure MCP

Run the setup script:

```powershell
# Clone the repository (if you haven't already)
git clone https://github.com/suren2787/codeguard-mcp-server.git
cd codeguard-mcp-server

# Run setup script (uses npm package by default)
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

### Step 5: Install MCP Auto-Starter Extension

```bash
code --install-extension alankyshum.vscode-mcp-autostarter
```

### Step 6: Reload VS Code

1. Press `Ctrl+Shift+P`
2. Type "Developer: Reload Window"
3. Wait 5-10 seconds
4. Press `Ctrl+Shift+P` → "MCP: List Servers"
5. Verify `codeguard` is running ✅

---

## Updating

When a new version is released:

```bash
# Update to latest version
npm update -g @suren2787/codeguard-mcp-server

# Or install specific version
npm install -g @suren2787/codeguard-mcp-server@1.2.0

# Verify version
codeguard-mcp --version
```

**No MCP config changes needed!** The `codeguard-mcp` command automatically uses the latest installed version.

---

## Troubleshooting

### Error: 404 Not Found

**Cause:** Not authenticated or package doesn't exist

**Solution:**
```bash
# Verify authentication
npm whoami --registry=https://npm.pkg.github.com

# If not logged in, check your .npmrc file
cat ~/.npmrc  # macOS/Linux
type $env:USERPROFILE\.npmrc  # Windows

# Ensure you have the correct token
```

### Error: EPERM or Permission Denied

**Windows:** Run PowerShell as Administrator

**macOS/Linux:**
```bash
# Don't use sudo with npm global installs
# Instead, configure npm to use a user directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Now install without sudo
npm install -g @suren2787/codeguard-mcp-server
```

### Package not found after installation

**Windows:**
```powershell
# Check npm global bin directory
npm config get prefix

# Add to PATH
$globalBin = "$(npm config get prefix)"
[Environment]::SetEnvironmentVariable("Path", "$env:Path;$globalBin", "User")

# Restart terminal and try again
```

**macOS/Linux:**
```bash
# Add npm global bin to PATH
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

---

## For Repository Maintainers

### Publishing a New Version

#### Manual Publishing

```bash
# 1. Bump version
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# 2. Build
npm run build

# 3. Publish (uses GITHUB_TOKEN from your .npmrc)
npm publish

# 4. Create GitHub release
git push --tags
# Then create release on GitHub UI
```

#### Automated Publishing (Recommended)

The repository includes a GitHub Actions workflow that automatically publishes when you create a GitHub release:

1. **Create a new release on GitHub:**
   - Go to Releases → "Draft a new release"
   - Choose a tag (e.g., `v1.0.1`)
   - Title: "v1.0.1"
   - Describe changes
   - Click "Publish release"

2. **GitHub Actions automatically:**
   - Runs tests
   - Builds the project
   - Publishes to GitHub Packages
   - Creates a summary

### Setting Up GitHub Actions

The workflow file is already created at `.github/workflows/publish.yml`.

**No additional secrets needed!** The workflow uses the automatic `GITHUB_TOKEN` provided by GitHub Actions.

---

## Security Best Practices

1. **Never commit your PAT** to version control
2. **Use `.npmrc` in home directory** - not in the project
3. **Set PAT expiration** to 90 days maximum
4. **Use minimal scopes** - only `read:packages` for developers
5. **Rotate tokens regularly** following your security policy

---

## Cost

GitHub Packages is **free** for public repositories and includes:
- Unlimited storage
- Unlimited bandwidth
- Unlimited package downloads

For private repositories (if you make the repo private later):
- 500MB storage free
- 1GB bandwidth/month free
- Additional usage: $0.25/GB storage, $0.50/GB bandwidth

---

## Next Steps

✅ Configure your GitHub PAT  
✅ Update your ~/.npmrc  
✅ Install the package globally  
✅ Run the setup script  
✅ Install MCP Auto-Starter extension  
✅ Reload VS Code  
✅ Verify server is running  

**Need help?** Open an issue at: https://github.com/suren2787/codeguard-mcp-server/issues
