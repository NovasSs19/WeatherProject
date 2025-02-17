# Weather PWA

A modern Progressive Web Application for tracking weather conditions and capturing weather-related photos.

## Features

- **Real-time Weather Updates**
  - Current temperature and conditions
  - Animated weather icons based on conditions
  - Smooth loading animations
  - Automatic location-based updates
  - Offline support with cached data

- **Camera Integration**
  - Capture weather-related photos
  - Photo gallery with preview
  - Environment-facing camera support
  - Responsive image handling

- **Modern UI/UX**
  - Clean and intuitive interface
  - Smooth transitions and animations
  - Weather-specific animations
  - Responsive design for all devices
  - Glass-morphism design elements

- **Progressive Web App Features**
  - Installable on devices
  - Offline functionality
  - Push notifications support
  - Responsive and mobile-first design

## Technologies Used

- HTML5, CSS3, JavaScript
- Service Workers for offline support
- Tomorrow.io Weather API
- Font Awesome for icons
- Google Fonts (Playfair Display, Poppins)
- LocalStorage for data persistence

## Installation

1. Clone the repository:
```bash
git clone https://github.com/NovasSs19/WeatherProject.git
```

2. Navigate to the project directory:
```bash
cd WeatherProject
```

3. Replace the API key in `app.js`:
```javascript
const WEATHER_API = {
    key: 'YOUR_API_KEY',
    baseUrl: 'https://api.tomorrow.io/v4/weather/realtime'
};
```

4. Serve the application using a local server.

## Usage

1. Allow location access when prompted
2. View current weather conditions with animated icons
3. Use the camera feature to capture weather-related photos
4. Access settings to manage permissions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Dorukhan Ozgur

## Acknowledgments

- Tomorrow.io for weather data
- Font Awesome for icons
- Google Fonts for typography
