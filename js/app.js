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
    locationButton: document.getElementById('enableLocation'),
    cameraButton: document.getElementById('enableCamera'),
    notificationButton: document.getElementById('enableNotifications'),
    cameraFeed: document.getElementById('cameraFeed'),
    takePhotoButton: document.getElementById('takePhotoButton'),
    photoGallery: document.getElementById('photoGallery'),
    historyList: document.getElementById('history-list'),
    weatherView: document.getElementById('weather-view'),
    cameraView: document.getElementById('camera-view'),
    historyView: document.getElementById('history-view')
};

// State
let weatherUpdateTimer = null;
let cameraStream = null;

// Navigation
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners
    if (elements.locationButton) {
        elements.locationButton.addEventListener('click', async () => {
            try {
                elements.locationButton.textContent = "Getting location...";
                const position = await getCurrentPosition();
                elements.locationButton.textContent = "Location Enabled";
                elements.locationButton.classList.add('enabled');
                updateWeather(position.coords);
                showMessage('Location enabled successfully', 'success');
            } catch (error) {
                console.error('Location error:', error);
                elements.locationButton.textContent = "Enable Location";
                showMessage('Could not get location: ' + error.message, 'error');
            }
        });
    }

    if (elements.cameraButton) {
        elements.cameraButton.addEventListener('click', async () => {
            if (elements.cameraButton.classList.contains('enabled')) {
                await stopCamera();
                elements.cameraButton.classList.remove('enabled');
                elements.cameraButton.textContent = 'Enable Camera';
                document.querySelector('.camera-section').style.display = 'none';
                showMessage('Camera disabled', 'info');
            } else {
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

    if (elements.notificationButton) {
        elements.notificationButton.addEventListener('click', async () => {
            try {
                if (Notification.permission === "denied") {
                    showMessage('Notifications are blocked. Please check your browser settings.', 'error');
                    return;
                }
                
                if (Notification.permission === "granted") {
                    elements.notificationButton.textContent = "Notifications Enabled";
                    elements.notificationButton.classList.add('enabled');
                    showMessage('Notifications are already enabled', 'success');
                    return;
                }
                
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    elements.notificationButton.textContent = "Notifications Enabled";
                    elements.notificationButton.classList.add('enabled');
                    showMessage('Notifications enabled successfully', 'success');
                    
                    // Send welcome notification
                    new Notification("Weather App", {
                        body: "You will be notified of weather updates!",
                        icon: "images/icon-192.png"
                    });
                } else {
                    showMessage('Please enable notifications in your browser settings', 'error');
                }
            } catch (error) {
                console.error('Notification error:', error);
                showMessage('Could not enable notifications', 'error');
            }
        });
    }

    // Initialize views
    document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', () => {
            const viewId = button.getAttribute('data-view');
            switchView(viewId);
        });
    });

    // Show weather view by default
    if (elements.weatherView) {
        elements.weatherView.classList.add('active');
    }

    // Initialize weather updates
    startWeatherUpdates();

    // Add event listeners for history filters
    document.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', () => {
            filterHistory(button.dataset.period);
        });
    });
});

// Weather Functions
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

async function updateWeather(coords) {
    try {
        elements.statusText.textContent = 'Updating weather...';

        // Simulate API call with random weather data
        await delay(1000);
        const weather = getSimulatedWeather();

        // Update UI
        elements.temperature.textContent = `${weather.temperature}°C`;
        elements.statusText.textContent = weather.condition;

        // Save to history
        saveToHistory(weather);

        // Update history display
        filterHistory(currentHistoryFilter);
    } catch (error) {
        console.error('Error updating weather:', error);
        elements.statusText.textContent = 'Error updating weather';
        showMessage('Failed to update weather', 'error');
    }
}

