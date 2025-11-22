# Test-Driven Development Guide

## Overview

This document provides guidelines for adopting Test-Driven Development (TDD) in the ChatArbor v2 project. All new features must follow the TDD approach.

## TDD Workflow

### The Red-Green-Refactor Cycle

```
1. 🔴 RED: Write failing test
   ├─ Define expected behavior
   ├─ Write minimal test to verify behavior
   └─ Test fails (feature doesn't exist yet)
   
2. 🟢 GREEN: Make test pass
   ├─ Write minimum code to pass test
   ├─ Don't worry about perfection
   └─ Test passes!
   
3. ♻️ REFACTOR: Clean up code
   ├─ Improve code quality
   ├─ Remove duplication
   └─ Tests still pass!
```

## Testing Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Test runner & framework |
| **React Testing Library** | Component testing |
| **MSW** | API mocking |
| **Playwright** | E2E testing |
| **@testing-library/jest-dom** | DOM matchers |

## Project Structure

```
tests/
├── setup.ts                    # Global test setup
├── __mocks__/
│   ├── handlers.ts            # MSW API mocks
│   ├── fixtures.ts            # Test data
│   └── server.ts              # MSW server config
├── unit/
│   ├── components/            # Component tests
│   ├── hooks/                 # Hook tests
│   └── services/              # Service tests
├── integration/               # Integration tests
└── e2e/                       # End-to-end tests
```

## Writing Tests

### Example: TDD for New Feature

**Scenario:** Adding job search results component

#### Step 1: Write Test First (RED 🔴)

```typescript
// tests/unit/components/JobResults.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import JobResults from '../../../components/chat/JobResults';

describe('JobResults', () => {
  it('renders list of jobs', () => {
    const jobs = [
      {
        id: 'job-1',
        title: 'Software Engineer',
        company: 'Tech Corp',
        location: 'Remote',
      },
    ];

    render(<JobResults jobs={jobs} />);

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
  });
});
```

**Run test:** `npm run test:watch JobResults.test.tsx`

**Expected:** ❌ Test fails (component doesn't exist)

#### Step 2: Make It Pass (GREEN 🟢)

```typescript
// components/chat/JobResults.tsx
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
}

interface JobResultsProps {
  jobs: Job[];
}

const JobResults: React.FC<JobResultsProps> = ({ jobs }) => {
  return (
    <div>
      {jobs.map(job => (
        <div key={job.id}>
          <h3>{job.title}</h3>
          <p>{job.company}</p>
        </div>
      ))}
    </div>
  );
};

export default JobResults;
```

**Run test:** `npm run test:watch Job Results.test.tsx`

**Expected:** ✅ Test passes!

#### Step 3: Refactor (♻️)

```typescript
// Improve styling, add data-testid, extract constants
const JobResults: React.FC<JobResultsProps> = ({ jobs }) => {
  return (
    <div className="space-y-3" data-testid="job-results">
      {jobs.map(job => (
        <div 
          key={job.id} 
          className="border rounded-lg p-4"
          data-testid={`job-card-${job.id}`}
        >
          <h3 className="font-semibold">{job.title}</h3>
          <p className="text-sm text-neutral-600">{job.company}</p>
        </div>
      ))}
    </div>
  );
};
```

**Run test:** `npm run test:watch JobResults.test.tsx`

**Expected:** ✅ Test still passes!

## Testing Guidelines

### DO ✅

- **Write tests first** before implementation
- **Test behavior** not implementation details
- **Use data-testid** for reliable selectors
- **Mock external dependencies** (APIs, services)
- **Keep tests simple** and focused
- **Use descriptive test names** that explain what's being tested

```typescript
// Good: Descriptive test name
it('shows error message when API call fails', () => {
  // test implementation
});

// Bad: Vague test name
it('works correctly', () => {
  // test implementation
});
```

### DON'T ❌

- **Don't test implementation details** (CSS classes, internal state)
- **Don't write tests after code** (defeats TDD purpose)
- **Don't make tests dependent** on each other
- **Don't test third-party libraries**
- **Don't over-mock** - only mock what's necesary

```typescript
// Bad: Testing CSS classes (implementation detail)
expect(element).toHaveClass('bg-primary');

// Good: Testing behavior
expect(element).toHaveAttribute('data-testid', 'user-message');
expect(element).toHaveTextContent('Hello');
```

## Common Test Patterns

### Component Rendering

```typescript
it('renders component with props', () => {
  render(<MyComponent title="Hello" />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### User Interactions

```typescript
it('calls callback when button clicked', async () => {
  const user = userEvent.setup();
  const mockFn = vi.fn();
  
  render(<Button onClick={mockFn}>Click me</Button>);
  await user.click(screen.getByRole('button'));
  
  expect(mockFn).toHaveBeenCalledTimes(1);
});
```

### Async Operations

```typescript
it('loads data on mount', async () => {
  render(<DataComponent />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### API Mocking with MSW

```typescript
// tests/__mocks__/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/jobs', async () => {
    return HttpResponse.json({ jobs: [/* mock data */] });
  }),
];
```

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (TDD workflow)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run specific test file
npm run test:watch -- JobResults.test.tsx
```

## Coverage Requirements

| Category | Minimum Coverage |
|----------|-----------------|
| Components | 90% |
| Hooks | 95% |
| Services | 85% |
| Utils | 95% |
| **Overall** | **85%** |

## CI/CD Integration

Tests must pass before merge:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Best Practices

### 1. Arrange-Act-Assert Pattern

```typescript
it('increments counter when button clicked', async () => {
  // Arrange
  const user = userEvent.setup();
  render(<Counter initialValue={0} />);
  
  // Act
  await user.click(screen.getByRole('button', { name: /increment/i }));
  
  // Assert
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### 2. Test One Thing at a Time

```typescript
// Good: Focused test
it('displays error when email is invalid', () => {
  // Single responsibility
});

it('displays error when password is too short', () => {
  // Different responsibility
});

// Bad: Testing multiple things
it('validates form correctly', () => {
  // Tests email, password, submission all at once
});
```

### 3. Use Descriptive Variable Names

```typescript
// Good
const mockJobs = [{ id: '1', title: 'Engineer' }];
const mockOnJobClick = vi.fn();

// Bad
const data = [{ id: '1', title: 'Engineer' }];
const fn = vi.fn();
```

## Debugging Tests

### View Test Output

```bash
# Run with verbose output
npm run test -- --reporter=verbose

# Run with UI for debugging
npm run test:ui
```

### Common Issues

**Issue:** Test fails but code works in browser
**Solution:** Check if mocks are set up correctly

**Issue:** "Element not found"
**Solution:** Use `screen.debug()` to see rendered output

```typescript
it('renders component', () => {
  render(<MyComponent />);
  screen.debug(); // Prints DOM to console
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Remember:** TDD is not just about testing - it's about **designing better code** through tests.
