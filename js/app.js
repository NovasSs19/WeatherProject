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
    loadingSpinner: document.querySelector('.loading-spinner')
};

// State
let weatherUpdateTimer = null;

// Navigation
document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and views
        document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        
        // Add active class to clicked button and corresponding view
        button.classList.add('active');
        const viewId = button.dataset.view + '-view';
        document.getElementById(viewId).classList.add('active');
        
        // If switching to camera view and camera is enabled, initialize it
        if (viewId === 'camera-view' && elements.cameraButton.classList.contains('enabled')) {
            initCamera();
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
    
    // Add new entry
    history.unshift({
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last month's data
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    history = history.filter(item => new Date(item.timestamp) > monthAgo);
    
    localStorage.setItem('weatherHistory', JSON.stringify(history));
    updateHistoryDisplay();
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
    
    return history.filter(item => new Date(item.timestamp) > periodStart);
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
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        elements.cameraFeed.srcObject = stream;
        return true;
    } catch (error) {
        console.error('Camera error:', error);
        return false;
    }
}

function takePhoto() {
    const video = elements.cameraFeed;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Set canvas size to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64 image
    const imageData = canvas.toDataURL('image/jpeg');
    
    // Save to gallery
    saveToGallery(imageData);
    
    // Show success message
    showMessage('Photo captured!', 'success');
}

function saveToGallery(imageData) {
    let gallery = JSON.parse(localStorage.getItem('photoGallery') || '[]');
    gallery.unshift({
        id: Date.now(),
        image: imageData,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('photoGallery', JSON.stringify(gallery));
    updateGallery();
}

function updateGallery() {
    const gallery = JSON.parse(localStorage.getItem('photoGallery') || '[]');
    
    if (gallery.length === 0) {
        elements.photoGallery.innerHTML = '<p class="no-photos">No photos yet</p>';
        return;
    }
    
    elements.photoGallery.innerHTML = gallery.map(photo => `
        <div class="photo-item" data-id="${photo.id}">
            <img src="${photo.image}" alt="Captured photo">
            <div class="photo-overlay">
                <button onclick="deletePhoto(${photo.id})" class="delete-photo">Delete</button>
                <span class="photo-time">${new Date(photo.timestamp).toLocaleString()}</span>
            </div>
        </div>
    `).join('');
}

function deletePhoto(photoId) {
    let gallery = JSON.parse(localStorage.getItem('photoGallery') || '[]');
    gallery = gallery.filter(photo => photo.id !== photoId);
    localStorage.setItem('photoGallery', JSON.stringify(gallery));
    updateGallery();
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

elements.cameraButton.addEventListener('click', async () => {
    try {
        const success = await initCamera();
        if (success) {
            elements.cameraButton.classList.add('enabled');
            elements.cameraButton.textContent = 'Camera Enabled';
            document.getElementById('camera-view').classList.add('active');
            showMessage('Camera enabled successfully', 'success');
        } else {
            showMessage('Could not access camera', 'error');
        }
    } catch (error) {
        showMessage('Camera permission denied', 'error');
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

// Take photo button click handler
document.getElementById('take-photo')?.addEventListener('click', takePhoto);

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
window.addEventListener('unload', () => {
    if (weatherUpdateTimer) {
        clearInterval(weatherUpdateTimer);
    }
});