function getSimulatedWeather() {
    // More realistic temperature range
    const hour = new Date().getHours();
    let baseTemp;
    
    // Day/night temperature variation
    if (hour >= 6 && hour < 12) { // Morning
        baseTemp = Math.floor(Math.random() * 5) + 15; // 15-20°C
    } else if (hour >= 12 && hour < 18) { // Afternoon
        baseTemp = Math.floor(Math.random() * 7) + 20; // 20-27°C
    } else if (hour >= 18 && hour < 22) { // Evening
        baseTemp = Math.floor(Math.random() * 5) + 15; // 15-20°C
    } else { // Night
        baseTemp = Math.floor(Math.random() * 5) + 10; // 10-15°C
    }
    
    // Conditions based on temperature
    let conditions;
    if (baseTemp > 25) {
        conditions = ['Sunny', 'Clear', 'Hot'];
    } else if (baseTemp > 20) {
        conditions = ['Partly Cloudy', 'Sunny', 'Clear', 'Warm'];
    } else if (baseTemp > 15) {
        conditions = ['Cloudy', 'Partly Cloudy', 'Light Rain', 'Mild'];
    } else {
        conditions = ['Cloudy', 'Light Rain', 'Cool', 'Overcast'];
    }
    
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    return { temperature: baseTemp, condition };
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Camera Functions
async function initCamera() {
    try {
        await stopCamera();
        
        // Wait a moment for the camera to be released
        await delay(500);
        
        const constraints = {
            video: {
                facingMode: { exact: "environment" }, // Arka kamera
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };

        console.log('Requesting camera with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Camera stream obtained:', stream);
        
        if (elements.cameraFeed) {
            console.log('Setting camera feed source');
            elements.cameraFeed.srcObject = stream;
            await elements.cameraFeed.play();
            console.log('Camera feed playing');
            return true;
        } else {
            console.error('Camera feed element not found');
            return false;
        }
    } catch (error) {
        if (error.name === 'OverconstrainedError') {
            // Arka kamera yoksa ön kamerayı dene
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "user",
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                });
                
                if (elements.cameraFeed) {
                    elements.cameraFeed.srcObject = stream;
                    await elements.cameraFeed.play();
                    return true;
                }
                return false;
            } catch (frontCamError) {
                console.error('Front camera error:', frontCamError);
                showMessage('Could not access any camera', 'error');
                return false;
            }
        }
        console.error('Camera initialization error:', error);
        showMessage('Could not access camera: ' + error.message, 'error');
        return false;
    }
}

async function stopCamera() {
    try {
        if (elements.cameraFeed && elements.cameraFeed.srcObject) {
            console.log('Stopping camera stream');
            const tracks = elements.cameraFeed.srcObject.getTracks();
            tracks.forEach(track => {
                console.log('Stopping track:', track);
                track.stop();
            });
            elements.cameraFeed.srcObject = null;
            console.log('Camera stream stopped');
        }
    } catch (error) {
        console.error('Error stopping camera:', error);
    }
}

// Photo Functions
if (elements.takePhotoButton) {
    elements.takePhotoButton.addEventListener('click', () => {
        if (!elements.cameraFeed || !elements.cameraFeed.srcObject) {
            showMessage('Please enable camera first', 'error');
            return;
        }
        try {
            takePhoto();
        } catch (error) {
            console.error('Error taking photo:', error);
            showMessage('Failed to take photo: ' + error.message, 'error');
        }
    });
}

