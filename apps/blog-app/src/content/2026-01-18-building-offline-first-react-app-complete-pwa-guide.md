---
title: Building an Offline-First React App - A Complete Guide to PWA Implementation
slug: 2026-01-18-building-offline-first-react-app-complete-pwa-guide
description: A comprehensive guide to transforming a React + Vite application into a fully functional offline-capable PWA with service workers, caching strategies, and production deployment.
categories: ['react', 'pwa', 'vite', 'web-development', 'offline', 'service-workers', 'workbox', 'performance']
coverImage: https://dalenguyen.me/assets/images/blog/pwa-offline-app.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-01-18T00:00:00.000Z
author: Dale Nguyen
---

## Introduction

In today's mobile-first world, users expect applications to work seamlessly regardless of their network conditions. Whether they're in a subway tunnel, on a spotty coffee shop WiFi, or experiencing network outages, your web application should continue to function. This is where Progressive Web Apps (PWAs) shine.

In this comprehensive guide, I'll walk you through the complete process of transforming a React + Vite application into a fully functional offline-capable PWA. By the end, you'll have an app that:

- Works without an internet connection after the initial visit
- Loads instantly from cache
- Can be installed like a native app on any device
- Automatically updates when new versions are deployed
- Provides a seamless user experience across all network conditions

Demo: https://gcp-exams.vercel.app/

## Why PWA? The Business Case

Before diving into implementation, let's understand why offline functionality matters:

### User Experience Benefits
- **Reliability**: App works in any network condition
- **Performance**: Instant loading from cache (up to 10x faster)
- **Engagement**: Users spend 3x more time in installed PWAs
- **Accessibility**: Works in low-connectivity regions

### Business Benefits
- **Reduced Bounce Rate**: No "no internet" error pages
- **Increased Conversions**: Users can complete actions offline
- **Lower Infrastructure Costs**: Reduced server requests
- **Better SEO**: Google favors fast, reliable sites

### Technical Benefits
- **Single Codebase**: No separate native app needed
- **Automatic Updates**: No app store approval process
- **Cross-Platform**: Works on iOS, Android, and desktop
- **Progressive Enhancement**: Falls back gracefully on older browsers

## Project Overview

We'll be adding PWA capabilities to a React 19 + TypeScript + Vite application (a GCP exam study app). The tech stack:

- **React**: 19.2.0
- **Vite**: 7.2.4
- **TypeScript**: 5.9.3
- **vite-plugin-pwa**: For service worker generation
- **Workbox**: For advanced caching strategies

## Architecture Overview

A PWA consists of three main components:

1. **Service Worker**: A JavaScript file that runs in the background, intercepts network requests, and manages caching
2. **Web App Manifest**: A JSON file that defines how your app appears when installed
3. **HTTPS**: Required for service workers (development can use localhost)

Here's how they work together:

```
User Request → Service Worker → Cache Check
                     ↓
              [Cache Hit] → Return Cached Response
                     ↓
              [Cache Miss] → Fetch from Network → Cache Response → Return
```

## Implementation: Step-by-Step Guide

### Step 1: Install Required Dependencies

First, let's install the PWA plugin for Vite and the Workbox client library:

```bash
npm install -D vite-plugin-pwa workbox-window
```

**What these packages do:**
- `vite-plugin-pwa`: Integrates Workbox with Vite, automatically generates service workers
- `workbox-window`: Provides a window-friendly interface to interact with service workers

### Step 2: Configure Vite for PWA

