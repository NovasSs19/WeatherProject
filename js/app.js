// App State
let state = {
    location: null,
    weatherData: null,
    photos: [],
    currentView: 'weather',
    isOnline: navigator.onLine
};

// DOM Elements
const elements = {
    weatherView: document.getElementById('weather-view'),
    photosView: document.getElementById('photos-view'),
    settingsView: document.getElementById('settings-view'),
    weatherInfo: document.getElementById('weather-info'),
    temperature: document.querySelector('.temperature'),
    description: document.querySelector('.description'),
    refreshWeather: document.getElementById('refresh-weather'),
    cameraPreview: document.getElementById('camera-preview'),
    captureButton: document.getElementById('capture-button'),
    photoGallery: document.getElementById('photo-gallery'),
    locationPermission: document.getElementById('location-permission'),
    cameraPermission: document.getElementById('camera-permission'),
    notificationPermission: document.getElementById('notification-permission'),
    navLinks: document.querySelectorAll('nav a'),
    views: document.querySelectorAll('.view'),
    offlineIndicator: document.getElementById('offline-indicator'),
    lastUpdated: document.getElementById('last-updated'),
    refreshButton: document.getElementById('refresh-button'),
    loadingSpinner: document.getElementById('loading-spinner')
};

// Navigation
elements.navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = e.target.getAttribute('href').substring(1);
        switchView(view);
    });
});

function switchView(view) {
    elements.views.forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}-view`).classList.add('active');
    
    elements.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${view}`) {
            link.classList.add('active');
        }
    });
    
    state.currentView = view;
    
    // Handle view-specific initialization
    if (view === 'camera') {
        initializeCamera();
    }
}

// Weather API Configuration
const WEATHER_API = {
    key: 'cipJIPBjkoIWPy92BhaWjwKZyprvnglK',
    baseUrl: 'https://api.tomorrow.io/v4/weather/realtime'
};

// Weather Feature
async function getWeatherData() {
    if (!state.location) {
        console.error('Location not available');
        return;
    }

    const { latitude, longitude } = state.location;
    
    try {
        showLoadingState();
        
        const response = await fetch(
            `${WEATHER_API.baseUrl}?location=${latitude},${longitude}&apikey=${WEATHER_API.key}&units=metric`
        );
        
        if (!response.ok) throw new Error('Weather API error');
        
        const data = await response.json();
        state.weatherData = data;
        
        updateWeatherUI(data);
        cacheWeatherData(data);
        
        return true;
    } catch (error) {
        console.error('Weather data fetch error:', error);
        handleWeatherError();
        return false;
    }
}

function showLoadingState() {
    elements.weatherInfo.innerHTML = `
        <div class="weather-card">
            <div class="weather-content">
                <h2>Loading Weather...</h2>
                <div class="weather-icon">
                    <div class="loading-spinner"></div>
                </div>
                <div class="weather-details">
                    <h3>--°C</h3>
                    <p>Please wait...</p>
                </div>
            </div>
        </div>
    `;
}

function handleWeatherError() {
    const cachedData = localStorage.getItem('weatherData');
    if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        updateWeatherUI(data, new Date(timestamp));
    } else {
        elements.weatherInfo.innerHTML = `
            <div class="weather-card">
                <div class="weather-content">
                    <h2>Weather Unavailable</h2>
                    <div class="weather-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <div class="weather-details">
                        <p>Could not retrieve weather data</p>
                        <button id="retry-weather" class="action-button">
                            <i class="fas fa-sync-alt"></i> Retry
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('retry-weather')?.addEventListener('click', getWeatherData);
    }
}

function getWeatherIcon(values) {
    const cloudCover = values.cloudCover;
    const precipitationProbability = values.precipitationProbability;
    const temperature = values.temperature;
    
    if (precipitationProbability > 50) {
        if (temperature <= 0) {
            return '<div class="weather-icon weather-snowy">❄️</div>';
        }
        return '<div class="weather-icon weather-rainy">🌧️</div>';
    } else if (cloudCover > 70) {
        return '<div class="weather-icon weather-cloudy">☁️</div>';
    } else {
        return '<div class="weather-icon weather-sunny">☀️</div>';
    }
}

function updateWeatherUI(data, cachedTime = null) {
    const values = data.data.values;
    const temp = Math.round(values.temperature);
    const conditions = getWeatherCondition(values);
    const weatherIcon = getWeatherIcon(values);
    
    elements.weatherInfo.innerHTML = `
        <div class="weather-card">
            <div class="weather-content">
                <h2>Current Weather</h2>
                ${weatherIcon}
                <div class="weather-details">
                    <h3>${temp}°C</h3>
                    <p>${conditions}</p>
                    ${cachedTime ? `<p class="cached-info">Last updated: ${formatTime(cachedTime)}</p>` : ''}
                    <button id="refresh-weather" class="action-button">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('refresh-weather')?.addEventListener('click', getWeatherData);
}

function getWeatherCondition(values) {
    const cloudCover = values.cloudCover;
    const precipitationProbability = values.precipitationProbability;
    const temperature = values.temperature;
    
    if (precipitationProbability > 50) {
        if (temperature <= 0) return 'Snowy';
        return 'Rainy';
    } else if (cloudCover > 70) {
        return 'Cloudy';
    } else if (cloudCover > 30) {
        return 'Partly Cloudy';
    } else {
        return 'Sunny';
    }
}

function formatTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    }).format(date);
}

function cacheWeatherData(data) {
    localStorage.setItem('weatherData', JSON.stringify({
        data,
        timestamp: Date.now()
    }));
}

// Location Feature
async function requestLocationPermission() {
    try {
        const position = await getCurrentPosition();
        state.location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };
        elements.locationPermission.classList.add('enabled');
        await getWeatherData();
        return true;
    } catch (error) {
        console.error('Location permission error:', error);
        elements.locationPermission.classList.remove('enabled');
        return false;
    }
}

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    });
}

// Camera Feature
async function initializeCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });
        
        elements.cameraPreview.srcObject = stream;
        elements.cameraPermission.classList.add('enabled');
        return true;
    } catch (error) {
        console.error('Camera permission error:', error);
        elements.cameraPermission.classList.remove('enabled');
        return false;
    }
}

// Event Listeners
elements.locationPermission.addEventListener('click', requestLocationPermission);
elements.cameraPermission.addEventListener('click', initializeCamera);
elements.captureButton.addEventListener('click', capturePhoto);

// Network status tracking
let isOnline = navigator.onLine;
window.addEventListener('online', handleNetworkChange);
window.addEventListener('offline', handleNetworkChange);

function handleNetworkChange() {
    isOnline = navigator.onLine;
    updateOfflineIndicator();
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'OFFLINE_STATUS',
            payload: isOnline
        });
    }
}

function updateOfflineIndicator() {
    if (!isOnline) {
        elements.offlineIndicator.classList.remove('hidden');
        elements.offlineIndicator.textContent = '📡 Offline mode - Limited features available';
    } else {
        elements.offlineIndicator.classList.add('hidden');
    }
}

// Performance optimization for images
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Notification Feature
async function requestNotificationPermission() {
    try {
        const result = await Notification.requestPermission();
        
        if (result === 'granted') {
            elements.notificationPermission.disabled = true;
            elements.notificationPermission.classList.add('permission-granted');
            elements.notificationPermission.innerHTML = '<i class="fas fa-check"></i> Notifications Enabled';
        } else {
            handlePermissionError('notification', new Error('Notification permission denied'));
        }
    } catch (error) {
        handlePermissionError('notification', error);
    }
}

function handlePermissionError(type, error) {
    console.error(`Error with ${type} permission:`, error);
    const button = type === 'location' ? elements.locationPermission :
                  type === 'camera' ? elements.cameraPermission :
                  elements.notificationPermission;
    
    button.innerHTML = `<i class="fas fa-times"></i> ${type.charAt(0).toUpperCase() + type.slice(1)} Access Denied`;
    button.style.color = '#f44336';
}

// Refresh Weather
elements.refreshWeather.addEventListener('click', async () => {
    if (state.location) {
        elements.description.textContent = 'Updating...';
        await getWeatherData();
    } else {
        alert('Please enable location first');
    }
});

// IndexedDB Setup
let db;
const request = indexedDB.open('WeatherPWA', 1);

request.onerror = (event) => {
    console.error('IndexedDB error:', event.target.error);
};

request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('photos')) {
        db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
    }
};

request.onsuccess = (event) => {
    db = event.target.result;
    loadPhotosFromIndexedDB();
};

function savePhotoToIndexedDB(photoUrl) {
    const transaction = db.transaction(['photos'], 'readwrite');
    const store = transaction.objectStore('photos');
    store.add({ url: photoUrl, timestamp: Date.now() });
}

async function loadPhotosFromIndexedDB() {
    const transaction = db.transaction(['photos'], 'readonly');
    const store = transaction.objectStore('photos');
    const request = store.getAll();
    
    request.onsuccess = () => {
        state.photos = request.result.map(photo => photo.url);
        updatePhotoGallery();
    };
}

// Initialize permissions
document.addEventListener('DOMContentLoaded', async () => {
    await requestLocationPermission();
    initializeCamera();
    
    elements.notificationPermission.addEventListener('click', requestNotificationPermission);
    
    lazyLoadImages();
    handleNetworkChange();
});

function updatePermissionStatus(permission, granted) {
    const button = document.getElementById(`${permission}-permission`);
    if (!button) return;

    if (granted) {
        button.innerHTML = `<i class="fas fa-check"></i> ${permission.charAt(0).toUpperCase() + permission.slice(1)} Enabled`;
        button.classList.add('enabled');
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
    } else {
        button.innerHTML = `<i class="fas fa-times"></i> Enable ${permission.charAt(0).toUpperCase() + permission.slice(1)}`;
        button.classList.remove('enabled');
        button.style.backgroundColor = '#f44336';
        button.style.color = '#ffffff';
    }
}

// Add to Home Screen promotion
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install promotion when appropriate
    const installButton = document.createElement('button');
    installButton.textContent = '📱 Install App';
    installButton.classList.add('install-button');
    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);
            deferredPrompt = null;
            installButton.remove();
        }
    });
    
    document.body.appendChild(installButton);
});
