# CodeGuard MCP Server - Implementation Roadmap

## 🎯 Objective

Build a centralized MCP server that provides security instructions to AI assistants (GitHub Copilot, Claude, etc.) for generating secure code, replacing the need for per-repository `.github/instructions/` files.

---

## 📅 Timeline Overview

| Phase | Duration | Status | Deliverables |
|-------|----------|--------|--------------|
| Phase 1: Foundation | Week 1 | ✅ **COMPLETED** | Core MCP server, rule loader, basic resources |
| Phase 2: Smart Matching | Week 2 | ⏳ Planned | Context-aware rule selection, pattern matching |
| Phase 3: Enhancement | Week 3 | ⏳ Planned | Custom rules, caching, optimization |
| Phase 4: Production | Week 4+ | ⏳ Planned | Deployment, monitoring, integrations |

---

## ✅ Phase 1 Completion Summary (January 16, 2026)

**Status: COMPLETE** 🎉

### Completed Tasks:
- ✅ Project structure initialized (src/, tests/, rules/)
- ✅ TypeScript configuration (package.json, tsconfig.json)
- ✅ 22 instruction files moved from `.github/instructions/` to `rules/`
- ✅ Rule loader with frontmatter parsing (gray-matter)
- ✅ Pattern matcher with glob patterns (micromatch)
- ✅ MCP server core (stdio transport)
- ✅ Resource handlers (list/read resources)
- ✅ Prompt handlers (get_security_instructions)
- ✅ Build system working (TypeScript compilation)
- ✅ Basic tests created (vitest)
- ✅ Documentation (README, ROADMAP, ARCHITECTURE, USAGE, VSCODE_SETUP)

### What's Working:
- Server successfully loads and parses all 22 instruction files
- MCP resources endpoint responds to queries
- Pattern matching works for file paths, languages, and contexts
- Critical rules (credentials, crypto, certificates) always included
- Built server ready at `dist/index.js`

### Current Limitations:
- ⚠️ **GitHub Copilot MCP support not yet available** (waiting on Microsoft)
- ✅ Server works with Claude Desktop MCP
- ⏳ VS Code integration pending Copilot MCP support

---

## x] Initialize package.json with dependencies
  - `@modelcontextprotocol/sdk`
  - `gray-matter` (frontmatter parsing)
  - `micromatch` (glob patterns)
  - `typescript`, `tsx`, `@types/node`
