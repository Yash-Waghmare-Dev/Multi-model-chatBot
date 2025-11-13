# Performance Optimization Guide

## Response Time Improvements

I've optimized the chat hook to improve response times and user experience. Here are the key improvements:

### 1. **Instant User Feedback**

- User messages appear immediately when sent
- Loading indicator ("Thinking...") shows up right away
- No waiting for server response before UI updates

### 2. **Optimized Network Requests**

- **Timeout handling**: 60-second timeout prevents hanging requests
- **Retry logic**: Automatic retry on network failures (up to 2 attempts)
- **Abort controller**: Can cancel slow requests if needed

### 3. **Efficient Response Parsing**

- Fast-path for JSON responses (most common case)
- Optimized text response handling
- Reduced overhead in data extraction

### 4. **Better Error Messages**

- Clear timeout error messages
- Network error recovery
- Meaningful error responses to users

## Configuration

You can adjust these settings in `src/hooks/useChat.ts`:

```typescript
const REQUEST_TIMEOUT = 60000; // Max wait time (milliseconds)
const RETRY_ATTEMPTS = 2; // Number of retries on failure
const RETRY_DELAY = 500; // Delay between retries
```

## Server-Side Optimization

If responses are still slow, check your backend:

### 1. **Webhook Performance**

```bash
# Check n8n webhook response times
# Log request/response times in your n8n workflow
```

### 2. **N8N Workflow Optimization**

- **Parallelize operations**: Run multiple steps simultaneously
- **Cache results**: Store frequently requested data
- **Optimize AI calls**: Use faster model endpoints
- **Reduce data processing**: Minimize transformations

### 3. **Network Optimization**

- Use Content Delivery Network (CDN)
- Enable gzip compression on backend
- Optimize API response sizes
- Use HTTP/2 for faster connections

## Frontend Optimization

### 1. **Browser DevTools Analysis**

```bash
# Check Network tab in browser DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Send a message
4. Look at request duration
   - Red: Network time (slow API)
   - Blue: Processing time (could be optimized)
```

### 2. **Code Optimization**

The hook now uses:

- `useCallback` for memoized functions
- Ref-based abort controller for cleanup
- Optimized state updates

### 3. **Rendering Optimization**

- Messages update without full re-render
- Loading state doesn't cause parent re-renders
- Chat window auto-scrolls efficiently

## Monitoring Response Times

### 1. **Add Timing Logs**

Update `src/utils/logger.ts` to track times:

```typescript
export const trackMetric = (label: string, duration: number) => {
  if (import.meta.env.PROD) {
    // Send to analytics
    console.info(`[${label}] ${duration}ms`);
  } else {
    console.log(`[${label}] ${duration}ms`);
  }
};
```

### 2. **Track in useChat Hook**

```typescript
const startTime = performance.now();
const response = await fetchWithTimeout(...);
const duration = performance.now() - startTime;
trackMetric('API Response', duration);
```

## Expected Performance

### Current Metrics

- **User message display**: < 100ms (instant)
- **Loading indicator**: < 100ms (immediate)
- **API request**: Depends on webhook (typically 2-10 seconds)
- **Response display**: < 500ms

### Optimization Target

- **Total perceived time**: 2-5 seconds (fast)
- **Network timeout**: 60 seconds (safety net)
- **Retry recovery**: < 2 seconds

## Debugging Slow Responses

### Step 1: Check Network Tab

```
Browser DevTools → Network tab → Send message
- Look at request duration
- Check response size
- Verify no 500+ errors
```

### Step 2: Check N8N Logs

```
n8n UI → Workflows → Your webhook
- Check execution time
- Look for slow steps
- Verify API connections
```

### Step 3: Add Console Logging

```typescript
// In useChat.ts
console.time('API Call');
const response = await fetch(...);
console.timeEnd('API Call');
```

## Common Issues & Solutions

| Issue            | Cause           | Solution                             |
| ---------------- | --------------- | ------------------------------------ |
| 10+ second delay | Slow API        | Optimize n8n workflow                |
| Timeout errors   | Server slow     | Increase timeout or optimize backend |
| Hanging requests | Network issue   | Implemented retry logic handles this |
| Memory leak      | Missing cleanup | AbortController now handles cleanup  |

## Browser Compatibility

- **Fetch API**: All modern browsers ✓
- **AbortController**: Chrome 66+, Firefox 55+, Safari 11.1+ ✓
- **Performance API**: All modern browsers ✓

## Testing

```bash
# Test the optimizations
npm run dev

# Test loading indicator
1. Open app
2. Send message
3. You should see "Thinking..." immediately
4. Then actual response appears

# Test timeout
1. Stop n8n webhook
2. Send message
3. After 60s, should show timeout error
4. No hanging requests
```

## Next Steps

1. **Monitor response times** in production
2. **Analyze bottlenecks** using DevTools
3. **Optimize backend** if needed
4. **Update webhook URL** to faster endpoint if available
5. **Cache results** for common queries

## Still Having Issues?

Check these:

1. **Webhook URL**: Is it correct and accessible?
2. **N8N workflow**: Is it running and responding?
3. **Network**: Is internet connection stable?
4. **Browser console**: Any error messages?
5. **Network tab**: What's the actual response time?

If response time is 10+ seconds, the issue is likely in your n8n workflow or the AI model being called, not the frontend.
