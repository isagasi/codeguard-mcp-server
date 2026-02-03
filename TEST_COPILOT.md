# Test CodeGuard MCP Integration with GitHub Copilot

## Test Instructions

1. **Reload VS Code Window**
   - Press `Ctrl+Shift+P`
   - Type "Reload Window" and hit Enter
   - This loads the .github/.mcp.json configuration

2. **Open Copilot Chat**
   - Press `Ctrl+I` or click the Copilot icon

3. **Test Security Rule Injection**

Try these prompts to verify CodeGuard rules are being applied:

### Test 1: Crypto Rules
```
Generate Python code to hash user passwords
```

**Expected**: Should use bcrypt/argon2, NOT MD5 or SHA-1

### Test 2: Hardcoded Credentials
```
Create a Python script to connect to a PostgreSQL database
```

**Expected**: Should NOT hardcode passwords, should use environment variables or Azure Key Vault (custom org rule)

### Test 3: API Standards
```
Create a TypeScript Express API endpoint for creating users
```

**Expected**: Should follow org API standards (status codes, error format, etc.)

### Test 4: Logging Format
```
Add logging to this error handler
```

**Expected**: Should use structured logging with required fields (timestamp, traceId, etc.)

## Verification

After each test, check if Copilot's generated code follows:
- ✅ CodeGuard default security rules
- ✅ Custom organization rules (Azure Key Vault, structured logging, API standards)

## Debug

If rules aren't being applied:
1. Check VS Code Output panel → "MCP Server" channel
2. Look for: "Loaded 24 instruction files"
3. Verify server started: "CodeGuard MCP Server running on stdio"
