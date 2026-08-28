/**
 * weatherSync.js
 * Fetches user location via IP (no prompts) and current weather via Open-Meteo.
 */

export class WeatherSync {
  constructor() {
    this.weatherState = {
      isDay: true,
      condition: 'clear', // 'clear', 'cloudy', 'rain', 'snow'
      temperature: 20,
      windSpeed: 0
    };
    
    // Callbacks to notify when weather updates
    this.onUpdateCallbacks = [];
  }

  onUpdate(callback) {
    this.onUpdateCallbacks.push(callback);
  }

  async init() {
    try {
      // 1. Get approximate coordinates based on IP
      const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
      if (!geoRes.ok) throw new Error('Geo fetch failed');
      const geoData = await geoRes.json();
      
      const lat = geoData.latitude;
      const lon = geoData.longitude;
      
      // 2. Get weather from Open-Meteo
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      if (!weatherRes.ok) throw new Error('Weather fetch failed');
      const weatherData = await weatherRes.json();
      
      const current = weatherData.current_weather;
      
      this.weatherState.isDay = current.is_day === 1;
      this.weatherState.temperature = current.temperature;
      this.weatherState.windSpeed = current.windspeed;
      this.weatherState.condition = this._mapWMOCode(current.weathercode);
      
      this._notify();
      
      // Update weather every 15 minutes
      setInterval(() => this.updateWeather(lat, lon), 15 * 60 * 1000);
      
    } catch (err) {
      console.warn('WeatherSync failed, defaulting to Clear Day.', err);
      // Default fallback
      this.weatherState.isDay = true;
      this.weatherState.condition = 'clear';
      this._notify();
    }
  }

  async updateWeather(lat, lon) {
    try {
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json();
        const current = weatherData.current_weather;
        this.weatherState.isDay = current.is_day === 1;
        this.weatherState.temperature = current.temperature;
        this.weatherState.windSpeed = current.windspeed;
        this.weatherState.condition = this._mapWMOCode(current.weathercode);
        this._notify();
      }
    } catch (err) {
      console.warn('Failed to update weather in background.', err);
    }
  }

  _notify() {
    for (const cb of this.onUpdateCallbacks) {
      cb(this.weatherState);
    }
  }

  /**
   * Maps WMO Weather interpretation codes to our simple 4 states.
   * WMO Codes:
   * 0: Clear sky
   * 1, 2, 3: Mainly clear, partly cloudy, and overcast
   * 45, 48: Fog
   * 51, 53, 55, 56, 57: Drizzle
   * 61, 63, 65, 66, 67: Rain
   * 71, 73, 75, 77: Snow
   * 80, 81, 82: Rain showers
   * 85, 86: Snow showers
   * 95, 96, 99: Thunderstorm
   */
  _mapWMOCode(code) {
    if (code === 0 || code === 1) return 'clear';
    if (code === 2 || code === 3 || code === 45 || code === 48) return 'cloudy';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) return 'rain';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    return 'clear';
  }
}

