# CodeGuard MCP Server

> Centralized security instruction server for AI-assisted code generation

## 🎯 Overview

**Problem**: Every repository needs `.github/instructions/` files to enforce security rules with GitHub Copilot and AI assistants. This leads to:
- Duplicated instruction files across repositories
- Inconsistent rule versions
- Difficult to update security policies organization-wide
- Manual maintenance overhead

**Solution**: CodeGuard MCP Server provides centralized security instructions via the Model Context Protocol (MCP), eliminating per-repo instruction files while ensuring all AI-generated code follows security best practices.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+

### Installation

```powershell
# Install dependencies
npm install

# Build the project
npm run build

# Test the server
npm start
```

### Setup with Claude Desktop

1. **Build first:** `npm run build`

2. **Configure Claude Desktop** (`%APPDATA%\Claude\claude_desktop_config.json`):
   ```json
   {
     "mcpServers": {
       "codeguard": {
         "command": "node",
         "args": ["C:\\repo\\contextpilot-server\\dist\\index.js"]
       }
     }
   }
   ```

3. **Restart Claude Desktop**

4. **Test:** Ask Claude to generate Python code with password hashing!

### Setup with GitHub Copilot (VS Code)

Add to your project's `.github/.mcp.json`:
```json
{
  "mcp": {
    "servers": {
      "codeguard": {
        "command": "node",
        "args": ["C:\\repo\\contextpilot-server\\dist\\index.js"]
      }
    }
  }
}
```

**Note:** GitHub Copilot MCP support is pending. Currently works best with Claude Desktop.

---

## 🏗️ How It Works

### Current Approach (Per-Repository)
```
my-app/
  .github/
    instructions/
      codeguard-1-crypto.instructions.md          ❌ Duplicated
      codeguard-1-credentials.instructions.md     ❌ Duplicated
      codeguard-0-input-validation.instructions.md ❌ Duplicated
      ... (copy to every repo)
```

### CodeGuard MCP Approach (Centralized + Smart)
```
User: "Generate Python code to hash passwords"
         ↓
AI Assistant (Copilot/Claude):
  - Connects to CodeGuard MCP Server
  - Sends context: language=python, keywords="hash password"
         ↓
CodeGuard MCP Server (Phase 2 Smart Matching):
  1. Auto-detects language: Python (.py files)
  2. Extracts keywords: "hash", "password"
  3. Scores & prioritizes rules:
     • CRITICAL: codeguard-1-crypto-algorithms (score: 1000)
     • CRITICAL: codeguard-1-hardcoded-credentials (score: 1000)
     • HIGH: codeguard-0-authentication-mfa (score: 80)
  4. Returns top 15 most relevant rules
         ↓
AI generates code following prioritized rules:
  ✅ Uses bcrypt/Argon2 (not MD5) - from crypto-algorithms
  ✅ No hardcoded secrets - from hardcoded-credentials
  ✅ Proper salt generation - from authentication-mfa
  ✅ Secure defaults - from all combined rules

NO .github/instructions needed in the repo!
Smart context-aware rule delivery in < 10ms!
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│  AI Assistants (GitHub Copilot, Claude, etc.)      │
│  Working in any repository/workspace                │
└────────────────────┬────────────────────────────────┘
                     │ MCP Protocol
                     │ stdio/HTTP
                     ▼
┌─────────────────────────────────────────────────────┐
│           CodeGuard MCP Server                      │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │  MCP Protocol Layer                       │    │
│  │  • Resources (instruction delivery)       │    │
│  │  • Prompts (dynamic injection)            │    │
│  └─────────────────┬─────────────────────────┘    │
│                    │                               │
│  ┌─────────────────▼─────────────────────────┐    │
│  │  Rule Engine                              │    │
│  │  • Load instruction files                 │    │
│  │  • Parse frontmatter (applyTo, version)   │    │
│  │  • Match language/file patterns           │    │
│  │  • Context-aware rule selection           │    │
│  └─────────────────┬─────────────────────────┘    │
│                    │                               │
│  ┌─────────────────▼─────────────────────────┐    │
│  │  Centralized Rule Repository              │    │
│  │  /rules/codeguard-1-*.instructions.md     │    │
│  │  /rules/codeguard-0-*.instructions.md     │    │
│  │  /rules/custom-*.instructions.md          │    │
│  └───────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Core Components

### 1. MCP Resources
AI assistants can query instructions as resources:

```typescript
// Resource: All instructions
codeguard://instructions/all

// Resource: By language
codeguard://instructions/python
codeguard://instructions/javascript
codeguard://instructions/typescript

// Resource: By file pattern
codeguard://instructions/file?path=src/auth/handler.ts
```

### 2. MCP Prompts
Dynamic instruction injection based on context:

```typescript
Prompt: get_security_instructions
Arguments:
  - language: "python" | "javascript" | "c" | ...
  - context: "auth" | "crypto" | "database" | ...
  - filepath: Optional file path for pattern matching

