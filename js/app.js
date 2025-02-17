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
    views: document.querySelectorAll('.view')
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
async function getWeather(lat, lon) {
    try {
        const url = `${WEATHER_API.baseUrl}?location=${lat},${lon}&apikey=${WEATHER_API.key}&units=metric`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Weather data not available');
        }
        
        const data = await response.json();
        updateWeatherUI(data);
    } catch (error) {
        console.error('Error fetching weather:', error);
        elements.description.textContent = 'Failed to fetch weather data';
    }
}

function updateWeatherUI(data) {
    const temperature = Math.round(data.data.values.temperature);
    const description = getWeatherDescription(data.data.values);
    
    elements.temperature.textContent = `${temperature}°C`;
    elements.description.textContent = description;
}

function getWeatherDescription(values) {
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
    getWeather(state.location.latitude, state.location.longitude);
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
async function requestCameraPermission() {
    try {
        const result = await navigator.permissions.query({ name: 'camera' });
        
        if (result.state === 'granted') {
            await initCamera();
        } else if (result.state === 'prompt') {
            elements.cameraPermission.addEventListener('click', async () => {
                try {
                    await initCamera();
                } catch (error) {
                    handlePermissionError('camera', error);
                }
            });
        } else {
            handlePermissionError('camera', new Error('Camera permission denied'));
        }
    } catch (error) {
        handlePermissionError('camera', error);
    }
}

async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 320 },
                height: { ideal: 240 }
            } 
        });
        elements.cameraPreview.srcObject = stream;
        elements.cameraPermission.disabled = true;
        elements.cameraPermission.classList.add('permission-granted');
        elements.cameraPermission.innerHTML = '<i class="fas fa-check"></i> Camera Enabled';
    } catch (error) {
        handlePermissionError('camera', error);
    }
}

elements.captureButton.addEventListener('click', () => {
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
        await getWeather(state.location.latitude, state.location.longitude);
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

// Offline Support
window.addEventListener('online', () => {
    state.isOnline = true;
    elements.offlineBanner.classList.add('hidden');
});

window.addEventListener('offline', () => {
    state.isOnline = false;
    elements.offlineBanner.classList.remove('hidden');
});

// Initialize permissions
document.addEventListener('DOMContentLoaded', () => {
    requestLocationPermission();
    requestCameraPermission();
    
    elements.notificationPermission.addEventListener('click', requestNotificationPermission);
});
