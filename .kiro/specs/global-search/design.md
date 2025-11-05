# Design Document

## Overview

The global search feature will be implemented as a command palette-style interface that overlays the main application. It will use React Query for data fetching, debouncing for performance, and keyboard navigation for accessibility. The search will be accessible from the top navigation bar and via keyboard shortcut (Ctrl/Cmd+K).

## Architecture

### Component Structure

```
GlobalSearch (Container)
├── SearchInput (Input with keyboard handling)
├── SearchResults (Results display)
│   ├── SearchCategory (Flights, Aircraft, Users, etc.)
│   │   ├── SearchResultItem
│   │   ├── SearchResultItem
│   │   └── ViewAllButton
│   └── EmptyState / ErrorState
└── SearchHistory (Recent searches)
```

### Data Flow

1. User types in search input
2. Debounce function waits 300ms
3. Search hook triggers API calls to multiple endpoints
4. Results are aggregated and categorized
5. UI updates with categorized results
6. User navigates with keyboard or mouse
7. Selected item navigates to detail page

## Components and Interfaces

### 1. GlobalSearch Component

**Location**: `src/components/shared/GlobalSearch.tsx`

**Props**:
```typescript
interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**State**:
```typescript
const [query, setQuery] = useState('');
const [selectedIndex, setSelectedIndex] = useState(0);
const [activeCategory, setActiveCategory] = useState<string | null>(null);
```

**Features**:
- Modal overlay with backdrop
- Keyboard event listeners (Escape, Arrow keys, Enter)
- Focus management
- Search history display when empty

### 2. SearchInput Component

**Location**: `src/components/shared/GlobalSearch/SearchInput.tsx`

**Props**:
```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  isLoading: boolean;
}
```

**Features**:
- Auto-focus on mount
- Clear button
- Loading spinner
- Character count indicator
- Keyboard shortcut display

### 3. SearchResults Component

**Location**: `src/components/shared/GlobalSearch/SearchResults.tsx`

**Props**:
```typescript
interface SearchResultsProps {
  results: SearchResultsData;
  query: string;
  selectedIndex: number;
  onSelect: (item: SearchResultItem) => void;
  onNavigate: (direction: 'up' | 'down') => void;
}
```

**Features**:
- Categorized results display
- Highlight matched text
- Result icons
- "View All" buttons
- Empty state
- Error state

### 4. SearchResultItem Component

**Location**: `src/components/shared/GlobalSearch/SearchResultItem.tsx`

**Props**:
```typescript
interface SearchResultItemProps {
  item: SearchResultItem;
  query: string;
  isSelected: boolean;
  onClick: () => void;
}

interface SearchResultItem {
  id: string;
  type: 'flight' | 'aircraft' | 'user' | 'organization' | 'report';
  title: string;
  subtitle: string;
  metadata: string;
  icon: LucideIcon;
  url: string;
}
```

**Features**:
- Hover and selected states
- Icon display
- Highlighted text
- Metadata badges
- Click and keyboard navigation

### 5. useGlobalSearch Hook

**Location**: `src/hooks/useGlobalSearch.ts`

**Interface**:
```typescript
interface UseGlobalSearchOptions {
  query: string;
  enabled: boolean;
  debounceMs?: number;
}

interface UseGlobalSearchReturn {
  results: SearchResultsData;
  isLoading: boolean;
  error: Error | null;
  totalResults: number;
}

