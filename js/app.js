// DOM Elements
const elements = {
    weatherCard: document.querySelector('.weather-card'),
    temperature: document.querySelector('.temperature'),
    statusText: document.querySelector('.status-text'),
    loadingSpinner: document.querySelector('.loading-spinner'),
    locationButton: document.getElementById('location-permission'),
    cameraButton: document.getElementById('camera-permission'),
    notificationButton: document.getElementById('notification-permission'),
    cameraPreview: document.getElementById('camera-preview'),
    captureButton: document.getElementById('capture-button'),
    photoGallery: document.getElementById('photo-gallery'),
    rainContainer: document.querySelector('.rain-container'),
    cloudContainer: document.querySelector('.cloud-container'),
    historyList: document.querySelector('.history-list'),
    historyFilters: document.querySelector('.history-filters')
};

// App State
const state = {
    location: null,
    weatherData: null,
    isLoading: false,
    weatherHistory: []
};

// Weather API Configuration
const WEATHER_API = {
    key: 'XkaCch5a3j8XkpVFGMqNhGr2qG4yEtR7',
    baseUrl: 'https://api.tomorrow.io/v4/weather/realtime',
    updateInterval: 60 * 1000
};

// Weather Icons
const WEATHER_ICONS = {
    'Sunny': 'fas fa-sun',
    'Partly Cloudy': 'fas fa-cloud-sun',
    'Cloudy': 'fas fa-cloud',
    'Rainy': 'fas fa-cloud-rain',
    'Snowy': 'fas fa-snowflake',
    'Stormy': 'fas fa-bolt',
    'Foggy': 'fas fa-smog'
};

// Sample weather data for testing
const SAMPLE_WEATHER = {
    data: {
        values: {
            temperature: 22,
            cloudCover: 35,
            precipitationProbability: 10
        }
    }
};

// Navigation
document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', () => {
        const view = button.dataset.view;
        switchView(view);
    });
});

function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-button').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`${view}-view`).classList.add('active');
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    if (view === 'camera') {
        initializeCamera();
    } else if (view === 'history') {
        updateHistoryView(getCurrentFilter());
    }
}

// Loading State Management
function showLoading() {
    state.isLoading = true;
    elements.loadingSpinner.style.display = 'block';
    elements.temperature.style.visibility = 'hidden';
    elements.statusText.textContent = 'Loading weather data...';
}

function hideLoading() {
    state.isLoading = false;
    elements.loadingSpinner.style.display = 'none';
    elements.temperature.style.visibility = 'visible';
}

// Weather Effects
function createRainDrops() {
    elements.rainContainer.innerHTML = '';
    const numberOfDrops = 100;
    
    for (let i = 0; i < numberOfDrops; i++) {
        const drop = document.createElement('div');
        drop.className = 'rain-drop';
        
        // Random positioning and animation
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDuration = `${Math.random() * 1 + 0.5}s`;
        drop.style.opacity = Math.random();
        drop.style.animationDelay = `${Math.random() * 2}s`;
        
        elements.rainContainer.appendChild(drop);
    }
}

function createClouds() {
    elements.cloudContainer.innerHTML = '';
    const numberOfClouds = 5;
    
    for (let i = 0; i < numberOfClouds; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        
        // Random cloud size and positioning
        const size = Math.random() * 100 + 50;
        cloud.style.width = `${size}px`;
        cloud.style.height = `${size/2}px`;
        cloud.style.top = `${Math.random() * 50}%`;
        cloud.style.animationDuration = `${Math.random() * 10 + 20}s`;
        cloud.style.animationDelay = `${Math.random() * 10}s`;
        
        elements.cloudContainer.appendChild(cloud);
    }
}

function toggleWeatherEffects(condition) {
    const isRainy = condition.toLowerCase().includes('rainy');
    const isCloudy = condition.toLowerCase().includes('cloudy');
    
    // Toggle rain effect
    elements.rainContainer.style.display = isRainy ? 'block' : 'none';
    if (isRainy && !elements.rainContainer.children.length) {
        createRainDrops();
    }
    
    // Toggle cloud effect
    elements.cloudContainer.style.display = (isRainy || isCloudy) ? 'block' : 'none';
    if ((isRainy || isCloudy) && !elements.cloudContainer.children.length) {
        createClouds();
    }
}

// Photo Gallery
function createPhotoElement(dataUrl) {
    const container = document.createElement('div');
    container.className = 'photo-container';
    
    const img = document.createElement('img');
    img.src = dataUrl;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-photo';
    deleteBtn.innerHTML = '×';
    deleteBtn.addEventListener('click', () => container.remove());
    
    container.appendChild(img);
    container.appendChild(deleteBtn);
    return container;
}