- [x] Configure TypeScript (tsconfig.json)
- [x 1.1 Initialize Project Structure
```
contextpilot-server/
├── rules/                         # Move from .github/instructions
├── src/
│   ├── index.ts                   # Entry point
│   ├── server.ts                  # MCP server setup
│   ├── handlers/
│   │   ├── resources.ts           # Resource handlers
│   │   └── prompts.ts             # Prompt handlers
│   ├── rules/
│   │   ├── loader.ts              # Load instruction files
│   │   ├── matcher.ts             # Pattern matching
│   │   ├── parser.ts              # Frontmatter parsing
│   │   └── types.ts               # TypeScript types
│   └── utils/
│       └── patterns.ts            # Glob pattern utilities
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

**Tasks**:
- [x] Create project structure
- [ ] Initialize package.json with dependencies
  - `@modelcontextprotocol/sdk`
  - `gray-matter` (frontmatter parsing)
  - `micromatch` (glob patterns)
  - `typescript`, `tsx`, `@types/node`
- [ ] Configure TypeScript (tsconfig.json)
- [ ] Move `.github/instructions/*.md` → `rules/*.md`

#### 1.2 Rule Loader Implementation
**File**: `src/rules/loader.ts`

**Functionality**:
- Scan `rules/` directory for `.instructions.md` files
- Parse frontmatter (applyTo, description, version)
- Extract rule content
- Build in-memory cache

**Interface**:
```typescript
interface Instruction {
  id: string;                    // codeguard-1-hardcoded-credentials
  filepath: string;              // rules/codeguard-1-hardcoded-credentials.instructions.md
  frontmatter: {
    applyTo: string;             // **/*.js,**/*.ts
    description: string;
    version: string;
  };
  content: string;               // Full markdown content
  patterns: string[];            // Parsed applyTo patterns
}

async function loadInstructions(rulesDir: string): Promise<Instruction[]>
```

**Tasks**:
- [x] Implement file scanning
- [x] Parse frontmatter with gray-matter
- [x] Split applyTo patterns
- [x] Build instruction objects
- [x] Unit tests

#### 1.3 Pattern Matcher Implementation
**File**: `src/rules/matcher.ts`

**Functionality**:
- Match file paths to glob patterns
- Match languages to file extensions
- Return applicable rules

**Interface**:
```typescript
function matchRulesToFile(filepath: string, rules: Instruction[]): Instruction[]
function matchRulesToLanguage(language: string, rules: Instruction[]): Instruction[]
```

**Tasks**:
- [x] Implement glob pattern matching (micromatch)
- [x] Create language → extension mapping
- [x] Handle multiple patterns per rule
- [x] Unit tests with edge cases

### Day 3-4: MCP Server Implementation

#### 1.4 MCP Server Setup
**File**: `src/server.ts`

**Functionality**:
- Initialize MCP server
- Configure stdio transport
- Set up error handling
- Implement graceful shutdown

**Tasks**:
- [x] Create MCP server instance
- [x] Configure stdio transport
- [x] Add logging
- [x] Error handling
- [x] Integration tests

#### 1.5 Resource Handlers
**File**: `src/handlers/resources.ts`

**Resources to Implement**:

1. **List All Instructions**
   - URI: `codeguard://instructions/all`
   - Returns: Concatenated all instruction files

2. **Instructions by Language**
   - URI: `codeguard://instructions/python`
   - URI: `codeguard://instructions/javascript`
   - Returns: All rules matching that language

3. **Instructions by File Path**
   - URI: `codeguard://instructions/file?path=src/auth.ts`
   - Returns: Rules matching the file pattern

**Interface**:
```typescript
// MCP ListResources handler
async function handleListResources(): Promise<ListResourcesResult>

// MCP ReadResource handler
async function handleReadResource(uri: string): Promise<ReadResourceResult>
```

**Tasks**:
- [x] Implement ListResources handler
- [x] Implement ReadResource handler
- [x] Parse URI parameters
- [x] Format response content
- [x] Integration tests

#### 1.6 Prompt Handlers
**File**: `src/handlers/prompts.ts`

**Prompts to Implement**:

1. **Get Security Instructions**
   ```typescript
   Prompt: get_security_instructions
   Arguments:
     - language?: string
     - context?: string
     - filepath?: string
   Returns: Matched instruction content
   ```

**Tasks**:
- [x] Implement prompt handler
- [x] Parse arguments
- [x] Call matcher with arguments
- [x] Format concatenated instructions
- [x] Integration tests

### Day 5: Testing & Documentation

#### 1.7 Test Suite
**Files**: `tests/*.test.ts`

**Test Coverage**:
- [x] Rule loader tests
  - Load all instruction files
  - Parse frontmatter correctly
  - Handle missing frontmatter
  - Handle malformed files
- [x] Pattern matcher tests
  - Match simple patterns (*.js)
  - Match complex patterns (**/auth/*.ts)
  - Match multiple extensions
  - No match scenarios
- [x] MCP server tests
  - List resources
  - Read resources by URI
  - Prompt handling
  - Error cases

#### 1.8 Documentation
- [x] Update README with setup instructions
- [x] Add usage examples
- [x] Document MCP resources/prompts
- [x] Create developer guide

### Phase 1 Deliverables

✅ **Working MCP server**
- Loads instruction files from `rules/`
- Serves instructions via MCP resources
- Handles prompts for dynamic instruction injection
- Pattern matching for file paths and languages
- Unit and integration tests
- Complete documentation

**Success Criteria**:
- All tests passing
- Can query instructions by language
- Response time < 100ms
- Zero runtime errors

---

## Phase 2: Smart Matching (Week 2)

**Goal**: Implement intelligent context-aware rule selection

### 2.1 Language Detection

**Functionality**:
- Detect language from file extension
- Detect language from prompt keywords
- Handle multi-language scenarios

**Language Mappings**:
```typescript
const languageMap = {
  python: ['.py', '.pyi', '.pyx'],
  javascript: ['.js', '.mjs', '.cjs'],
  typescript: ['.ts', '.tsx'],
  c: ['.c', '.h'],
  cpp: ['.cpp', '.cc', '.cxx', '.hpp'],
  // ... etc
};
```

**Tasks**:
- [ ] Build language → extension map
- [ ] Implement extension → language lookup
- [ ] Add language hints from prompts
- [ ] Unit tests

### 2.2 Context Keyword Matching

**Functionality**:
- Extract keywords from prompts
- Map keywords to security domains
- Prioritize relevant rules

**Keyword Mappings**:
```typescript
const contextMap = {
  auth: ['codeguard-0-authentication-mfa', 'codeguard-0-authorization-access-control'],
  crypto: ['codeguard-1-crypto-algorithms', 'codeguard-0-additional-cryptography'],
  database: ['codeguard-0-data-storage', 'codeguard-0-input-validation-injection'],
  api: ['codeguard-0-api-web-services'],
  // ... etc
};
```

**Keywords to Detect**:
- Authentication: login, auth, authentication, password, credentials
- Crypto: hash, encrypt, decrypt, crypto, cipher, ssl, tls
- Database: sql, database, query, orm, postgres, mysql
- API: api, rest, graphql, endpoint
- Security: security, vulnerability, safe, sanitize

**Tasks**:
- [ ] Build keyword → rule mapping
- [ ] Implement keyword extraction
- [ ] Context scoring algorithm
- [ ] Unit tests

### 2.3 Rule Prioritization

**Priority Levels**:
1. **Critical** (Always include)
   - codeguard-1-hardcoded-credentials
   - codeguard-1-crypto-algorithms
   - codeguard-1-digital-certificates

2. **High** (Context-matched)
   - Rules matching language + context

3. **Medium** (Language-matched)
   - Rules matching language only

4. **Low** (General)
   - Framework-specific, optional rules

**Tasks**:
- [ ] Implement priority scoring
- [ ] Rule deduplication
- [ ] Sort by priority
- [ ] Limit total response size
- [ ] Unit tests

### 2.4 Advanced Pattern Matching

**Features**:
- Negative patterns: `!**/node_modules/**`
- Directory patterns: `src/**/*.ts`
- Multiple extensions: `**/*.{js,ts,jsx,tsx}`
- Case sensitivity handling

**Tasks**:
- [ ] Implement negative pattern support
- [ ] Handle complex glob patterns
- [ ] Optimize pattern matching performance
- [ ] Unit tests with complex scenarios

### Phase 2 Deliverables

✅ **Smart rule selection**
- Context-aware instruction delivery
- Language detection from prompts
- Keyword-based rule matching
- Prioritized rule ordering
- Optimized response size
- Comprehensive test coverage

**Success Criteria**:
- 90%+ accuracy in rule selection
- Relevant rules always included
- No critical rules missed
- Response time < 150ms

---

## Phase 3: Enhancement (Week 3)

**Goal**: Add advanced features and optimization

### 3.1 Custom Rule Support

**Functionality**:
- Load organization-specific rules
- Override default rules
- Custom rule priority

**Directory Structure**:
```
rules/
├── codeguard-1-*.instructions.md    # Default rules
├── codeguard-0-*.instructions.md    # Default rules
└── custom/
    ├── org-api-standards.instructions.md
    ├── org-logging-format.instructions.md
    └── org-error-handling.instructions.md
```

**Tasks**:
- [ ] Support custom rules directory
- [ ] Rule override mechanism
- [ ] Custom rule priority
- [ ] Documentation

### 3.2 Caching & Performance

**Optimization Strategies**:
- In-memory rule cache
- Parsed pattern cache
- LRU cache for match results
- Lazy loading for large rule sets

**Tasks**:
- [ ] Implement rule cache with TTL
- [ ] Cache pattern match results
- [ ] Add cache invalidation
- [ ] Performance benchmarks
- [ ] Memory profiling

### 3.3 Configuration Management

**Config File**: `config.json`

```json
{
  "rulesDirectory": "./rules",
  "customRulesDirectory": "./rules/custom",
  "cache": {
    "enabled": true,
    "ttl": 3600
  },
  "matching": {
    "maxRulesPerResponse": 10,
    "alwaysInclude": [
      "codeguard-1-hardcoded-credentials",
      "codeguard-1-crypto-algorithms"
    ]
  }
}
```

**Tasks**:
- [ ] Configuration schema
- [ ] Config file loading
- [ ] Environment variable overrides
- [ ] Validation
- [ ] Documentation

### 3.4 Logging & Monitoring

**Logging Strategy**:
- Structured JSON logging
- Log levels (debug, info, warn, error)
- Request/response logging
- Performance metrics

**Metrics to Track**:
- Rules loaded
- Requests served
- Average response time
- Cache hit rate
- Most requested rules

**Tasks**:
- [ ] Implement structured logging
- [ ] Add request tracing
- [ ] Performance metrics
- [ ] Health check endpoint
- [ ] Monitoring dashboard

### Phase 3 Deliverables

✅ **Production-ready features**
- Custom rule support
- Performance optimization
- Configuration management
- Comprehensive logging
- Monitoring capabilities

**Success Criteria**:
- Support for custom rules
- Response time < 50ms (cached)
- 95%+ cache hit rate
- Full observability

---

## Phase 4: Production (Week 4+)

**Goal**: Deploy and integrate with AI assistants

### 4.1 Deployment

**Containerization**:
- [ ] Create Dockerfile
- [ ] Docker Compose setup
- [ ] Multi-stage build optimization
- [ ] Health checks

**Deployment Options**:
- [ ] Local development setup
- [ ] Docker container
- [ ] Kubernetes deployment (optional)
- [ ] Cloud deployment guide

### 4.2 Integration

**VS Code Extension**:
- [ ] MCP client configuration
- [ ] Auto-connect to CodeGuard server
- [ ] Status indicator
- [ ] Settings UI

**GitHub Copilot**:
- [ ] Configuration guide
- [ ] MCP integration setup
- [ ] Testing with Copilot

**Claude Desktop**:
- [ ] MCP configuration
- [ ] Testing with Claude

### 4.3 Rule Management

**Rule Updates**:
- [ ] Version control for rules
- [ ] Rule changelog
- [ ] Automated rule validation
- [ ] Rule testing framework

**Administration**:
- [ ] CLI for rule management
- [ ] Rule validation tool
- [ ] Migration scripts

### Phase 4 Deliverables

✅ **Production deployment**
- Containerized application
- VS Code integration
- AI assistant configurations
- Rule management tools
- Complete documentation

---

## 🎯 Success Metrics

### Performance
- [ ] < 50ms response time (cached)
- [ ] < 150ms response time (uncached)
- [ ] Handle 1000+ requests/minute
- [ ] Memory usage < 100MB

### Accuracy
- [ ] 95%+ correct rule matching
- [ ] Zero critical rules missed
- [ ] < 5% false positive rate

### Reliability
- [ ] 99.9% uptime
- [ ] Graceful error handling
- [ ] Automatic recovery

### Developer Experience
- [ ] Zero configuration for developers
- [ ] Transparent operation
- [ ] Clear error messages
- [ ] Complete documentation

---

## 📚 Technical Decisions

### Why MCP?
- Standard protocol for AI tool integration
- Supported by major AI assistants
- Clean abstraction for instruction delivery
- Future-proof architecture

### Why Stdio Transport?
- Simplest MCP transport
- No network configuration needed
- Secure by default (local only)
- Easy debugging

### Why In-Memory Cache?
- Fast access (microseconds)
- Simple implementation
- Rules change infrequently
- Low memory footprint

### Why TypeScript?
- Type safety for rule matching
- Great MCP SDK support
- Excellent tooling
- Easy maintenance

---

## 🔄 Iteration Plan

Each phase includes:
1. **Implementation**: Build features
2. **Testing**: Unit + integration tests
3. **Documentation**: Update docs
4. **Review**: Code review + feedback
5. **Refinement**: Address feedback

Weekly checkpoints:
- Demo working features
- Review metrics
- Adjust priorities
- Plan next week

---

## 📝 Notes

- Start simple, iterate quickly
- Prioritize core functionality over features
- Keep response times fast
- Maintain backward compatibility
- Document everything

---

**Last Updated**: January 16, 2026
