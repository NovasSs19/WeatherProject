// Constants
const WEATHER_API = {
    key: '89f4ea0781msh4b03435641f3d21p1b84d1jsn4fb74d6bca03',
    baseUrl: 'https://weatherapi-com.p.rapidapi.com/current.json',
    updateInterval: 5 * 60 * 1000, // 5 minutes
    retryDelay: 2000, // 2 seconds
    maxRetries: 3
};

const WEATHER_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

// App State
const state = {
    location: null,
    weatherHistory: [],
    currentFilter: '24h',
    isLoading: false,
    lastUpdateTime: 0
};

// DOM Elements
const elements = {
    temperature: document.querySelector('.temperature'),
    statusText: document.querySelector('.status-text'),
    locationButton: document.getElementById('locationButton'),
    cameraButton: document.getElementById('cameraButton'),
    notificationButton: document.getElementById('notificationButton'),
    weatherView: document.getElementById('weather-view'),
    cameraView: document.getElementById('camera-view'),
    historyView: document.getElementById('history-view'),
    cameraFeed: document.getElementById('camera-feed'),
    photoGallery: document.getElementById('photo-gallery'),
    historyList: document.getElementById('history-list'),
    loadingSpinner: document.querySelector('.loading-spinner'),
    takePhotoButton: document.getElementById('take-photo')
};

// State
let weatherUpdateTimer = null;
let cameraStream = null;

// Navigation
document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', async () => {
        const viewId = button.dataset.view;
        
        // Remove active class from all buttons and views
        document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        
        // Add active class to clicked button and corresponding view
        button.classList.add('active');
        document.getElementById(viewId + '-view').classList.add('active');
        
        // Handle camera when switching views
        if (viewId === 'camera') {
            if (elements.cameraButton.classList.contains('enabled')) {
                await initCamera();
            }
        } else {
            await stopCamera();
        }
    });
});

// Weather Functions
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Simulated weather data for demo
function getSimulatedWeather() {
    const temperatures = [15, 17, 19, 21, 23, 25];
    const conditions = ['clear', 'cloudy', 'rainy', 'sunny'];
    
    return {
        temperature: temperatures[Math.floor(Math.random() * temperatures.length)],
        condition: conditions[Math.floor(Math.random() * conditions.length)]
    };
}

async function updateWeather() {
    try {
        elements.loadingSpinner.style.display = 'block';
        elements.statusText.textContent = 'Updating weather data...';
        
        // Get simulated weather data
        const { temperature, condition } = getSimulatedWeather();
        
        elements.temperature.textContent = `${Math.round(temperature)}°C`;
        elements.loadingSpinner.style.display = 'none';
        elements.statusText.textContent = 'Weather data updated';
        
        // Save to history
        addToHistory({ temperature, condition });
        
    } catch (error) {
        console.error('Weather error:', error);
        elements.loadingSpinner.style.display = 'none';
        elements.statusText.textContent = 'Failed to update weather';
        elements.temperature.textContent = '--°C';
    }
}

function updateWeatherAnimations(condition) {
    // Remove all existing weather classes
    document.body.classList.remove('weather-clear', 'weather-cloudy', 'weather-rainy', 'weather-sunny');
    
    // Add new weather class
    document.body.classList.add(`weather-${condition}`);
    
    // Update rain animation visibility
    const rainElements = document.querySelectorAll('.rain');
    rainElements.forEach(el => {
        el.style.display = condition === 'rainy' ? 'block' : 'none';
    });
    
    // Update cloud animation visibility
    const cloudElements = document.querySelectorAll('.cloud');
    cloudElements.forEach(el => {
        el.style.display = ['cloudy', 'rainy'].includes(condition) ? 'block' : 'none';
    });
}

// History functionality
function addToHistory(weatherData) {
    let history = JSON.parse(localStorage.getItem('weatherHistory') || '[]');
    
    // Add new entry with simulated data for different periods
    const now = new Date();
    const entry = {
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        timestamp: now.toISOString()
    };
    
    // Add entry for current time
    history.unshift(entry);
    
    // Add some simulated past entries if history is empty
    if (history.length <= 1) {
        // Add entries for last week
        for (let i = 1; i <= 7; i++) {
            const pastDate = new Date(now);
            pastDate.setDate(now.getDate() - i);
            history.push({
                temperature: Math.floor(Math.random() * 10) + 15,
                condition: ['clear', 'cloudy', 'rainy', 'sunny'][Math.floor(Math.random() * 4)],
                timestamp: pastDate.toISOString()
            });
        }
        
        // Add entries for last month
        for (let i = 8; i <= 30; i++) {
            const pastDate = new Date(now);
            pastDate.setDate(now.getDate() - i);
            history.push({
                temperature: Math.floor(Math.random() * 15) + 10,
                condition: ['clear', 'cloudy', 'rainy', 'sunny'][Math.floor(Math.random() * 4)],
                timestamp: pastDate.toISOString()
            });
        }
    }
    
    // Keep only last month's data
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    history = history.filter(item => new Date(item.timestamp) > monthAgo);
    
    // Sort by timestamp (newest first)
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    localStorage.setItem('weatherHistory', JSON.stringify(history));
    updateHistoryDisplay();
}

