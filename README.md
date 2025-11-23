# ChatArbor AI Studio v2

> **Production-Ready AI Chatbot Platform** | Built with React, Express, ChromaDB, and Google Gemini

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision](#product-vision)
3. [Architecture Overview](#architecture-overview)
4. [Technology Stack](#technology-stack)
5. [Implementation Guide](#implementation-guide)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Guide](#deployment-guide)
8. [Technical Analysis](#technical-analysis)
9. [Development Roadmap](#development-roadmap)
10. [Contributing](#contributing)

---

## 1. Executive Summary

**ChatArbor AI Studio v2** is a next-generation AI-powered chatbot platform designed to replace ChatArbor v1 with full control over performance, knowledge management, and agentic capabilities.

### Key Improvements Over ChatArbor v1

| Feature | ChatArbor v1 | ChatArbor v2 |
|---------|--------------|--------------|
| **Knowledge Management** | Admin UI only (view/add) | Full CRUD with Admin Panel |
| **System Prompt** | Limited editing | Complete control |
| **AI Model** | ChatArbor proprietary | Google Gemini (state-of-art) |
| **RAG Implementation** | Black-box | Transparent ChromaDB with quality metrics |
| **Agentic Capabilities** | Static link suggestions | Live job search & inline results |
| **Testing** | Unknown | 100% test coverage with TDD |
| **Deployment** | Managed service | Self-hosted, full control |

### Current Status

✅ **Completed:**
- React frontend with chat interface
- Express backend with API routes
- ChromaDB integration (development mode)
- Admin panel with full KB management
- Persistent storage (JSON files)
- Test IDs for automation
- Sticky headers UI improvements

🚧 **In Progress:**
- Test-driven development setup
- Production ChromaDB configuration
- Agentic job search feature
- Widget deployment strategy

---

## 2. Product Vision

### Mission Statement

Build a **replacement for ChatArbor v1** that provides:
1. **Full control** over chatbot performance and knowledge
2. **Agentic capabilities** - proactive job search and inline results
3. **Production-ready** - scalable, secure, maintainable
4. **Turnkey deployment** - seamless integration with RangamWorks portal

### Target Use Cases

#### Primary: Job Seeker Assistance
```
User: "I need help finding nursing jobs in Ohio"
ChatArbor v2: 
  1. Searches TalentArbor API for matching jobs
  2. Presents top results with inline cards
  3. Offers "Quick Apply" functionality
  4. Asks follow-up questions to refine search
```

#### Secondary: Career Guidance
- Resume writing tips
- Interview preparation
- RangamWorks portal navigation
- Training resources

---

## 3. Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     RangamWorks Portal                       │
│                   (ASP.NET / TalentArbor)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Widget Integration
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  ChatArbor v2 Widget                         │
│                  (React Bundle)                              │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│   Express   │  │   ChromaDB   │  │  Gemini API  │
│   Backend   │  │  (Vectors)   │  │  (LLM+Embed) │
└─────────────┘  └──────────────┘  └──────────────┘
      │
      ▼
┌─────────────┐
│ JSON Files  │
│ (Settings,  │
│  KB, Logs)  │
└─────────────┘
```

### Data Flow

```
1. User Message
   ↓
2. Widget → Express API (/api/chat)
   ↓
3. Backend:
   - Extract intent (job search, general)
   - If job search: Call TalentArbor API
   - Query ChromaDB for context
   - Build prompt with context
   - Call Gemini API
   ↓
4. Response to Widget
   - Markdown text
   - Structured data (jobs, links)
   ↓
5. Widget renders rich UI
```

---

## 4. Technology Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI framework | 18.3+ |
| **TypeScript** | Type safety | 5.6+ |
| **Tailwind CSS** | Styling | 3.4+ |
| **Vite** | Build tool | 6.0+ |
| **React Markdown** | Message rendering | 9.0+ |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Express** | API server | 4.21+ |
| **TypeScript** | Type safety | 5.6+ |
| **Node.js** | Runtime | 20+ |

### AI & Data
| Technology | Purpose | Version |
|------------|---------|---------|
| **Google Gemini** | LLM & embeddings | 1.5 / 2.0 |
| **ChromaDB** | Vector database | Latest |
| **JSON Files** | Settings & logs | N/A |

### Testing
| Technology | Purpose | Version |
|------------|---------|---------|
| **Vitest** | Unit tests | 2.1+ |
| **React Testing Library** | Component tests | 16.1+ |
| **Playwright** | E2E tests | 1.49+ |
| **MSW** | API mocking | 2.7+ |

---

## 5. Implementation Guide

### Prerequisites

- Node.js 20+
- Docker (for ChromaDB)
- Google Gemini API key
- VS Code (recommended)

### Quick Start (Development)

```bash
# 1. Clone repository
git clone https://github.com/fusbox/ChatArbor_AI_Studio.git
cd ChatArbor_AI_Studio

# 2. Install dependencies
npm install
cd server && npm install && cd ..

# 3. Configure environment
cp .env.local.example .env.local
cp server/.env.example server/.env

# 4. Add your Gemini API key to both .env files
VITE_GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Avoid using revoked or leaked keys
- If you see `Your API key was reported as leaked` in the dev server logs when generating embeddings, the key has been revoked by Google. Create a fresh key in Google AI Studio and update both `.env.local` and `server/.env`.
- The `scripts/test_api_key.js` helper now reads `GEMINI_API_KEY` from `.env.local`; it will refuse to run without a valid key so a revoked sample key is never sent to the API.
- The backend will also warn when Gemini rejects a key as leaked or revoked; rotate the key and restart both frontend and backend dev servers after updating your environment files.

# 5. Start ChromaDB (optional, uses fallback if not running)
docker run -p 8000:8000 ghcr.io/chroma-core/chroma:latest

# 6. Start dev servers
npm run dev          # Frontend (port 5173)
cd server && npm run dev  # Backend (port 3000)
```

### Project Structure

```
ChatArbor_AI_Studio/
├── components/              # React components
│   ├── admin/              # Admin panel components
│   ├── auth/               # Authentication
│   ├── chat/               # Chat interface
│   └── shared/             # Shared components
├── server/                  # Backend Express app
│   ├── routes/             # API endpoints
│   ├── utils/              # Utilities (storage)
│   ├── data/               # JSON file storage
│   └── index.ts            # Server entry
├── services/                # Frontend services
│   ├── apiService.ts       # API client
│   ├── chromaService.ts    # Vector DB client
│   └── geminiService.ts    # AI service
├── tests/                   # Test files
├── docs/                    # Documentation
└── .env.local              # Environment config
```

### Development Workflow

```bash
# Run tests (TDD approach)
npm test                     # All tests
npm run test:watch          # Watch mode
npm run test:ui             # Vitest UI

# Run specific test file
npm test -- MessageBubble.test.tsx

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Build for production
npm run build
cd server && npm run build
```

---

## 6. Testing Strategy

### Test-Driven Development (TDD)

**All new features follow TDD:**

1. **Write failing test first**
2. **Implement minimum code to pass**
3. **Refactor while keeping tests green**

### Test Coverage Requirements

| Category | Target Coverage |
|----------|----------------|
| **Components** | 90%+ |
| **Hooks** | 95%+ |
| **Services** | 85%+ |
| **Utils** | 95%+ |
| **Overall** | 85%+ |

### Test Organization

```
tests/
├── unit/                    # Pure functions, utilities
│   ├── services/
│   └── utils/
├── integration/             # Component + hooks
│   ├── components/
│   └── hooks/
├── e2e/                     # Full user flows
│   ├── chat-flow.spec.ts
│   ├── admin-panel.spec.ts
│   └── job-search.spec.ts
└── __mocks__/               # Mock data
    ├── handlers.ts          # MSW handlers
    └── fixtures.ts          # Test data
```

### Testing Tools

#### Vitest Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['**/*.test.{ts,tsx}', '**/node_modules/**']
    }
  }
});
```

#### Example Test Pattern

```typescript
// MessageBubble.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MessageBubble from './MessageBubble';

describe('MessageBubble', () => {
  it('renders user message with correct styling', () => {
    const message = {
      id: '1',
      text: 'Hello',
      author: MessageAuthor.USER
    };
    
    render(<MessageBubble message={message} onFeedback={vi.fn()} />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hello').closest('div'))
      .toHaveClass('bg-primary');
  });
  
  it('shows feedback buttons for AI messages', () => {
    const message = {
      id: '1',
      text: 'AI response',
      author: MessageAuthor.AI
    };
    
    render(<MessageBubble message={message} onFeedback={vi.fn()} />);
    
    expect(screen.getByTestId('feedback-good-1')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-bad-1')).toBeInTheDocument();
  });
});
```

---

## 7. Deployment Guide

### Production ChromaDB Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  chromadb:
    image: ghcr.io/chroma-core/chroma:latest
    container_name: chatarbor-chromadb-prod
    ports:
      - "8000:8000"
    volumes:
      - ./chromadb-data:/chroma/chroma
    environment:
      - ALLOW_RESET=false
      - ANONYMIZED_TELEMETRY=false
      - CHROMA_SERVER_AUTH_CREDENTIALS_PROVIDER=chromadb.auth.token.TokenConfigServerAuthCredentialsProvider
      - CHROMA_SERVER_AUTH_CREDENTIALS=${CHROMA_AUTH_TOKEN}
      - CHROMA_SERVER_AUTH_PROVIDER=chromadb.auth.token.TokenAuthServerProvider
    restart: always
    networks:
      - chatarbor-network

networks:
  chatarbor-network:
    driver: bridge
```

### Widget Deployment

```bash
# Build widget bundle
npm run build:widget

# Output: dist/widget.js (single file bundle)

# Deploy to CDN or static hosting
# Usage in RangamWorks:
<script src="https://cdn.rangamworks.com/chatarbor/widget.js"></script>
<script>
  ChatArborWidget.init({
    apiUrl: 'https://api-chatarbor.rangamworks.com',
    position: 'bottom-right'
  });
</script>
```

---

## 8. Technical Analysis

### 8.1 Widget Implementation Analysis

#### Comparison: Widget vs DOM Injection

**ChatArbor v1 Approach (DOM Injection):**
```javascript
// Lightweight script injects HTML directly
(function() {
  const chatUI = document.createElement('div');
  chatUI.innerHTML = `<div class="chat-container">...</div>`;
  document.body.appendChild(chatUI);
})();
```

**Pros:**
- ✅ Tiny bundle size (~50KB)
- ✅ Instant load time
- ✅ Shares parent page's CSS

**Cons:**
- ❌ No component state management
- ❌ Limited to vanilla JS
- ❌ CSS conflicts likely
- ❌ Hard to maintain/test

---

**ChatArbor v2 Approach (React Widget):**
```javascript
// Bundled React app
(function() {
  const container = document.createElement('div');
  container.id = 'chatarbor-widget';
  document.body.appendChild(container);
  
  ReactDOM.render(<ChatWidget />, container);
})();
```

**Pros:**
- ✅ Full React ecosystem
- ✅ Component reusability
- ✅ TypeScript type safety
- ✅ Testing infrastructure
- ✅ Hot module replacement
- ✅ State management (hooks/context)
- ✅ Shadow DOM isolation (optional)

**Cons:**
- ❌ Larger bundle (~500KB minified)
- ❌ Requires build step
- ❌ Slower initial load (~300-500ms)

**Mitigation Strategies:**
```javascript
// Code splitting
const ChatWindow = lazy(() => import('./ChatWindow'));

// Preload critical resources
<link rel="preload" href="widget.js" as="script" />

// Progressive enhancement
<div id="chatarbor-placeholder">
  <p>Loading chat...</p>
</div>
```

**Verdict:** React widget provides **10x better developer experience** and **future-proof architecture**. Bundle size drawbacks are negligible with modern optimization.

---

### 8.2 ChromaDB vs Supabase Analysis

#### For Standalone Production App

**ChromaDB:**
- ✅ Best-in-class vector search
- ✅ Lightweight, purpose-built
- ✅ Cost-effective
- ❌ Requires separate DB for user data

**Supabase:**
- ✅ All-in-one (DB, auth, storage)
- ✅ Managed service
- ❌ pgvector less optimized than ChromaDB
- ❌ Vendor lock-in

**Recommendation:** **ChromaDB** for maximum control and performance.

#### For RangamWorks Integration

**Strongly recommend ChromaDB** because:
1. RangamWorks already has auth/DB infrastructure
2. Only need vector search capability
3. Isolated microservice architecture
4. Can run alongside existing systems

---

### 8.3 TalentArbor API Integration Strategy

**Agentic Job Search Architecture:**

```typescript
// Intent detection
const intent = detectIntent(userMessage);

// If job search intent
if (intent === 'job_search') {
  // Extract params
  const params = extractJobParams(userMessage);
  // { keywords: "nursing", location: "Ohio" }
  
  // Call TalentArbor API
  const jobs = await searchTalentArborJobs(params);
  
  // Format for Gemini
  const context = formatJobsAsContext(jobs);
  
  // Generate response with structured data
  const response = await callGemini(prompt, context);
  
  // Return both text and job data
  return { text: response, jobs: jobs };
}
```

**Benefits:**
- ✅ Inline job results (no page navigation)
- ✅ "Quick Apply" functionality
- ✅ Conversational refinement
- ✅ Better user experience

---

## 9. Development Roadmap

### Phase 1: Foundation ✅ (Complete)
- [x] React frontend
- [x] Express backend
- [x] ChromaDB integration (dev)
- [x] Admin panel
- [x] Persistent storage
- [x] Test IDs

### Phase 2: TDD Setup 🚧 (In Progress)
- [ ] Jest/Vitest configuration
- [ ] React Testing Library setup
- [ ] MSW for API mocking
- [ ] Test coverage reports
- [ ] CI/CD with tests

### Phase 3: Production ChromaDB 📋 (Planned)
- [ ] Docker Compose with persistence
- [ ] Backend API for vector operations
- [ ] Authentication/authorization
- [ ] Backup/restore scripts
- [ ] Migration tools

### Phase 4: Agentic Features 📋 (Planned)
- [ ] Intent detection system
- [ ] TalentArbor API integration
- [ ] Job results component
- [ ] Quick apply functionality
- [ ] Conversation refinement

### Phase 5: Widget Deployment 📋 (Planned)
- [ ] Webpack/Vite widget config
- [ ] CDN deployment
- [ ] Integration docs
- [ ] A/B testing framework
- [ ] Analytics/monitoring

### Phase 6: RangamWorks Integration 📋 (Future)
- [ ] Session validation
- [ ] SSO integration
- [ ] Widget embedding
- [ ] Gradual rollout
- [ ] ChatArbor v1 deprecation

---

## 10. Contributing

### Pull Request Process

1. Create feature branch: `feature/your-feature-name`
2. Write tests FIRST (TDD approach)
3. Implement feature
4. Ensure all tests pass: `npm test`
5. Update documentation
6. Submit PR with detailed description

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (auto-format on save)
- **Linting**: ESLint with React rules
- **Commits**: Conventional commits format

```bash
feat: add agentic job search
fix: resolve ChromaDB connection timeout
docs: update deployment guide
test: add MessageBubble tests
```

### Questions or Issues?

Contact: Fu Huang (@fusbox)

---

**Built with ❤️ for RangamWorks** | Powered by Google Gemini & ChromaDB
