const CACHE_NAME = 'weather-app-v1';
const API_CACHE_NAME = 'weather-api-cache-v1';
const STATIC_CACHE_NAME = 'weather-static-cache-v1';
const IMAGE_CACHE_NAME = 'weather-image-cache-v1';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './manifest.json',
    './images/icon-192.png',
    './images/icon-512.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((error) => {
                console.error('Cache installation failed:', error);
            })
    );
    // Activate worker immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Claim all clients immediately
    event.waitUntil(self.clients.claim());
});

// Helper function to check if URL is an API request
const isApiRequest = (url) => {
    return url.includes('api.tomorrow.io');
};

// Helper function to check if URL is an image
const isImageRequest = (url) => {
    return url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i);
};

// Network First strategy for API requests
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(API_CACHE_NAME);
            await cache.put(request, response.clone());
            return response;
        }
    } catch (error) {
        console.log('Network request failed, trying cache:', error);
    }

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    return new Response(JSON.stringify({
        error: 'NetworkError',
        message: 'No internet connection'
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

// Cache First strategy for static assets
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            await cache.put(request, response.clone());
            return response;
        }
    } catch (error) {
        console.log('Network request failed:', error);
    }
    
    return new Response('Resource not available offline', {
        status: 404,
        statusText: 'Not Found'
    });
}

// Stale While Revalidate strategy for images
async function staleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);
    
    const fetchPromise = fetch(request).then(async (response) => {
        if (response.ok) {
            const cache = await caches.open(IMAGE_CACHE_NAME);
            await cache.put(request, response.clone());
        }
        return response;
    }).catch((error) => {
        console.log('Image fetch failed:', error);
        return null;
    });
    
    return cachedResponse || fetchPromise;
}

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const request = event.request;
    
    // Handle API requests
    if (isApiRequest(request.url)) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // Handle image requests
    if (isImageRequest(request.url)) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }

                // Clone the request because it can only be used once
                const fetchRequest = event.request.clone();

                // Make network request and cache the response
                return fetch(fetchRequest).then((response) => {
                    // Check if response is valid
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response because it can only be used once
                    const responseToCache = response.clone();

                    // Cache the fetched response
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch((error) => {
                console.error('Fetch failed:', error);
                // Return offline fallback
                return caches.match('./index.html');
            })
    );
});

// Handle offline/online status
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'OFFLINE_STATUS') {
        // Broadcast offline status to all clients
        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                client.postMessage({
                    type: 'OFFLINE_STATUS',
                    payload: event.data.payload
                });
            });
        });
    }
});
