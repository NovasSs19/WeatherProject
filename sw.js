const CACHE_NAME = 'weather-app-v2';
const API_CACHE_NAME = 'weather-api-cache-v1';
const STATIC_CACHE_NAME = 'weather-static-cache-v1';
const IMAGE_CACHE_NAME = 'weather-image-cache-v1';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app shell...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((error) => {
                console.error('Cache installation failed:', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
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
    
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin) && 
        !event.request.url.startsWith('https://fonts.googleapis.com') && 
        !event.request.url.startsWith('https://cdnjs.cloudflare.com')) {
        return;
    }

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
                if (response) {
                    return response; // Cache hit
                }

                return fetch(event.request.clone())
                    .then((response) => {
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        // Cache successful responses
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch((error) => {
                        console.error('Fetch failed:', error);
                        // Return offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        return new Response('Offline content not available');
                    });
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
