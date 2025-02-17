# Weather App PWA

A modern Progressive Web Application that provides real-time weather information with interactive features and offline capabilities.

## Features

### 1. Weather Information
- Real-time weather data using Tomorrow.io API
- Dynamic weather effects (rain and clouds) based on current conditions
- Temperature and weather condition display
- Automatic updates every minute

### 2. Weather History
- Track weather changes over time
- View history by different periods (24 hours, week, month)
- Smart data storage to avoid duplicate entries
- Visual indicators for weather changes
- Weather condition icons

### 3. Camera Integration
- Capture photos using device camera
- Photo gallery with delete functionality
- Secure permission handling

### 4. Progressive Web App Features
- Installable on devices
- Offline functionality
- Responsive design for all screen sizes
- Service Worker for caching
- Push notifications support

### 5. Native Device Features
- Geolocation for accurate weather data
- Camera access for photos
- Push notifications
- Local storage for history

## Technical Details

### Technologies Used
- HTML5
- CSS3 (with modern features like backdrop-filter)
- Vanilla JavaScript (ES6+)
- Service Workers
- Local Storage API
- Geolocation API
- Media Devices API

### APIs
- Tomorrow.io Weather API
- Browser APIs:
  - Geolocation
  - Camera
  - Push Notifications
  - Service Workers
  - Local Storage

### Performance
- Efficient caching strategy
- Minimal dependencies
- Optimized for mobile devices
- Smart data management

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/weather-app.git
```

2. Install dependencies (if any)
```bash
# No npm dependencies required
```

3. Set up API key
- Get an API key from Tomorrow.io
- Replace the API key in `app.js`

4. Serve the application
- Use a local server (e.g., Live Server in VS Code)
- Must be served over HTTPS for PWA features

## Usage

1. Allow location access for weather data
2. Enable camera permission for photo features
3. Allow notifications for weather alerts
4. View weather history in different time periods
5. Take and manage photos
6. Install the app on your device

## Project Structure

```
weather-app/
├── index.html          # Main HTML file
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
├── css/
│   └── style.css      # Styles
└── js/
    └── app.js         # Main JavaScript
```

## Author
Dorukhan Özgür

## License
MIT License
