# AI Coding Agent Instructions for ChatArbor AI Studio

## Project Overview

**ChatArbor AI Studio** is a React + TypeScript RAG-powered conversational chatbot with admin controls. It features a dual-view interface (Chat & Admin), authentication, persistent chat history, and comprehensive knowledge base management.

**Key Architecture:**
- **Frontend:** React 19 + Vite + TypeScript
- **AI:** Google Gemini API via `@google/genai`
- **State Management:** React Context (AuthContext) + local hooks
- **Persistence:** Browser localStorage (mock backend)
- **Testing:** Vitest + React Testing Library + Playwright E2E

## Critical Patterns & Architecture

### 1. Service Layer Abstraction
The project uses a **service → mock service pattern** to isolate API logic:
- `services/apiService.ts` - Public API contract with simulated latency (250ms)
- `services/mockApiService.ts` - Implementation using localStorage
- `services/geminiService.ts` - Embedding simulation (not used by default API calls)

**Pattern:** All component data access must go through `apiService` functions, never directly to mock service. This enables easy backend replacement later.

```typescript
// ✓ Correct - route through apiService
const user = await apiService.login(email, password);

// ✗ Wrong - bypasses abstraction
const user = await mockApiService.handleLogin(email, password);
```

### 2. Authentication & User Context
- **Single AuthContext** wraps the entire app; checked in `App.tsx`
- Guest users: generated ID stored in localStorage (`guestUserId`)
- On login: `migrateGuestChat()` merges guest history into user account
- Access current user via `useAuth()` hook anywhere in component tree

**Key Pattern:** Components check `currentUser?.id || apiService.getGuestUserId()` to get active user ID for all operations.

### 3. Dual-View Architecture
- **App.tsx** manages root state: `view` ('chat' | 'admin') and auth modal
- Views are mutually exclusive; only one renders in `<main>`
- Header component controls view switching and auth button

### 4. Custom Hooks for Business Logic
- `useChat.ts` - Centralized chat state (messages, loading, history management)
  - Loads greeting on init, appends system messages on errors
  - Calls `apiService.getChatResponse()` with formatted history for Gemini
  - Auto-saves all messages to localStorage
  - Tracks chat logs when chat is cleared
- Similar pattern should follow for admin operations (create if needed)

### 5. Message Flow & Types
**Key Enum:** `MessageAuthor = { USER, AI, SYSTEM }`

Messages flow through state like:
1. User sends text → create `Message` object with `MessageAuthor.USER`
2. Save to storage, get API response
3. Create AI message with `MessageAuthor.AI`
4. SYSTEM messages only on errors or special events

**Important:** History sent to Gemini excludes SYSTEM messages and maps authors to Gemini format: `{ role: 'user' | 'model', parts: [{ text }] }`

### 6. Knowledge Base & Admin Operations
- Knowledge sources stored in localStorage (mock)
- Supports three types: TEXT, URL, FILE
- `reIndexKnowledgeBase()` generates embeddings (deterministic simulation)
- Admin panel manages sources, system prompts, greetings

**Convention:** Admin operations (add/edit/delete) immediately update UI state after API success; failures show toast/error states.

## Developer Workflow

### Commands
```bash
npm run dev        # Start Vite dev server on localhost:3000
npm test           # Run Vitest suite (watch mode)
npm run test:ui    # Interactive Vitest UI
npm run test:e2e   # Run Playwright E2E tests
npm run build      # Production build
```

### Test Organization
- **Unit tests:** Colocated as `*.test.ts` / `*.test.tsx` (e.g., `hooks/useChat.test.ts`)
- **E2E tests:** In `e2e/` folder with Playwright (`admin.spec.ts`, `chat.spec.ts`)
- **Test setup:** `tests/setup.ts` loads mocks; `tests/mocks.ts` defines browser API stubs
- **Mocking pattern:** Use React Testing Library's `render()` with `AuthProvider` wrapper

### Key Files & Their Roles
| File | Purpose |
|------|---------|
| `types.ts` | Single source of truth for all interfaces (Message, User, KnowledgeSource, etc.) |
| `constants.ts` | App-wide constants (APP_NAME, etc.) |
| `contexts/AuthContext.tsx` | Auth state & login/signup/logout logic |
| `hooks/useChat.ts` | Chat state management & message flow |
| `services/apiService.ts` | **Always use this** for all backend calls |
| `components/admin/AdminDashboard.tsx` | Routes to sub-admin components |
| `vite.config.ts` | Dev server (port 3000), path alias `@/` |
| `vitest.config.ts` | JSDOM environment, setupFiles path important |

## Code Patterns to Follow

### 1. Component Structure
```tsx
interface ComponentProps {
  prop1: string;
  onAction: (data: Type) => void;
}

const Component: React.FC<ComponentProps> = ({ prop1, onAction }) => {
  // Logic here
  return <JSX />;
};

export default Component;
```

### 2. Async Operations
- Wrap in try-catch; create SYSTEM error messages on failure
- Show loading spinner during operations (`<Spinner />`)
- Save data immediately after successful API calls

### 3. localStorage Keys (Mock Backend Convention)
```typescript
// Pattern established in mockApiService
'knowledgeBase'          // KnowledgeSource[]
'chatHistory_${userId}'  // Message[]
'chatLogs'              // ChatLog[]
'systemPrompt'          // string
'greetings'             // Greeting[]
'users'                 // User[]
'feedback'              // UserFeedback[]
'guestUserId'           // string
'currentUser'           // User | null
```

## Common Pitfalls to Avoid

1. **Accessing localStorage directly** - Always use apiService functions
2. **Forgetting to unwrap guest vs. registered users** - Always check `currentUser?.id || getGuestUserId()`
3. **Sending SYSTEM messages to Gemini API** - Filter them out before formatting history
4. **Skipping chat log save on clear** - `useChat.clearChat()` saves logs before clearing
5. **Not wrapping async admin operations in try-catch** - Leads to silent failures
6. **Hardcoding message IDs without timestamps** - Use `id: \`${prefix}_${Date.now()}\`` pattern

## Integration Points

- **Google Gemini API:** Called via `apiService.getChatResponse()` → `mockApiService.handleGetChatResponse()`
  - Requires `GEMINI_API_KEY` env var
  - History formatted as `{ role, parts }`
  - Responses are streaming or full text (implementation detail in mock)

- **Authentication:** Email/password stored plaintext in mock (TODO for production: hashing)

## Testing Best Practices

- Test hooks with `renderHook` from React Testing Library
- Wrap hooks/components with `<AuthProvider>` if they use auth context
- Mock `apiService` functions in unit tests, not the mock service directly
- E2E tests use real component rendering via Playwright

---

**Last Updated:** November 2025 | Framework: React 19, Vite, Vitest
