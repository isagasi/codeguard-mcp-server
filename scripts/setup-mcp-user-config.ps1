# Setup User-Level MCP Configuration
# Run this script once on each developer's machine

param(
    [string]$McpServerPath = "C:\org\codeguard-mcp\dist\index.js"
)

$userConfigDir = Join-Path $env:APPDATA "Code\User"
$mcpConfigFile = Join-Path $userConfigDir "mcp.json"

# Ensure directory exists
New-Item -ItemType Directory -Force -Path $userConfigDir | Out-Null

# Check if config already exists
if (Test-Path $mcpConfigFile) {
    Write-Host "⚠️  MCP config already exists at: $mcpConfigFile" -ForegroundColor Yellow
    $overwrite = Read-Host "Overwrite existing configuration? (y/N)"
    if ($overwrite -ne 'y' -and $overwrite -ne 'Y') {
        Write-Host "❌ Setup cancelled" -ForegroundColor Red
        exit 1
    }
}

# Verify MCP server exists
if (-not (Test-Path $McpServerPath)) {
    Write-Host "❌ MCP server not found at: $McpServerPath" -ForegroundColor Red
    Write-Host "Please ensure the CodeGuard MCP server is deployed first." -ForegroundColor Yellow
    exit 1
}

# Create MCP configuration
$mcpConfig = @{
    servers = @{
        codeguard = @{
            type = "stdio"
            command = "node"
            args = @($McpServerPath)
            autoStart = $true
        }
    }
} | ConvertTo-Json -Depth 10

# Write configuration
$mcpConfig | Out-File -FilePath $mcpConfigFile -Encoding UTF8

Write-Host "✅ MCP configuration created at: $mcpConfigFile" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Install MCP Auto-Starter extension:" -ForegroundColor White
Write-Host "   code --install-extension alankyshum.vscode-mcp-autostarter" -ForegroundColor Gray
Write-Host "2. Reload VS Code" -ForegroundColor White
Write-Host "3. Server will auto-start on VS Code launch" -ForegroundColor White