// Weather History Management
function saveWeatherData(data) {
    try {
        const newItem = {
            timestamp: Date.now(),
            temperature: Math.round(data.data.values.temperature),
            condition: getWeatherCondition(data.data.values)
        };
        
        // Check if we should add this item
        const shouldAdd = shouldAddHistoryItem(newItem);
        
        if (shouldAdd) {
            state.weatherHistory.unshift(newItem);
            
            // Keep only last 30 days of data
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            state.weatherHistory = state.weatherHistory.filter(item => item.timestamp > thirtyDaysAgo);
            
            localStorage.setItem('weatherHistory', JSON.stringify(state.weatherHistory));
            
            // Update view if we're on history tab
            if (document.getElementById('history-view').classList.contains('active')) {
                updateHistoryView(getCurrentFilter());
            }
        }
    } catch (error) {
        console.error('Error saving weather data:', error);
    }
}

function shouldAddHistoryItem(newItem) {
    if (state.weatherHistory.length === 0) return true;
    
    const lastItem = state.weatherHistory[0];
    const timeDiff = newItem.timestamp - lastItem.timestamp;
    const minInterval = 5 * 60 * 1000; // 5 minutes
    
    // Check if enough time has passed
    if (timeDiff < minInterval) return false;
    
    // Check if weather has changed
    const tempChanged = newItem.temperature !== lastItem.temperature;
    const conditionChanged = newItem.condition !== lastItem.condition;
    
    return tempChanged || conditionChanged;
}

function getCurrentFilter() {
    const activeFilter = elements.historyFilters.querySelector('.filter-button.active');
    return activeFilter ? activeFilter.dataset.period : 'day';
}

function loadWeatherHistory() {
    try {
        let savedHistory = localStorage.getItem('weatherHistory');
        if (savedHistory) {
            state.weatherHistory = JSON.parse(savedHistory);
        } else {
            // Initialize with sample data for testing
            state.weatherHistory = [];
            localStorage.setItem('weatherHistory', JSON.stringify(state.weatherHistory));
        }
        updateHistoryView('day');
    } catch (error) {
        console.error('Error loading weather history:', error);
        state.weatherHistory = [];
    }
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (24 * 60 * 60 * 1000));
    
    if (diffDays === 0) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (diffDays === 1) {
        return `Yesterday ${date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })}`;
    } else if (diffDays < 7) {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function filterHistory(period) {
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    switch (period) {
        case 'day':
            return state.weatherHistory.filter(item => now - item.timestamp <= msPerDay);
        case 'week':
            return state.weatherHistory.filter(item => now - item.timestamp <= 7 * msPerDay);
        case 'month':
            return state.weatherHistory.filter(item => now - item.timestamp <= 30 * msPerDay);
        default:
            return state.weatherHistory;
    }
}

function updateHistoryView(period = 'day') {
    if (!elements.historyList) return;
    
    const filteredHistory = filterHistory(period);
    elements.historyList.innerHTML = '';
    
    if (filteredHistory.length === 0) {
        elements.historyList.innerHTML = '<div class="history-empty">No weather data available for this period</div>';
        return;
    }
    
    filteredHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        // Check if this item has the same values as the next one
        const nextItem = filteredHistory[index + 1];
        const noChange = nextItem && 
                        item.temperature === nextItem.temperature && 
                        item.condition === nextItem.condition;
        
        if (noChange) {
            historyItem.classList.add('no-change');
        }
        
        const icon = WEATHER_ICONS[item.condition] || 'fas fa-cloud';
        
        historyItem.innerHTML = `
            <div class="history-date">${formatDate(item.timestamp)}</div>
            <div class="history-condition">
                <i class="${icon}"></i>
                ${item.condition}
            </div>
            <div class="history-temp">${item.temperature}°C</div>
        `;
        elements.historyList.appendChild(historyItem);
    });
}

// Event Listeners for History Filters
elements.historyFilters?.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-button')) {
        // Update active state
        elements.historyFilters.querySelectorAll('.filter-button')
            .forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        // Update view
        updateHistoryView(e.target.dataset.period);
    }
});