function filterHistoryByPeriod(history, period) {
    const now = new Date();
    const periodStart = new Date();
    
    switch (period) {
        case '24h':
            periodStart.setHours(now.getHours() - 24);
            break;
        case 'week':
            periodStart.setDate(now.getDate() - 7);
            break;
        case 'month':
            periodStart.setMonth(now.getMonth() - 1);
            break;
    }
    
    return history.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate > periodStart && itemDate <= now;
    });
}

function updateHistoryDisplay() {
    const history = JSON.parse(localStorage.getItem('weatherHistory') || '[]');
    const activePeriod = document.querySelector('.filter-button.active').dataset.period;
    
    // Filter based on selected period
    const filteredHistory = filterHistoryByPeriod(history, activePeriod);
    
    if (filteredHistory.length === 0) {
        elements.historyList.innerHTML = '<p class="no-data">No weather data available for this period</p>';
        return;
    }
    
    elements.historyList.innerHTML = filteredHistory.map(item => `
        <div class="history-item">
            <div class="history-time">${formatTimestamp(item.timestamp)}</div>
            <div class="history-temp">${Math.round(item.temperature)}°C</div>
            <div class="history-condition">${item.condition}</div>
        </div>
    `).join('');
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
    });
}

// Add event listeners for history filters
document.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        updateHistoryDisplay();
    });
});

// Camera functionality
async function stopCamera() {
    try {
        if (cameraStream) {
            const tracks = cameraStream.getTracks();
            tracks.forEach(track => {
                track.stop();
            });
            cameraStream = null;
        }
        
        if (elements.cameraFeed && elements.cameraFeed.srcObject) {
            const tracks = elements.cameraFeed.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            elements.cameraFeed.srcObject = null;
        }
    } catch (error) {
        console.error('Error stopping camera:', error);
    }
}

async function initCamera() {
    try {
        // First, ensure any existing camera stream is properly stopped
        await stopCamera();
        
        // Wait a moment for the camera to be released
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Request camera access with constraints
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });
        
        cameraStream = stream;
        
        if (elements.cameraFeed) {
            elements.cameraFeed.srcObject = stream;
            await new Promise((resolve) => {
                elements.cameraFeed.onloadedmetadata = () => {
                    elements.cameraFeed.play()
                        .then(resolve)
                        .catch(error => {
                            console.error('Error playing video:', error);
                            showMessage('Error starting camera feed', 'error');
                        });
                };
            });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Camera error:', error);
        showMessage('Could not access camera: ' + error.message, 'error');
        return false;
    }
}

function takePhoto() {
    if (!elements.cameraFeed || !elements.cameraFeed.srcObject) {
        showMessage('Camera not initialized', 'error');
        return;
    }

    const video = elements.cameraFeed;
    const canvas = document.createElement('canvas');
    
    // Set canvas size to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    
    // Flip horizontally if using front camera
    if (video.style.transform.includes('scaleX(-1)')) {
        context.scale(-1, 1);
        context.translate(-canvas.width, 0);
    }
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        saveToGallery(imageData);
        showMessage('Photo captured!', 'success');
    } catch (error) {
        console.error('Photo capture error:', error);
        showMessage('Failed to capture photo', 'error');
    }
}

// Event Listeners for Camera
if (elements.takePhotoButton) {
    elements.takePhotoButton.addEventListener('click', () => {
        if (!elements.cameraFeed.srcObject) {
            showMessage('Please enable camera first', 'error');
            return;
        }
        takePhoto();
    });
}

// Camera button click handler
if (elements.cameraButton) {
    elements.cameraButton.addEventListener('click', async () => {
        if (elements.cameraButton.classList.contains('enabled')) {
            // If camera is enabled, stop it
            await stopCamera();
            elements.cameraButton.classList.remove('enabled');
            elements.cameraButton.textContent = 'Enable Camera';
            document.querySelector('.camera-section').style.display = 'none';
            showMessage('Camera disabled', 'info');
        } else {
            // If camera is disabled, start it
            try {
                const success = await initCamera();
                if (success) {
                    elements.cameraButton.classList.add('enabled');
                    elements.cameraButton.textContent = 'Camera Enabled';
                    document.querySelector('.camera-section').style.display = 'block';
                    showMessage('Camera enabled successfully', 'success');
                }
            } catch (error) {
                console.error('Camera error:', error);
                showMessage('Camera permission denied', 'error');
            }
        }
    });
}

