# Vercel Deployment Optimization Guide

## Problem Identified
- **Vercel Server**: Germany (fra1)
- **WordPress Backend**: Bulgaria
- **Issue**: Geographic latency causing slow GraphQL requests (~10 seconds)

## Solutions Implemented

### 1. ✅ Vercel Region Configuration
- Set region to `fra1` (Frankfurt) - closest to Bulgaria
- See `vercel.json`

### 2. ✅ ISR (Incremental Static Regeneration)
- Home page cached for 1 hour
- Product pages cached for 30 minutes
- Background revalidation keeps cache fresh
- See `nuxt.config.ts` → `routeRules`

### 3. ✅ Client-Side Caching
- LocalStorage cache (30 minutes TTL)
- Instant page loads on repeat visits
- See `useProductCache` composable

### 4. ✅ Background Preloading
- Products preload on home page visit
- Non-blocking after 2 seconds
- See `woonuxt_base/app/pages/index.vue`

### 5. ✅ Optimized Data Fetching
- Reduced from 1000 → 300 products
- Prevents timeouts
- Faster responses

## Expected Performance

### Before Optimization
- First visit: 10+ seconds ❌
- Subsequent visits: 10+ seconds ❌
- Hard refresh: 10+ seconds ❌

### After Optimization
- **First visit**: 3-5 seconds ✅ (server cache)
- **Subsequent visits**: ~100ms ✅ (client cache)
- **Hard refresh**: 3-5 seconds ✅ (server cache)
- **After cache**: ~100ms ✅ (ISR cache)

## Deployment Steps

1. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat: optimize Vercel deployment for Bulgaria backend"
   git push
   ```

2. **Vercel will auto-deploy** with:
   - Frankfurt region (fra1)
   - ISR enabled
   - Route caching

3. **First deployment**: Will be slow (cold cache)
4. **After 1st visit**: All subsequent visits will be fast!

## Further Optimizations (Optional)

### Option 1: Move Vercel Region Even Closer
If Vercel has a region closer to Bulgaria:
```json
// vercel.json
{
  "regions": ["arn1"]  // Stockholm, Sweden (if closer)
}
```

### Option 2: Use CDN for WordPress
- Add Cloudflare in front of WordPress
- Reduces latency significantly
- Cache GraphQL responses

### Option 3: Upgrade WordPress Hosting
- Consider WordPress host with:
  - Better network connectivity
  - Faster response times
  - Object caching (Redis/Memcached)

### Option 4: Reduce Data Payload
Currently fetching:
- 300 products per page
- Can reduce to 100-200 if needed

## Monitoring

After deployment, check:

1. **Vercel Analytics** → Response times
2. **Browser DevTools** → Network tab
3. **First load**: Should be 3-5 seconds (acceptable)
4. **Cached loads**: Should be <500ms (excellent)

## Cache Invalidation

To force cache refresh:
1. Vercel will auto-revalidate in background
2. Or trigger manual revalidation in Vercel dashboard
3. LocalStorage cache auto-expires after 30 minutes

## Support

If still slow after these optimizations:
1. Check WordPress server response time
2. Consider WordPress optimization plugins
3. Enable WordPress object caching
4. Consider moving Vercel to same datacenter as WordPress

---

**Note**: Geographic latency is unavoidable, but caching makes it a non-issue for most users!