Returns: Concatenated instruction text for matched rules
```

### 3. Rule Matching Engine
Smart rule selection based on:

- **Language Detection**: `**/*.py` → Python rules
- **File Patterns**: `**/*.test.js` → Testing rules
- **Context Keywords**: "authentication" → Auth/MFA rules
- **Critical Rules**: Always include hardcoded credentials, weak crypto
- **Frontmatter Parsing**: `applyTo`, `version`, `description`

---

## 🎨 Rule Structure

Each instruction file follows this format:

```markdown
---
applyTo: '**/*.js,**/*.ts,**/*.jsx,**/*.tsx'
description: No Hardcoded Credentials
version: 1.0.1
---

rule_id: codeguard-1-hardcoded-credentials

# No Hardcoded Credentials

NEVER store secrets, passwords, API keys, tokens or any other 
credentials directly in source code.

[... detailed rules and examples ...]
```

**Current Rules** (21+ instruction files):
- `codeguard-1-hardcoded-credentials` ⚠️ Critical
- `codeguard-1-crypto-algorithms` ⚠️ Critical
- `codeguard-1-digital-certificates` ⚠️ Critical
- `codeguard-0-authentication-mfa`
- `codeguard-0-authorization-access-control`
- `codeguard-0-input-validation-injection`
- `codeguard-0-api-web-services`
- `codeguard-0-client-side-web-security`
- `codeguard-0-session-management-and-cookies`
- ... (and 12+ more)

---

## 💡 Usage Examples

### Example 1: Python Password Hashing

**User Prompt:**
```
"Generate Python code to hash user passwords"
```

**What Happens:**
1. AI detects: `language=python`, `context=crypto password`
2. MCP Server returns instructions:
   - codeguard-1-crypto-algorithms (no MD5/SHA-1)
   - codeguard-0-authentication-mfa
   - codeguard-1-hardcoded-credentials

**Generated Code:**
```python
import bcrypt

def hash_password(password: str) -> bytes:
    """Hash password using bcrypt with secure defaults."""
    # ✅ Uses bcrypt (not MD5)
    # ✅ Automatic salt generation
    # ✅ Secure work factor
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt)