interface SearchResultsData {
  flights: SearchResultItem[];
  aircraft: SearchResultItem[];
  users: SearchResultItem[];
  organizations: SearchResultItem[];
  reports: SearchResultItem[];
}
```

**Implementation**:
```typescript
export const useGlobalSearch = ({ query, enabled, debounceMs = 300 }: UseGlobalSearchOptions) => {
  const debouncedQuery = useDebounce(query, debounceMs);
  
  const { data: flights, isLoading: flightsLoading } = useQuery({
    queryKey: ['search', 'flights', debouncedQuery],
    queryFn: () => apiService.searchFlights(debouncedQuery),
    enabled: enabled && debouncedQuery.length >= 3,
  });
  
  // Similar queries for aircraft, users, organizations, reports
  
  return {
    results: {
      flights: transformFlights(flights),
      aircraft: transformAircraft(aircraft),
      users: transformUsers(users),
      organizations: transformOrganizations(organizations),
      reports: transformReports(reports),
    },
    isLoading: flightsLoading || aircraftLoading || usersLoading || organizationsLoading || reportsLoading,
    error: flightsError || aircraftError || usersError || organizationsError || reportsError,
    totalResults: (flights?.length || 0) + (aircraft?.length || 0) + (users?.length || 0) + (organizations?.length || 0) + (reports?.length || 0),
  };
};
```

### 6. useDebounce Hook

**Location**: `src/hooks/useDebounce.ts`

**Interface**:
```typescript
function useDebounce<T>(value: T, delay: number): T
```

**Implementation**:
```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### 7. useSearchHistory Hook

**Location**: `src/hooks/useSearchHistory.ts`

**Interface**:
```typescript
interface UseSearchHistoryReturn {
  history: string[];
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  removeFromHistory: (query: string) => void;
}
```

**Implementation**:
```typescript
export const useSearchHistory = (): UseSearchHistoryReturn => {
  const [history, setHistory] = useState<string[]>(() => {
    const stored = localStorage.getItem('search_history');
    return stored ? JSON.parse(stored) : [];
  });

  const addToHistory = (query: string) => {
    if (query.length < 3) return;
    
    const newHistory = [query, ...history.filter(h => h !== query)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('search_history');
  };

  const removeFromHistory = (query: string) => {
    const newHistory = history.filter(h => h !== query);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  return { history, addToHistory, clearHistory, removeFromHistory };
};
```

## Data Models

### SearchResultItem

```typescript
interface SearchResultItem {
  id: string;
  type: 'flight' | 'aircraft' | 'user' | 'organization' | 'report';
  title: string;
  subtitle: string;
  metadata: string;
  icon: LucideIcon;
  url: string;
  badge?: {
    text: string;
    variant: 'default' | 'success' | 'warning' | 'destructive';
  };
}
```

### Transform Functions

```typescript
// Transform flight data to search result
function transformFlight(flight: any): SearchResultItem {
  return {
    id: flight.id,
    type: 'flight',
    title: flight.flight_id || flight.id,
    subtitle: flight.aircraft_name || 'Unknown Aircraft',
    metadata: formatDate(flight.created_at),
    icon: Activity,
    url: `/analysis?flight=${flight.id}`,
    badge: {
      text: flight.status,
      variant: flight.status === 'completed' ? 'success' : 'default',
    },
  };
}

// Transform aircraft data to search result
function transformAircraft(aircraft: any): SearchResultItem {
  return {
    id: aircraft.id,
    type: 'aircraft',
    title: aircraft.name || aircraft.registration,
    subtitle: aircraft.aircraft_type || 'Unknown Type',
    metadata: aircraft.registration,
    icon: Plane,
    url: `/fleet?aircraft=${aircraft.id}`,
    badge: {
      text: aircraft.operational_status,
      variant: aircraft.operational_status === 'active' ? 'success' : 'warning',
    },
  };
}

// Similar transforms for users, organizations, reports
```

## API Integration

### Backend Endpoints

The search will use existing endpoints with query parameters:

```typescript
// Flights
GET /api/v2/analyses?search={query}&limit=5

// Aircraft
GET /api/v2/aircraft?search={query}&limit=5

// Users
GET /api/v2/users?search={query}&limit=5

// Organizations
GET /api/v2/organizations?search={query}&limit=5

// Reports
GET /api/v2/reports?search={query}&limit=5
```

### API Service Methods

**Location**: `src/lib/api.ts`