Update your `vite.config.ts` to include the PWA plugin with comprehensive caching strategies:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Automatically update service worker when new version is available
      registerType: 'autoUpdate',

      // Include these assets in the precache
      includeAssets: ['vite.svg'],

      // Web App Manifest configuration
      manifest: {
        name: 'Gen AI Study App',
        short_name: 'AI Study',
        description: 'AI Study Application with offline support',
        theme_color: '#646cff',
        background_color: '#ffffff',
        display: 'standalone', // Opens as standalone app when installed
        icons: [
          {
            src: 'vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable' // For better icon display on Android
          }
        ]
      },

      // Workbox configuration for caching strategies
      workbox: {
        // Files to precache (loaded when service worker installs)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // Runtime caching strategies for different resource types
        runtimeCaching: [
          {
            // Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst', // Check cache first, then network
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Google Fonts webfonts
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // API calls - network first with cache fallback
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst', // Try network first, fallback to cache
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              networkTimeoutSeconds: 10 // Fallback to cache after 10s
            }
          }
        ]
      },

      // Enable PWA in development mode for testing
      devOptions: {
        enabled: true
      }
    })
  ],
  base: './', // Ensures assets load correctly on any hosting platform
})
```

**Understanding Caching Strategies:**

1. **Cache First (CacheFirst)**: Check cache first, only fetch from network if not found. Perfect for static assets that rarely change.

2. **Network First (NetworkFirst)**: Try network first, fallback to cache if offline. Ideal for API calls and dynamic content.

3. **Stale While Revalidate (StaleWhileRevalidate)**: Return cached version immediately, update cache in background. Best for frequently updated content.

4. **Network Only (NetworkOnly)**: Always fetch from network, no caching. Use for real-time data.

5. **Cache Only (CacheOnly)**: Only use cached responses. Useful for offline-only features.

### Step 3: Update HTML with PWA Meta Tags

Enhance your `index.html` with PWA-specific meta tags for better mobile support:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="AI Study Application with offline support" />

    <!-- Theme color for browser UI -->
    <meta name="theme-color" content="#646cff" />

    <!-- PWA Meta Tags for iOS -->
    <link rel="apple-touch-icon" href="/vite.svg" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="AI Study" />

    <title>Gen AI Study App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Meta Tag Explanations:**

- `theme-color`: Colors the browser's UI elements on mobile
- `apple-touch-icon`: Icon shown when added to iOS home screen
- `apple-mobile-web-app-capable`: Enables standalone mode on iOS
- `apple-mobile-web-app-status-bar-style`: Controls iOS status bar appearance

### Step 4: Register the Service Worker

Update your `src/main.tsx` to register the service worker and handle updates:

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Register service worker for PWA offline support
const updateSW = registerSW({
  onNeedRefresh() {
    // Prompt user when new version is available
    if (confirm('New content available. Reload to update?')) {
      updateSW(true) // Force update and reload
    }
  },
  onOfflineReady() {
    // Notify user that app is ready to work offline
    console.log('App ready to work offline')
    // You could show a toast notification here
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Service Worker Lifecycle:**

1. **Install**: Service worker downloads and caches specified assets
2. **Activate**: Old service worker is removed, new one takes control
3. **Fetch**: Intercepts network requests and serves cached responses
4. **Update**: Detects new version and triggers `onNeedRefresh`

### Step 5: Add TypeScript Definitions

Create `src/vite-env.d.ts` to add TypeScript support for PWA types:

```typescript
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
```

This enables IntelliSense and type checking for PWA-specific APIs.

### Step 6: Update .gitignore

Add PWA development artifacts to `.gitignore`:

```gitignore
# Build outputs
dist
dist-ssr
dev-dist  # PWA development build artifacts

# Dependencies
node_modules
```

## Understanding the Generated Files

When you build your app, the PWA plugin generates several files:

### 1. manifest.webmanifest
```json
{
  "name": "Gen AI Study App",
  "short_name": "AI Study",
  "description": "AI Study Application with offline support",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#646cff",
  "icons": [...]
}
```

This tells the browser how to install and display your app.

### 2. sw.js (Service Worker)
A JavaScript file that:
- Intercepts network requests
- Serves cached content when offline
- Updates cache with new content
- Handles different caching strategies

### 3. workbox-[hash].js
The Workbox runtime library that powers the service worker.

## Testing Your PWA

### Production Build Testing

PWAs only work in production mode. Here's how to test:

```bash
# 1. Build the production version
npm run build

# 2. Start the preview server
npm run preview

# 3. Open in browser
# Navigate to http://localhost:4173
```

### Method 1: Chrome DevTools Testing

The most comprehensive way to test your PWA:

**1. Verify Service Worker Registration:**
- Open Chrome DevTools (F12)
- Go to **Application** tab
- Click **Service Workers** in the left sidebar
- You should see your service worker registered and "activated"

**2. Test Offline Functionality:**
- In DevTools, go to **Network** tab
- Check the **"Offline"** checkbox at the top
- Refresh the page (Ctrl+R or Cmd+R)
- The app should load from cache!

**3. Inspect Cache Storage:**
- Application tab → **Cache Storage**
- Expand the cache entries
- You'll see all cached assets (HTML, CSS, JS, images)
- Click on any item to view cached content

**4. Test Service Worker Updates:**
- Make a change to your app
- Run `npm run build` again
- Deploy or refresh in preview mode
- You should see the update prompt!

### Method 2: Lighthouse Audit

Google Lighthouse provides a comprehensive PWA score:

```bash
# In Chrome DevTools
1. Open DevTools
2. Go to Lighthouse tab
3. Select "Progressive Web App"
4. Click "Generate report"
```

You should score 90+ in all categories for a proper PWA.

### Method 3: Real-World Testing

Simulate real network conditions:

**In Chrome DevTools:**
- Network tab → Throttling dropdown
- Select "Slow 3G" or "Offline"
- Test app performance

**On Mobile:**
- Enable airplane mode
- Try to use the app
- All cached content should work

## Advanced Caching Strategies

### Custom Cache Management

You can implement custom caching logic for specific scenarios:

```typescript
// In vite.config.ts workbox options
workbox: {
  runtimeCaching: [
    // Cache images with size limits
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 60, // Max 60 images
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },

    // Stale-while-revalidate for frequently changing content
    {
      urlPattern: /\/api\/news\/.*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'news-cache',
        expiration: {
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
      },
    },

    // Network-only for authentication
    {
      urlPattern: /\/api\/auth\/.*/,
      handler: 'NetworkOnly',
    },
  ],
}
```

### Background Sync

For handling form submissions while offline:

```typescript
// Install workbox-background-sync
npm install workbox-background-sync