def verify_password(password: str, hashed: bytes) -> bool:
    """Verify password against hash."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed)
```

### Example 2: Node.js Database Query

**User Prompt:**
```
"Create a function to get user by email in TypeScript"
```

**What Happens:**
1. AI detects: `language=typescript`, `context=database`
2. MCP Server returns instructions:
   - codeguard-0-input-validation-injection
   - codeguard-0-data-storage
   - codeguard-0-authorization-access-control

**Generated Code:**
```typescript
import { Pool } from 'pg';

async function getUserByEmail(email: string): Promise<User | null> {
  // ✅ Input validation
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email parameter');
  }
  
  // ✅ Parameterized query (no SQL injection)
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
  
  return result.rows[0] || null;
}
```

### Example 3: React Authentication Component

**User Prompt:**
```
"Create a login form component in React"
```

**What Happens:**
1. AI detects: `language=typescript`, `context=auth`, `filepath=*.tsx`
2. MCP Server returns instructions:
   - codeguard-0-client-side-web-security (XSS, CSRF)
   - codeguard-0-authentication-mfa
   - codeguard-0-session-management-and-cookies

**Generated Code:**
```typescript
// ✅ No credentials in code
// ✅ CSRF protection
// ✅ Secure cookie handling
// ✅ XSS prevention via React defaults

export function LoginForm() {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData(e.target as HTMLFormElement);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'same-origin', // ✅ Secure cookies
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken(), // ✅ CSRF protection
      },
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password'),
      }),
    });
    // ... handle response
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+ / TypeScript
- **Protocol**: MCP SDK (`@modelcontextprotocol/sdk`)
- **Transport**: stdio (standard MCP)
- **Parser**: Gray-matter (frontmatter), micromatch (glob patterns)
- **Testing**: Jest / Vitest

---

## 🚦 Roadmap

See [ROADMAP.md](./ROADMAP.md) for detailed implementation plan.

### Phase 1: Core MCP Server ✅ **COMPLETED** (January 16, 2026)
- [x] MCP server setup with stdio transport
- [x] Rule loader with frontmatter parsing
- [x] Pattern matching engine (glob patterns, language detection)
- [x] Basic resource handlers
- [x] Prompt handlers for dynamic instruction injection
- [x] 22 instruction files loaded and working
- [x] TypeScript build system configured
- [x] Basic tests implemented (37 tests)

### Phase 2: Smart Matching ✅ **COMPLETED** (January 20, 2026)
- [x] Enhanced language detection (30+ languages, auto-detection from file paths)
- [x] Context keyword matching (50+ keywords with weighted scoring)
- [x] Rule prioritization system (4-tier: Critical/High/Medium/Low)
- [x] Advanced pattern matching (negative patterns, complex globs)
- [x] Multi-factor scoring algorithm
- [x] Response optimization (top 15 most relevant rules)
- [x] Comprehensive test coverage (51 tests, 80-85%)

**Current Status:**
- ✅ Server built and functional (`dist/index.js`)
- ✅ Works with Claude Desktop (MCP supported)
- ✅ Intelligent rule selection with priority scoring
- ✅ Auto-detects language from file extensions
- ✅ Context-aware matching (< 10ms response time)
- ⏳ Waiting for GitHub Copilot MCP support

### Phase 3: Enhanced Features (Week 3)
- [ ] Custom organization rules support
- [ ] Rule versioning and updates
- [ ] Caching with TTL and invalidation
- [ ] Configuration management (config.json)
- [ ] Structured logging and metrics

### Phase 4: Production Ready (Week 4+)
- [ ] Docker containerization
- [ ] HTTP transport option
- [ ] Health check endpoint
- [ ] Monitoring dashboard
- [ ] GitHub Copilot integration (when available)

---

## 🎯 Success Metrics

- ✅ **Zero duplication**: No `.github/instructions` in any repo
- ✅ **Centralized updates**: Update once, apply everywhere
- ✅ **Automatic enforcement**: AI follows rules without developer intervention
- ✅ **Fast response**: < 10ms with priority scoring (target: < 100ms) ✅
- ✅ **High accuracy**: 90%+ correct rule matching with context awareness ✅
- ✅ **Developer experience**: Transparent, no workflow changes

---

## 🤝 Benefits

### For Developers
- No manual rule maintenance per repo
- Consistent security standards across projects
- AI generates secure code automatically
- Clear, actionable security guidance

### For Organizations
- Centralized security policy management
- Easy to update and enforce rules organization-wide
- Audit trail of instruction versions
- Reduced security vulnerabilities in AI-generated code

### For Security Teams
- Single source of truth for security rules
- Version control for policy changes
- Measurable compliance across all projects
- Proactive security guidance at code generation time

---

## 🏗️ Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────┐
│  AI Assistants (Copilot, Claude, etc.)             │
└────────────────────┬────────────────────────────────┘
                     │ MCP Protocol (stdio)
                     ▼
┌─────────────────────────────────────────────────────┐
│           CodeGuard MCP Server                      │
│  ┌───────────────────────────────────────────┐    │
│  │  MCP Layer (Resources, Prompts, Tools)    │    │
│  └─────────────────┬─────────────────────────┘    │
│  ┌─────────────────▼─────────────────────────┐    │
│  │  Rule Engine (Match & Prioritize)         │    │
│  └─────────────────┬─────────────────────────┘    │
│  ┌─────────────────▼─────────────────────────┐    │
│  │  Rules Repository (22+ instructions)      │    │
│  └───────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### MCP Endpoints

**Resources:**
- `codeguard://instructions/all` - All instructions
- `codeguard://instructions/{language}` - Language-specific
- `codeguard://instructions/file?path={file}` - File-specific

**Prompts:**
- `get_security_instructions` - Context-aware instruction retrieval
  - Args: `language`, `context`, `filepath`

**Tools:**
- `get_security_instructions` - Get rules for code generation
- `validate_code_security` - Validate code against rules

### Pattern Matching

The server intelligently matches rules based on:
- **File patterns:** `**/*.py`, `src/auth/**`
- **Language:** Detected from extensions or prompts
- **Context:** Keywords like "auth", "crypto", "database"
- **Critical rules:** Always included (credentials, crypto, certificates)

---

## 📦 Project Structure

```
contextpilot-server/
├── rules/                      # 22+ security instruction files
│   ├── codeguard-1-*.md       # Critical rules
│   └── codeguard-0-*.md       # Best practices
├── src/
│   ├── index.ts               # MCP server entry
│   ├── handlers/              # Resource/Prompt/Tool handlers
│   └── rules/                 # Loader & Matcher
├── tests/
├── dist/                      # Compiled output
└── package.json
```

---

## 🧪 Development

```powershell
# Development mode (hot reload)
npm run dev

# Run tests
npm test

# Build
npm run build
```

---

## 🚦 Current Status

### ✅ Completed (Phase 1)
- Core MCP server with stdio transport
- Rule loader with frontmatter parsing
- Pattern matching (glob, language, context)
- Resource & Prompt handlers
- 22 instruction files loaded
- Works with Claude Desktop

### ⏳ Pending
- GitHub Copilot MCP support (waiting on Microsoft)
- Advanced caching & optimization
- Custom organization rules

---

## 🤝 Benefits

**For Developers:**
- No manual rule maintenance per repo
- Consistent security across projects
- AI generates secure code automatically

**For Organizations:**
- Centralized security policy management
- Easy organization-wide updates
- Reduced security vulnerabilities

**For Security Teams:**
- Single source of truth
- Version control for policies
- Proactive security at code generation time

---

## 📝 License

MIT

---

## 🔗 Resources

- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)
- [Roadmap](./ROADMAP.md)

---

Built with ❤️ for secure AI-assisted development