function takePhoto() {
    if (!elements.cameraFeed || !elements.cameraFeed.srcObject) {
        showMessage('Camera not initialized', 'error');
        return;
    }

    const video = elements.cameraFeed;
    const canvas = document.createElement('canvas');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
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

// Gallery Functions
function saveToGallery(imageData) {
    let gallery = JSON.parse(localStorage.getItem('photoGallery') || '[]');
    gallery.unshift({
        id: Date.now(),
        image: imageData,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('photoGallery', JSON.stringify(gallery));
    updateGalleryDisplay();
}

function updateGalleryDisplay() {
    const gallery = JSON.parse(localStorage.getItem('photoGallery') || '[]');

    if (!elements.photoGallery) return;

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
    updateGalleryDisplay();
    showMessage('Photo deleted', 'success');
}

// History Functions
let currentHistoryFilter = '24h';

function filterHistory(period) {
    currentHistoryFilter = period;
    const history = JSON.parse(localStorage.getItem('weatherHistory') || '[]');
    const now = new Date();
    
    let filteredHistory = history.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        const diffHours = Math.floor((now - entryDate) / (1000 * 60 * 60));
        
        switch (period) {
            case '24h':
                return diffHours <= 24;
            case 'week':
                return diffHours <= 168; // 7 * 24
            case 'month':
                return diffHours <= 720; // 30 * 24
            default:
                return true;
        }
    });
    
    // Simüle edilmiş veriler ekle
    if (filteredHistory.length < 2) {
        const simulatedData = generateSimulatedHistory(period);
        filteredHistory = [...filteredHistory, ...simulatedData];
    }
    
    updateHistoryDisplay(filteredHistory);
}

function generateSimulatedHistory(period) {
    const simulatedData = [];
    const now = new Date();
    let count;
    
    switch (period) {
        case '24h':
            count = 24;
            break;
        case 'week':
            count = 7;
            break;
        case 'month':
            count = 30;
            break;
        default:
            count = 24;
    }
    
    for (let i = 1; i <= count; i++) {
        const timestamp = new Date(now - (i * 3600000)); // Her saat için
        simulatedData.push({
            id: Date.now() - i,
            temperature: Math.floor(Math.random() * 15) + 10,
            condition: ['Sunny', 'Cloudy', 'Rainy', 'Clear'][Math.floor(Math.random() * 4)],
            timestamp: timestamp.toISOString()
        });
    }
    
    return simulatedData;
}

function saveToHistory(weatherData) {
    try {
        let history = JSON.parse(localStorage.getItem('weatherHistory') || '[]');
        
        // Add new entry
        const newEntry = {
            ...weatherData,
            id: Date.now(),
            timestamp: new Date().toISOString()
        };
        
        // Add to beginning of array
        history.unshift(newEntry);
        
        // Keep only last 30 entries for history
        history = history.slice(0, 30);
        
        localStorage.setItem('weatherHistory', JSON.stringify(history));
        filterHistory(currentHistoryFilter);
    } catch (error) {
        console.error('Error saving to history:', error);
    }
}

function updateHistoryDisplay(filteredHistory) {
    const history = filteredHistory;
    
    if (!elements.historyList) return;
    
    if (history.length === 0) {
        elements.historyList.innerHTML = '<p class="no-data">No weather history yet</p>';
        return;
    }
    
    elements.historyList.innerHTML = history.map(entry => `
        <div class="history-item">
            <div class="history-info">
                <span class="history-temp">${entry.temperature}°C</span>
                <span class="history-condition">${entry.condition}</span>
            </div>
            <span class="history-time">${formatDate(entry.timestamp)}</span>
        </div>
    `).join('');
    
    // Update filter buttons
    document.querySelectorAll('.filter-button').forEach(button => {
        button.classList.remove('active');
        if (button.dataset.period === currentHistoryFilter) {
            button.classList.add('active');
        }
    });
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// View Management
function switchView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-button').forEach(button => {
        button.classList.remove('active');
    });

    // Show selected view
    const selectedView = document.getElementById(viewId + '-view');
    if (selectedView) {
        selectedView.classList.add('active');
    }

    // Add active class to selected nav button
    const selectedButton = document.querySelector(`.nav-button[data-view="${viewId}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }

    // Handle camera when switching views
    if (viewId === 'camera') {
        if (elements.cameraButton.classList.contains('enabled')) {
            initCamera();
        }
    } else {
        stopCamera();
    }
}

// Utility Functions
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('message-container');
    if (!messageContainer) return;

    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;

    messageContainer.appendChild(messageElement);

    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}

// Start weather updates
function startWeatherUpdates() {
    // Update weather every 5 minutes
    setInterval(() => {
        if (elements.locationButton.classList.contains('enabled')) {
            getCurrentPosition()
                .then(position => updateWeather(position.coords))
                .catch(error => console.error('Weather update failed:', error));
        }
    }, 5 * 60 * 1000);
}

// Initialize history display
filterHistory('24h');