// Navigation event listeners with camera handling
document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', async () => {
        const viewId = button.dataset.view;
        
        // Remove active class from all buttons and views
        document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        
        // Add active class to clicked button and corresponding view
        button.classList.add('active');
        document.getElementById(viewId + '-view').classList.add('active');
        
        // Handle camera when switching views
        if (viewId === 'camera') {
            if (elements.cameraButton.classList.contains('enabled')) {
                await initCamera();
            }
        } else {
            await stopCamera();
        }
    });
});

// Photo Gallery Functions
function saveToGallery(imageData) {
    let gallery = JSON.parse(localStorage.getItem('photoGallery') || '[]');
    
    // Add new photo to the beginning of the gallery
    gallery.unshift({
        id: Date.now(),
        data: imageData,
        timestamp: new Date().toISOString()
    });
    
    // Save to localStorage
    localStorage.setItem('photoGallery', JSON.stringify(gallery));
    
    // Update gallery display
    updateGalleryDisplay();
}

function updateGalleryDisplay() {
    const gallery = JSON.parse(localStorage.getItem('photoGallery') || '[]');
    const galleryElement = elements.photoGallery;
    
    if (!galleryElement) return;
    
    if (gallery.length === 0) {
        galleryElement.innerHTML = '<div class="no-photos">No photos yet</div>';
        return;
    }
    
    galleryElement.innerHTML = gallery.map(photo => `
        <div class="photo-item" data-id="${photo.id}">
            <img src="${photo.data}" alt="Captured photo">
            <div class="photo-overlay">
                <span class="photo-time">${formatTimestamp(photo.timestamp)}</span>
                <button class="delete-photo" onclick="deletePhoto(${photo.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function deletePhoto(photoId) {
    let gallery = JSON.parse(localStorage.getItem('photoGallery') || '[]');
    gallery = gallery.filter(photo => photo.id !== photoId);
    localStorage.setItem('photoGallery', JSON.stringify(gallery));
    updateGalleryDisplay();
    showMessage('Photo deleted', 'success');
}

// Permission Functions
async function requestLocationPermission() {
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        return true;
    } catch (error) {
        console.error('Location error:', error);
        throw error;
    }
}

async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            return true;
        }
        throw new Error('Notification permission denied');
    } catch (error) {
        console.error('Notification error:', error);
        throw error;
    }
}

// Message Functions
function showMessage(message, type = 'info') {
    elements.statusText.textContent = message;
    elements.statusText.className = `status-text ${type}`;
    
    setTimeout(() => {
        elements.statusText.textContent = '';
        elements.statusText.className = 'status-text';
    }, 3000);
}

// Event Listeners
elements.locationButton.addEventListener('click', async () => {
    try {
        await requestLocationPermission();
        elements.locationButton.classList.add('enabled');
        elements.locationButton.textContent = 'Location Enabled';
        updateWeather();
        showMessage('Location enabled successfully', 'success');
    } catch (error) {
        showMessage('Location permission denied', 'error');
    }
});

elements.notificationButton.addEventListener('click', async () => {
    try {
        await requestNotificationPermission();
        elements.notificationButton.classList.add('enabled');
        elements.notificationButton.textContent = 'Notifications Enabled';
        showMessage('Notifications enabled successfully', 'success');
    } catch (error) {
        showMessage('Notification permission denied', 'error');
    }
});

// Initialize app on load
window.addEventListener('load', () => {
    // Start weather updates
    updateWeather();
    weatherUpdateTimer = setInterval(updateWeather, WEATHER_UPDATE_INTERVAL);
    
    // Check existing permissions
    Promise.all([
        navigator.permissions.query({ name: 'geolocation' }),
        navigator.permissions.query({ name: 'camera' })
    ]).then(([geoResult, camResult]) => {
        // Location
        if (geoResult.state === 'granted') {
            elements.locationButton.classList.add('enabled');
            elements.locationButton.textContent = 'Location Enabled';
            updateWeather();
        }
        
        // Camera
        if (camResult.state === 'granted') {
            elements.cameraButton.classList.add('enabled');
            elements.cameraButton.textContent = 'Camera Enabled';
        }
        
        // Notifications
        if (Notification.permission === 'granted') {
            elements.notificationButton.classList.add('enabled');
            elements.notificationButton.textContent = 'Notifications Enabled';
        }
    }).catch(console.error);
});

// Cleanup on page unload
window.addEventListener('unload', stopCamera);
