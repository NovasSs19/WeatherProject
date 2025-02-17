// App State
const state = {
    weatherData: null,
    photos: [],
    isOnline: navigator.onLine,
    currentView: 'weather',
    location: null
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
}

// Weather API Configuration
const WEATHER_API = {
    key: 'cipJIPBjkoIWPy92BhaWjwKZyprvnglK',
    baseUrl: 'https://api.tomorrow.io/v4/weather/realtime'
};

// Weather Feature
async function getWeatherData(latitude, longitude) {
    elements.loadingSpinner.classList.remove('hidden');
    
    try {
        const response = await fetch(`https://api.tomorrow.io/v4/weather/realtime?location=${latitude},${longitude}&apikey=${WEATHER_API.key}&units=metric`);
        if (!response.ok) throw new Error('Weather API error');
        
        const data = await response.json();
        updateWeatherUI(data);
        localStorage.setItem('lastWeatherData', JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (error) {
        console.error('Weather data fetch error:', error);
        const cachedData = localStorage.getItem('lastWeatherData');
        
        if (cachedData) {
            const { data, timestamp } = JSON.parse(cachedData);
            updateWeatherUI(data, new Date(timestamp));
        } else {
            elements.weatherInfo.innerHTML = '<p class="error">⚠️ Weather data could not be retrieved</p>';
        }
    } finally {
        elements.loadingSpinner.classList.add('hidden');
    }
}

function getWeatherIcon(values) {
    const cloudCover = values.cloudCover;
    const precipitationProbability = values.precipitationProbability;
    const temperature = values.temperature;
    
    if (precipitationProbability > 50) {
        if (temperature <= 0) {
            return '<div class="weather-icon weather-snowy">❄️</div>';
        } else {
            return '<div class="weather-icon weather-rainy">🌧️</div>';
        }
    } else if (cloudCover > 50) {
        return '<div class="weather-icon weather-cloudy">☁️</div>';
    } else {
        return '<div class="weather-icon weather-sunny">☀️</div>';
    }
}

function updateWeatherUI(data, cachedTime = null) {
    const temp = data.data.values.temperature;
    const conditions = getWeatherCondition(data.data.values);
    const weatherIcon = getWeatherIcon(data.data.values);
    
    elements.weatherInfo.innerHTML = `
        <div class="weather-card">
            <h2>YOUR LOCATION</h2>
            ${weatherIcon}
            <h2>${Math.round(temp)}°C</h2>
            <p>${conditions}</p>
            ${cachedTime ? `<p class="cached-info">Last updated: ${formatDate(cachedTime)}</p>` : ''}
            <button id="refresh-weather" class="action-button">
                <i class="fas fa-sync-alt"></i> REFRESH
            </button>
        </div>
    `;

    // Reattach refresh button event listener
    document.getElementById('refresh-weather').addEventListener('click', async () => {
        if (state.location) {
            await getWeatherData(state.location.latitude, state.location.longitude);
        } else {
            alert('Please enable location first');
        }
    });
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        day: 'numeric',
        month: 'long'
    }).format(date);
}

function getWeatherCondition(values) {
    const cloudCover = values.cloudCover;
    const precipitationProbability = values.precipitationProbability;
    
    if (precipitationProbability > 50) {
        return 'Rainy';
    } else if (cloudCover > 70) {
        return 'Cloudy';
    } else if (cloudCover > 30) {
        return 'Partly Cloudy';
    } else {
        return 'Clear';
    }
}

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

// Location Feature
async function requestLocationPermission() {
    try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        
        if (result.state === 'granted') {
            const position = await getCurrentPosition();
            handleLocationSuccess(position);
        } else if (result.state === 'prompt') {
            elements.locationPermission.addEventListener('click', async () => {
                try {
                    const position = await getCurrentPosition();
                    handleLocationSuccess(position);
                } catch (error) {
                    handlePermissionError('location', error);
                }
            });
        } else {
            handlePermissionError('location', new Error('Location permission denied'));
        }
    } catch (error) {
        handlePermissionError('location', error);
    }
}

function handleLocationSuccess(position) {
    state.location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
    };
    
    elements.locationPermission.disabled = true;
    elements.locationPermission.classList.add('permission-granted');
    elements.locationPermission.innerHTML = '<i class="fas fa-check"></i> Location Enabled';
    
    // Get weather data immediately
    getWeatherData(state.location.latitude, state.location.longitude);
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
let videoStream = null;

async function startCamera() {
    try {
        // Close existing stream
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
        }

        // Get new stream
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        // Attach to video element
        elements.cameraPreview.srcObject = videoStream;
        await elements.cameraPreview.play();
        
        updatePermissionStatus('camera', true);
        return true;
    } catch (error) {
        console.error('Camera could not be started:', error);
        updatePermissionStatus('camera', false);
        return false;
    }
}

async function requestCameraPermission() {
    try {
        const result = await startCamera();
        return result;
    } catch (error) {
        console.error('Camera permission could not be obtained:', error);
        updatePermissionStatus('camera', false);
        return false;
    }
}

async function checkCameraPermission() {
    try {
        const permissions = await navigator.permissions.query({ name: 'camera' });
        
        if (permissions.state === 'granted') {
            return await startCamera();
        } else if (permissions.state === 'prompt') {
            return await requestCameraPermission();
        } else {
            updatePermissionStatus('camera', false);
            return false;
        }
    } catch (error) {
        console.error('Camera permission check failed:', error);
        return await requestCameraPermission();
    }
}

elements.captureButton.addEventListener('click', async () => {
    if (!videoStream) {
        await checkCameraPermission();
    }
    
    if (videoStream && videoStream.active) {
        const canvas = document.createElement('canvas');
        canvas.width = elements.cameraPreview.videoWidth;
        canvas.height = elements.cameraPreview.videoHeight;
        
        const context = canvas.getContext('2d');
        context.drawImage(elements.cameraPreview, 0, 0, canvas.width, canvas.height);
        
        // Create photo container
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        
        // Create photo image
        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/jpeg');
        photoItem.appendChild(img);
        
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this photo?')) {
                photoItem.remove();
            }
        });
        photoItem.appendChild(deleteBtn);
        
        // Add to gallery
        elements.photoGallery.insertBefore(photoItem, elements.photoGallery.firstChild);
    }
});

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
        await getWeatherData(state.location.latitude, state.location.longitude);
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
    requestLocationPermission();
    checkCameraPermission();
    
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
