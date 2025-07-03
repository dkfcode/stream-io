// StreamGuide Service Worker for Offline Functionality
const CACHE_NAME = 'streamguide-v1.0.0';
const STATIC_CACHE = 'streamguide-static-v1.0.0';
const DYNAMIC_CACHE = 'streamguide-dynamic-v1.0.0';
const IMAGE_CACHE = 'streamguide-images-v1.0.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Core CSS and JS will be added by build process
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/tmdb',
  '/api/trending',
  '/api/popular',
  '/api/genres',
  'https://api.themoviedb.org/3/trending',
  'https://api.themoviedb.org/3/movie/popular',
  'https://api.themoviedb.org/3/tv/popular',
];

// Image domains to cache
const IMAGE_DOMAINS = [
  'image.tmdb.org',
  'img.youtube.com',
  'logos-world.net'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('[SW] Failed to activate service worker:', error);
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  }
});

// Check if request is for a static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/assets/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.woff2') ||
         url.pathname.endsWith('.woff');
}

// Check if request is for an API
function isAPIRequest(request) {
  const url = new URL(request.url);
  return CACHEABLE_APIS.some(api => request.url.includes(api));
}

// Check if request is for an image
function isImageRequest(request) {
  const url = new URL(request.url);
  return IMAGE_DOMAINS.some(domain => url.hostname.includes(domain)) ||
         request.destination === 'image';
}

// Check if request is a navigation request
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Handle static assets - cache first strategy
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to handle static asset:', error);
    return new Response('Asset not available offline', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle API requests - network first with fallback to cache
async function handleAPIRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    try {
      const networkResponse = await fetch(request, {
        timeout: 8000 // 8 second timeout
      });
      
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (networkError) {
      console.log('[SW] Network failed, trying cache for API request');
      
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        // Add a custom header to indicate this is from cache
        const response = cachedResponse.clone();
        response.headers.set('X-From-Cache', 'true');
        return response;
      }
      
      // Return offline fallback for API requests
      return new Response(JSON.stringify({
        error: 'Content not available offline',
        offline: true,
        message: 'Please check your internet connection and try again.'
      }), {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('[SW] Failed to handle API request:', error);
    return new Response(JSON.stringify({
      error: 'Request failed',
      offline: true
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Handle image requests - cache first with network fallback
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request, {
        timeout: 10000 // 10 second timeout for images
      });
      
      if (networkResponse && networkResponse.status === 200) {
        // Only cache successful responses
        cache.put(request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (networkError) {
      console.log('[SW] Network failed for image, returning placeholder');
      
      // Return a simple placeholder response for failed images
      return new Response(
        '<svg width="300" height="450" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#374151"/><text x="50%" y="50%" text-anchor="middle" fill="#9CA3AF" font-family="Arial, sans-serif" font-size="16">Image Unavailable</text></svg>',
        {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'no-cache'
          }
        }
      );
    }
  } catch (error) {
    console.error('[SW] Failed to handle image request:', error);
    // Return placeholder for any errors
    return new Response('', { status: 204 });
  }
}

// Handle navigation requests - network first with offline fallback
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for navigation, returning cached app shell');
    
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match('/index.html');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback offline page
    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>StreamGuide - Offline</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #000;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            text-align: center;
          }
          .offline-container {
            max-width: 400px;
            padding: 2rem;
          }
          .offline-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          .btn {
            background: #8b5cf6;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            margin-top: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">📡</div>
          <h1>You're Offline</h1>
          <p>StreamGuide is not available right now. Please check your internet connection and try again.</p>
          <button class="btn" onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html'
      }
    });
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Retry failed requests when connection is restored
    console.log('[SW] Performing background sync...');
    
    // Clean up old cache entries
    await cleanupOldCacheEntries();
    
    // Prefetch popular content
    await prefetchPopularContent();
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Clean up old cache entries to prevent storage bloat
async function cleanupOldCacheEntries() {
  const cache = await caches.open(IMAGE_CACHE);
  const requests = await cache.keys();
  
  // Remove old images if cache is getting too large
  if (requests.length > 500) {
    const requestsToDelete = requests.slice(0, 100);
    await Promise.all(requestsToDelete.map(request => cache.delete(request)));
    console.log('[SW] Cleaned up old cache entries');
  }
}

// Prefetch popular content for offline access
async function prefetchPopularContent() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    // Prefetch trending movies and shows
    const trendingUrls = [
      'https://api.themoviedb.org/3/trending/movie/day',
      'https://api.themoviedb.org/3/trending/tv/day',
      'https://api.themoviedb.org/3/movie/popular',
      'https://api.themoviedb.org/3/tv/popular'
    ];
    
    await Promise.all(
      trendingUrls.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
          }
        } catch (error) {
          console.log('[SW] Failed to prefetch:', url);
        }
      })
    );
    
    console.log('[SW] Popular content prefetched');
  } catch (error) {
    console.error('[SW] Failed to prefetch popular content:', error);
  }
}

// Message handling for communication with main app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Get total cache size
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    totalSize += requests.length;
  }
  
  return totalSize;
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
  console.log('[SW] All caches cleared');
}

console.log('[SW] Service worker loaded'); 