// Weather Functions
async function getWeatherData() {
    if (state.isLoading || !state.location) return;
    
    try {
        showLoading();
        
        const { latitude, longitude } = state.location;
        const fields = ['temperature', 'cloudCover', 'precipitationProbability'];
        const url = `${WEATHER_API.baseUrl}?location=${latitude},${longitude}&fields=${fields.join(',')}&apikey=${WEATHER_API.key}&units=metric`;
        
        console.log('Fetching weather data...'); // Debug log
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'apikey': WEATHER_API.key
            },
            mode: 'cors',
            cache: 'no-store'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Weather data received:', data);
        
        if (!data || !data.data || !data.data.values) {
            console.error('Invalid data format:', data);
            throw new Error('Invalid data format received from API');
        }
        
        state.weatherData = data;
        updateWeatherUI(data);
        
        // Save to history if data is valid
        if (data.data.values.temperature) {
            saveWeatherData(data);
        }
        
    } catch (error) {
        console.error('Weather data fetch error:', error);
        elements.statusText.textContent = 'Failed to load weather data';
        elements.temperature.textContent = '--°C';
        elements.temperature.style.visibility = 'visible';
        
        // Use sample data for testing
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.log('Using sample data for local testing');
            state.weatherData = SAMPLE_WEATHER;
            updateWeatherUI(SAMPLE_WEATHER);
        }
    } finally {
        hideLoading();
    }
}

function updateWeatherUI(data) {
    const temp = Math.round(data.data.values.temperature);
    elements.temperature.textContent = `${temp}°C`;
    const condition = getWeatherCondition(data.data.values);
    elements.statusText.textContent = condition;
    
    // Toggle weather effects based on condition
    toggleWeatherEffects(condition);
}

function getWeatherCondition(values) {
    if (!values) return 'Unknown';
    
    const cloudCover = values.cloudCover || 0;
    const precipitationProbability = values.precipitationProbability || 0;
    const temperature = values.temperature || 0;
    
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

// Permission Handlers
async function requestLocationPermission() {
    try {
        const position = await getCurrentPosition();
        state.location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };
        elements.locationButton.classList.add('enabled');
        elements.locationButton.textContent = 'Location Enabled';
        getWeatherData();
        return true;
    } catch (error) {
        console.error('Location permission error:', error);
        elements.locationButton.classList.remove('enabled');
        elements.statusText.textContent = 'Please enable location access';
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

async function initializeCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        
        elements.cameraPreview.srcObject = stream;
        elements.cameraButton.classList.add('enabled');
        elements.cameraButton.textContent = 'Camera Enabled';
        return true;
    } catch (error) {
        console.error('Camera permission error:', error);
        elements.cameraButton.classList.remove('enabled');
        return false;
    }
}

async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            elements.notificationButton.classList.add('enabled');
            elements.notificationButton.textContent = 'Notifications Enabled';
            return true;
        } else {
            elements.notificationButton.classList.remove('enabled');
            return false;
        }
    } catch (error) {
        console.error('Notification permission error:', error);
        elements.notificationButton.classList.remove('enabled');
        return false;
    }
}

// Event Listeners
elements.locationButton.addEventListener('click', requestLocationPermission);
elements.cameraButton.addEventListener('click', initializeCamera);
elements.notificationButton.addEventListener('click', requestNotificationPermission);

// Photo Capture
elements.captureButton?.addEventListener('click', async () => {
    if (!elements.cameraPreview.srcObject) {
        await initializeCamera();
        return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = elements.cameraPreview.videoWidth;
    canvas.height = elements.cameraPreview.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(elements.cameraPreview, 0, 0);
    
    const photoContainer = createPhotoElement(canvas.toDataURL('image/jpeg'));
    elements.photoGallery.insertBefore(photoContainer, elements.photoGallery.firstChild);
});

// Initialize App
window.addEventListener('load', () => {
    // Hide weather effects and loading spinner initially
    elements.loadingSpinner.style.display = 'none';
    elements.rainContainer.style.display = 'none';
    elements.cloudContainer.style.display = 'none';
    
    // Load weather history
    loadWeatherHistory();
    
    // Check if we already have location permission
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                state.location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                elements.locationButton.classList.add('enabled');
                elements.locationButton.textContent = 'Location Enabled';
                
                // Initial weather fetch
                getWeatherData();
                
                // Set up periodic weather updates
                setInterval(() => {
                    if (document.visibilityState === 'visible') {
                        getWeatherData();
                    }
                }, WEATHER_API.updateInterval);
            },
            () => {
                elements.statusText.textContent = 'Please enable location access';
                elements.temperature.textContent = '--°C';
            }
        );
    }
    
    // Watch for location changes
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const newLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                
                // Check if location has changed significantly (more than 100 meters)
                if (!state.location || 
                    Math.abs(state.location.latitude - newLocation.latitude) > 0.001 ||
                    Math.abs(state.location.longitude - newLocation.longitude) > 0.001) {
                    state.location = newLocation;
                    getWeatherData();
                }
            },
            null,
            { enableHighAccuracy: true }
        );
    }
});
