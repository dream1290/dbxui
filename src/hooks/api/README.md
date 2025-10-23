# API Hooks - Query Key Patterns

This document defines the query key patterns used across the application to ensure proper query deduplication and cache management.

## Query Key Structure

All query keys follow a hierarchical structure: `[domain, ...identifiers, ...filters]`

### Domains

- `flights` - Flight analysis data
- `aircraft` - Aircraft and fleet data
- `users` - User management data
- `organizations` - Organization data
- `reports` - Report generation and analytics
- `system` - System status and metrics
- `notifications` - User notifications
- `api-keys` - API key management
- `profile` - Current user profile

## Query Key Patterns

### Flights
```typescript
['flights']                          // All flights
['flights', options]                 // Flights with filters (limit, autoRefresh)
['flights', 'infinite']              // Infinite scroll flights
['flights', id]                      // Single flight by ID
```

### Aircraft
```typescript
['aircraft']                         // All aircraft
['aircraft', id]                     // Single aircraft by ID
['aircraft-types']                   // Aircraft types (rarely changes)
```

### Users
```typescript
['users']                            // All users
['users', id]                        // Single user by ID
['users', 'activity', limit]         // User activity log
```

### Organizations
```typescript
['organizations']                    // All organizations
['organizations', id]                // Single organization by ID
```

### Reports
```typescript
['reports']                          // All reports
['reports', id]                      // Single report by ID
```

### System
```typescript
['system', 'status']                 // System status
['system', 'metrics']                // System metrics
['system', 'health']                 // System health
['system', 'logs']                   // System logs
['system', 'database']               // Database status
['system', 'settings']               // System settings
```

### Notifications
```typescript
['notifications']                    // All notifications
```

### API Keys
```typescript
['api-keys']                         // All API keys
```

### Profile
```typescript
['profile']                          // Current user profile
```

## Cache Invalidation Patterns

### On Create
Invalidate the list query:
```typescript
queryClient.invalidateQueries({ queryKey: ['domain'] });
```

### On Update
Invalidate both list and detail queries:
```typescript
queryClient.invalidateQueries({ queryKey: ['domain'] });
queryClient.invalidateQueries({ queryKey: ['domain', id] });
```

### On Delete
Invalidate the list query:
```typescript
queryClient.invalidateQueries({ queryKey: ['domain'] });
```

## Deduplication Benefits

1. **Automatic Request Deduplication**: Multiple components requesting the same data will share a single network request
2. **Shared Cache**: All components using the same query key will receive updates when the cache is updated
3. **Optimistic Updates**: Mutations can update the cache immediately for instant UI feedback
4. **Selective Invalidation**: Precise cache invalidation ensures only affected queries are refetched

## Best Practices

1. **Consistent Keys**: Always use the same key structure for the same data
2. **Include Filters**: Add filter parameters to query keys to ensure different filtered views don't share cache
3. **Hierarchical Structure**: Use array structure to enable partial invalidation (e.g., `['users']` invalidates all user queries)
4. **Stable References**: Use primitive values in query keys, not objects (unless serialized)
