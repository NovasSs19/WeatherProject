const CACHE_NAME = 'weather-pwa-v1';
const API_CACHE_NAME = 'weather-api-cache-v1';
const STATIC_CACHE_NAME = 'weather-static-cache-v1';
const IMAGE_CACHE_NAME = 'weather-image-cache-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/manifest.json',
    '/images/icons/icon-72x72.png',
    '/images/icons/icon-96x96.png',
    '/images/icons/icon-128x128.png',
    '/images/icons/icon-144x144.png',
    '/images/icons/icon-152x152.png',
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-384x384.png',
    '/images/icons/icon-512x512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
    );
});

// Activate Service Worker and clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (![STATIC_CACHE_NAME, API_CACHE_NAME, IMAGE_CACHE_NAME].includes(cacheName)) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
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

// Main fetch event handler
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
    
    // Handle static assets
    event.respondWith(cacheFirst(request));
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