```typescript
class ApiService {
  // Add search methods
  async searchFlights(query: string, limit: number = 5) {
    return this.request<any[]>(`/api/v2/analyses?search=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async searchAircraft(query: string, limit: number = 5) {
    return this.request<any[]>(`/api/v2/aircraft?search=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async searchUsers(query: string, limit: number = 5) {
    return this.request<any[]>(`/api/v2/users?search=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async searchOrganizations(query: string, limit: number = 5) {
    return this.request<any[]>(`/api/v2/organizations?search=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async searchReports(query: string, limit: number = 5) {
    return this.request<any[]>(`/api/v2/reports?search=${encodeURIComponent(query)}&limit=${limit}`);
  }
}
```

## Error Handling

### Error States

1. **Network Error**: Display "Unable to connect. Check your internet connection."
2. **API Error**: Display "Search temporarily unavailable. Please try again."
3. **No Results**: Display "No results found for '{query}'. Try different keywords."
4. **Minimum Characters**: Display "Type at least 3 characters to search."

### Error Recovery

- Automatic retry with exponential backoff
- Fallback to cached results if available
- Clear error message with retry button
- Log errors to console for debugging

## Testing Strategy

### Unit Tests

1. **useDebounce Hook**
   - Test debounce delay
   - Test value updates
   - Test cleanup

2. **useSearchHistory Hook**
   - Test adding to history
   - Test clearing history
   - Test localStorage persistence
   - Test maximum history size

3. **Transform Functions**
   - Test flight transformation
   - Test aircraft transformation
   - Test user transformation
   - Test edge cases (missing data)

### Integration Tests

1. **GlobalSearch Component**
   - Test search input
   - Test keyboard navigation
   - Test result selection
   - Test empty state
   - Test error state

2. **Search API Integration**
   - Test successful search
   - Test failed search
   - Test debouncing
   - Test cancellation

### E2E Tests

1. Open search with Ctrl+K
2. Type search query
3. Navigate results with arrow keys
4. Select result with Enter
5. Verify navigation to correct page

## Performance Optimization

### Debouncing

- 300ms delay before triggering search
- Cancel previous requests when new search starts
- Prevent unnecessary API calls

### Caching

- Cache search results for 30 seconds
- Use React Query's built-in caching
- Invalidate cache on data mutations

### Lazy Loading

- Load search component only when needed
- Use React.lazy() for code splitting
- Preload on hover over search icon

### Virtualization

- Use virtual scrolling for large result sets
- Render only visible items
- Improve performance with 100+ results

## Accessibility

### Keyboard Navigation

- **Ctrl/Cmd+K**: Open search
- **Escape**: Close search
- **Arrow Down**: Next result
- **Arrow Up**: Previous result
- **Enter**: Select result
- **Tab**: Navigate between categories

### Screen Reader Support

- ARIA labels for all interactive elements
- Announce result count
- Announce selected item
- Announce loading state

### Focus Management

- Auto-focus search input on open
- Trap focus within modal
- Restore focus on close
- Visible focus indicators

## Mobile Considerations

### Responsive Design

- Full-screen modal on mobile
- Touch-friendly result items (min 44px height)
- Swipe to dismiss
- Virtual keyboard handling

### Performance

- Reduce debounce delay on mobile (200ms)
- Limit results per category (3 on mobile)
- Optimize for slower connections
- Progressive loading

## Security Considerations

### Input Sanitization

- Escape special characters in search query
- Prevent XSS attacks
- Validate query length (max 100 characters)
- Rate limiting on client side

### Data Privacy

- Don't log sensitive search queries
- Anonymize search analytics
- Clear search history on logout
- Respect user privacy settings

## Implementation Phases

### Phase 1: Basic Search (MVP)
- Search input component
- Search flights and aircraft
- Basic results display
- Keyboard shortcuts (Ctrl+K, Escape)

### Phase 2: Enhanced Features
- Search users and organizations
- Search history
- Keyboard navigation (arrows, enter)
- Highlight matched text

### Phase 3: Advanced Features
- Smart filtering
- Search analytics
- Mobile optimization
- Performance improvements

### Phase 4: Polish
- Animations and transitions
- Advanced keyboard shortcuts
- Search suggestions
- Voice search (future)

## Success Metrics

- Search response time < 500ms
- 90%+ search success rate (results found)
- 50%+ of searches result in navigation
- 0 critical errors in production
- Positive user feedback on usability
