---
name: frontend-expert
description: Expert guidance on modern frontend development including React, TypeScript, CSS, accessibility, performance, and UX best practices. Use when building UI components, debugging frontend issues, optimizing performance, or implementing responsive designs.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
model: sonnet
---

# Frontend Expert

Expert guidance for modern frontend development with React, TypeScript, and best practices.

## When to Use This Skill

- Building React components and hooks
- Implementing responsive layouts and CSS
- TypeScript type definitions and safety
- Performance optimization (bundle size, rendering, lazy loading)
- Accessibility (WCAG 2.1 AA/AAA compliance)
- State management (React Query, Context, Zustand)
- Form handling and validation
- Error boundaries and error handling
- Testing (unit, integration, e2e)

## Core Principles

### 1. Component Architecture
- **Single Responsibility**: Each component does one thing well
- **Composition over Inheritance**: Build complex UIs from simple components
- **Props Interface**: Clear, typed interfaces for component props
- **Children Pattern**: Use `children` prop for flexible composition
- **Custom Hooks**: Extract reusable logic into hooks

### 2. React Best Practices
- Use functional components with hooks
- Memoize expensive computations with `useMemo`
- Prevent unnecessary re-renders with `useCallback` and `React.memo`
- Keep components small (<200 lines)
- Colocate related code (styles, tests, types)
- Use React Query for server state
- Use Context sparingly (only for truly global state)

### 3. TypeScript Guidelines
- Explicit return types for functions
- Avoid `any` - use `unknown` if type is truly unknown
- Use discriminated unions for state variants
- Interface for public APIs, type for internal use
- Generic components for reusability
- Proper null/undefined handling

### 4. Performance Optimization
- Code splitting with `React.lazy()` and `Suspense`
- Virtual scrolling for long lists (react-window, react-virtuoso)
- Image optimization (WebP, lazy loading, responsive images)
- Bundle analysis (webpack-bundle-analyzer)
- Debounce/throttle expensive operations
- Memoization for derived state
- Avoid inline functions in JSX (when performance critical)

### 5. Accessibility (a11y)
- Semantic HTML (`<button>`, `<nav>`, `<main>`, etc.)
- ARIA attributes when semantic HTML isn't enough
- Keyboard navigation (focus management, tab order)
- Color contrast ratio 4.5:1 minimum (WCAG AA)
- Alt text for images
- Form labels and error messages
- Screen reader testing
- Focus indicators visible

### 6. CSS Best Practices
- Mobile-first responsive design
- CSS custom properties for theming
- Flexbox for 1D layouts, Grid for 2D layouts
- BEM naming convention or CSS modules
- Avoid !important
- Use rem/em for scalability
- CSS-in-JS for component-scoped styles (styled-components, emotion)

### 7. Error Handling
- Error boundaries for component errors
- Axios interceptors for API errors
- User-friendly error messages
- Retry logic for network failures
- Loading and error states for async operations
- Toast notifications for user feedback

### 8. State Management Patterns
- **Server State**: React Query (fetching, caching, synchronization)
- **URL State**: React Router (navigation, search params)
- **Local State**: useState (component-specific)
- **Form State**: React Hook Form, Formik
- **Global Client State**: Context API, Zustand (minimal use)

## Common Patterns

### Custom Hook Pattern
```typescript
function useRealtimeData<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const ws = new WebSocket(endpoint);
    ws.onmessage = (event) => setData(JSON.parse(event.data));
    ws.onerror = (error) => setError(error);
    return () => ws.close();
  }, [endpoint]);

  return { data, error };
}
```

### Error Boundary Pattern
```typescript
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### Compound Component Pattern
```typescript
const Tabs = ({ children }: Props) => {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
};

Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panels = TabPanels;
Tabs.Panel = TabPanel;
```

## Code Review Checklist

When reviewing frontend code, check:

- [ ] TypeScript types are explicit and correct
- [ ] No console.log statements in production code
- [ ] Accessibility: semantic HTML, ARIA, keyboard navigation
- [ ] Error handling: try-catch, error boundaries, fallbacks
- [ ] Performance: memoization, lazy loading, bundle size
- [ ] Responsive design: works on mobile, tablet, desktop
- [ ] Loading states for async operations
- [ ] Empty states when no data
- [ ] Proper key props in lists
- [ ] No inline functions in JSX (if performance critical)
- [ ] CSS organized and scoped
- [ ] No hardcoded strings (use i18n if needed)
- [ ] Form validation and error messages

## Performance Red Flags

Watch out for:
- Large bundle sizes (>500KB gzipped)
- Unnecessary re-renders (use React DevTools Profiler)
- Unoptimized images (large PNGs instead of WebP)
- Synchronous layout thrashing (reading layout properties in loops)
- Memory leaks (uncleared intervals, event listeners)
- Blocking the main thread (heavy computations without web workers)

## Testing Priorities

1. **Critical user flows** (login, checkout, main features)
2. **Edge cases** (empty states, error states, loading states)
3. **Accessibility** (keyboard navigation, screen readers)
4. **Responsive design** (mobile, tablet, desktop)
5. **Browser compatibility** (Chrome, Firefox, Safari, Edge)

## Resources

- React Docs: https://react.dev
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- MDN Web Docs: https://developer.mozilla.org
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- React Query: https://tanstack.com/query/latest
- Web.dev Performance: https://web.dev/performance/