// In your service worker
import { BackgroundSyncPlugin } from 'workbox-background-sync'

const bgSyncPlugin = new BackgroundSyncPlugin('formQueue', {
  maxRetentionTime: 24 * 60 // Retry for 24 hours
})

registerRoute(
  /\/api\/submit-form/,
  new NetworkOnly({
    plugins: [bgSyncPlugin]
  }),
  'POST'
)
```

### Push Notifications

Enable push notifications for better engagement:

```typescript
// Request notification permission
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'YOUR_PUBLIC_VAPID_KEY'
  })

  // Send subscription to your server
  await fetch('/api/push-subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: { 'Content-Type': 'application/json' }
  })
}
```

## Troubleshooting Common Issues

### Issue 1: Service Worker Not Updating

**Symptoms**: Changes don't appear even after rebuild

**Solutions**:
```javascript
// 1. Force update in DevTools
Application → Service Workers → Click "Update"

// 2. Unregister old service worker
Application → Service Workers → Click "Unregister"

// 3. Clear all caches
Application → Cache Storage → Right-click → Delete

// 4. Hard refresh
Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Issue 2: PWA Not Installable

**Check these requirements**:
- [ ] Served over HTTPS (or localhost)
- [ ] Has a web app manifest with:
  - [ ] `name` or `short_name`
  - [ ] `icons` array with 192px and 512px icons
  - [ ] `start_url`
  - [ ] `display` mode
- [ ] Has a registered service worker
- [ ] Service worker has a fetch event handler

**Verify in DevTools**:
```
Application → Manifest
Look for "Installability" errors
```

### Issue 3: Assets Not Caching

**Debugging steps**:

```javascript
// 1. Check glob patterns in vite.config.ts
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg}']
}

// 2. Verify assets are in dist folder after build
ls dist/

// 3. Check service worker console
DevTools → Application → Service Workers → Click on sw.js
Look for console logs

// 4. Inspect network requests
Network tab → Filter by "sw.js"
Check if assets are served from Service Worker
```

### Issue 4: Different Behavior in Dev vs Production

**Remember**: PWA features only work properly in production!

```bash
# DON'T test with:
npm run dev  # Vite dev server (port 5173)

# DO test with:
npm run build && npm run preview  # Production build (port 4173)
```

**Why?** Dev mode requires active connection for:
- Hot Module Replacement (HMR)
- Vite's module system
- Development plugins

## Performance Optimization

### Measure Your Improvements

Before and after implementing PWA:

| Metric | Before PWA | After PWA | Improvement |
|--------|-----------|-----------|-------------|
| First Load | 2.5s | 2.5s | Baseline |
| Return Visit | 2.3s | 0.3s | **87% faster** |
| Offline Access | ❌ | ✅ | **100% available** |
| Install Size | N/A | ~350KB | Cached assets |
| Lighthouse PWA | 30 | 95 | **+217%** |

### Optimization Tips

**1. Minimize Precache Size**
```typescript
workbox: {
  // Only precache critical assets
  globPatterns: ['**/*.{js,css,html}'], // Skip large images

  // Or use dynamic imports for non-critical code
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB limit
}
```

**2. Use Code Splitting**
```typescript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))

// In your router
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/profile" element={<Profile />} />
  </Routes>
</Suspense>
```

**3. Compress Assets**
```bash
npm install -D vite-plugin-compression

# In vite.config.ts
import compression from 'vite-plugin-compression'

plugins: [
  compression({ algorithm: 'gzip' }),
  compression({ algorithm: 'brotliCompress', ext: '.br' })
]
```

**4. Optimize Images**
```bash
# Convert images to WebP format
npm install -D vite-plugin-imagemin

# Use responsive images
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.jpg" type="image/jpeg">
  <img src="image.jpg" alt="Description">
</picture>
```

## Monitoring and Analytics

### Track PWA Metrics

```typescript
// Track installation
window.addEventListener('beforeinstallprompt', (e) => {
  // Track that install prompt was shown
  analytics.track('PWA Install Prompt Shown')

  e.userChoice.then((choice) => {
    analytics.track('PWA Install Choice', {
      outcome: choice.outcome // 'accepted' or 'dismissed'
    })
  })
})

// Track if app is running as installed PWA
if (window.matchMedia('(display-mode: standalone)').matches) {
  analytics.track('App Running as PWA')
}

// Track online/offline events
window.addEventListener('online', () => {
  analytics.track('App Back Online')
})

window.addEventListener('offline', () => {
  analytics.track('App Went Offline')
})
```

