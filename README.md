# Weather PWA

A Progressive Web Application for tracking weather and capturing weather-related photos.

## Features

### 1. Weather Tracking
- Real-time weather data using Tomorrow.io API
- Current temperature and conditions
- Location-based weather information
- Automatic updates

### 2. Photo Capture
- Native camera integration
- Photo gallery with delete functionality
- Weather photo documentation

### 3. Native Device Features
- Geolocation for weather data
- Camera access for photos
- Push notifications for weather alerts

### 4. Progressive Web App Features
- Installable on devices
- Offline functionality
- Responsive design
- Push notifications
- Background sync

## Technical Implementation

### Native Device Features
1. **Geolocation**
   - Uses the Geolocation API
   - Implements permission handling
   - Error management for denied access

2. **Camera**
   - Uses MediaDevices API
   - Implements photo capture
   - Gallery management

3. **Push Notifications**
   - Service Worker integration
   - Permission management
   - Offline notification support

### Offline Functionality
- Service Worker for offline support
- Cache API for resource caching
- IndexedDB for photo storage
- Offline indicator
- Graceful degradation

### Views
1. **Weather View**
   - Current conditions
   - Temperature display
   - Weather description
   - Refresh functionality

2. **Photos View**
   - Camera preview
   - Photo capture
   - Gallery display
   - Delete functionality

3. **Settings View**
   - Permission management
   - Feature toggles
   - User preferences

## Installation

1. Clone the repository
2. Install dependencies (if any)
3. Set up your Tomorrow.io API key
4. Run on a local server with HTTPS

## Development

### Prerequisites
- Web browser with PWA support
- HTTPS for service worker
- Tomorrow.io API key

### Running Locally
1. Set up HTTPS certificate
2. Start local server
3. Access via HTTPS URL

## Deployment
- Deploy to HTTPS-enabled server
- Ensure proper cache headers
- Configure service worker scope

## Technologies Used
- HTML5
- CSS3
- JavaScript (ES6+)
- Service Workers
- Cache API
- IndexedDB
- Tomorrow.io API

## Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Performance
- Lighthouse score optimized
- Efficient caching strategy
- Optimized assets
- Fast loading times

## Security
- HTTPS required
- Secure permission handling
- API key protection
- Safe data storage

## Contributing
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create pull request