### Service Worker Metrics

```typescript
// In your service worker
self.addEventListener('fetch', (event) => {
  const isFromCache = event.request.cache === 'force-cache'

  // Track cache hits vs misses
  if (isFromCache) {
    // Send to analytics: Cache hit
  } else {
    // Send to analytics: Network request
  }
})
```

## User Experience Enhancements

### Offline Indicator

Show users when they're offline:

```typescript
function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="offline-banner">
      📡 You're offline. Some features may be limited.
    </div>
  )
}
```

### Custom Install Prompt

Create a better install experience:

```typescript
function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return

    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPrompt(false)
    }

    setInstallPrompt(null)
  }

  if (!showPrompt) return null

  return (
    <div className="install-prompt">
      <h3>Install App</h3>
      <p>Install this app for a better experience!</p>
      <button onClick={handleInstall}>Install</button>
      <button onClick={() => setShowPrompt(false)}>Maybe Later</button>
    </div>
  )
}
```

### Update Toast Notification

Better UX for app updates:

```typescript
function UpdateToast() {
  const [showUpdate, setShowUpdate] = useState(false)

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        setShowUpdate(true)
      },
    })

    return () => {}
  }, [])

  if (!showUpdate) return null

  return (
    <div className="update-toast">
      <p>🎉 New version available!</p>
      <button onClick={() => window.location.reload()}>
        Update Now
      </button>
      <button onClick={() => setShowUpdate(false)}>
        Later
      </button>
    </div>
  )
}
```

## Security Considerations

### Best Practices

1. **Always use HTTPS**
```nginx
# Nginx config
server {
  listen 443 ssl http2;
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
}
```

2. **Implement Content Security Policy**
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-inline'">
```

3. **Validate cached data**
```typescript
// Check data integrity
const cachedData = await cache.match(request)
if (cachedData) {
  const hash = await calculateHash(cachedData)
  if (hash !== expectedHash) {
    // Data corrupted, fetch fresh
    cache.delete(request)
    return fetch(request)
  }
}
```

4. **Don't cache sensitive data**
```typescript
workbox: {
  runtimeCaching: [
    {
      urlPattern: /\/api\/(auth|payment|personal)/,
      handler: 'NetworkOnly', // Never cache
    },
  ],
}
```

## Next Steps and Advanced Features

### 1. Add Background Sync
Queue failed requests and retry when online:
```bash
npm install workbox-background-sync
```

### 2. Implement Push Notifications
Re-engage users with timely updates:
```typescript
const registration = await navigator.serviceWorker.ready
await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: vapidPublicKey
})
```

### 3. Add Offline Page
Custom fallback when content isn't cached:
```typescript
workbox: {
  navigateFallback: '/offline.html',
  navigateFallbackDenylist: [/^\/api/],
}
```

### 4. Implement Update Strategy
Smart update checking without annoying users:
```typescript
// Check for updates every hour
setInterval(() => {
  registration.update()
}, 60 * 60 * 1000)
```

### 5. Add Share Target API
Let users share content to your app:
```json
{
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

## Conclusion

Building a Progressive Web App isn't just about adding offline support—it's about creating a resilient, fast, and engaging user experience that works everywhere, for everyone.

### Key Takeaways

1. **PWAs bridge the gap** between web and native apps without the complexity
2. **Offline-first** architecture improves UX even with good connectivity
3. **Service workers** provide powerful caching and background capabilities
4. **Start simple** - even basic caching provides massive benefits
5. **Iterate and optimize** based on user behavior and analytics

### Resources

- **Documentation**: [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- **Workbox**: [Google Workbox](https://developers.google.com/web/tools/workbox)
- **Testing**: [PWA Builder](https://www.pwabuilder.com/)
- **Icons**: [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)

## Final Thoughts

Progressive Web Apps represent the future of web development. They combine the reach of the web with the capabilities of native apps, all while maintaining the simplicity of web development.

The implementation we've covered transforms a standard React app into a robust, offline-capable application that users can install and rely on—regardless of their network conditions.

Start with the basics (caching static assets), then progressively enhance with advanced features (background sync, push notifications) as needed. Your users will thank you!

---

**Have questions or want to share your PWA implementation?** Drop a comment below or reach out on [Twitter/X](https://twitter.com/dale_nguyen) or [GitHub](https://github.com/dalenguyen).

Happy coding! 🚀

---

*This blog post documents the real implementation of PWA features in a production React application. All code examples are tested and working as of January 2026.*
