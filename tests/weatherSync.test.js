import { describe, it, expect } from 'vitest';
import { WeatherSync } from '../src/utils/weatherSync.js';

describe('WeatherSync Utility', () => {
  it('should initialize with default clear daylight state', () => {
    const ws = new WeatherSync();
    expect(ws.weatherState.isDay).toBe(true);
    expect(ws.weatherState.condition).toBe('clear');
    expect(ws.weatherState.temperature).toBe(20);
  });

  it('should accurately map WMO codes to weather conditions', () => {
    const ws = new WeatherSync();
    // Clear sky
    expect(ws._mapWMOCode(0)).toBe('clear');
    expect(ws._mapWMOCode(1)).toBe('clear');

    // Cloudy & Fog
    expect(ws._mapWMOCode(2)).toBe('cloudy');
    expect(ws._mapWMOCode(3)).toBe('cloudy');
    expect(ws._mapWMOCode(45)).toBe('cloudy');
    expect(ws._mapWMOCode(48)).toBe('cloudy');

    // Drizzle, Rain & Thunderstorm
    expect(ws._mapWMOCode(51)).toBe('rain');
    expect(ws._mapWMOCode(61)).toBe('rain');
    expect(ws._mapWMOCode(80)).toBe('rain');
    expect(ws._mapWMOCode(95)).toBe('rain');

    // Snow
    expect(ws._mapWMOCode(71)).toBe('snow');
    expect(ws._mapWMOCode(75)).toBe('snow');
    expect(ws._mapWMOCode(85)).toBe('snow');

    // Unknown fallback
    expect(ws._mapWMOCode(999)).toBe('clear');
  });

  it('should notify registered callbacks on update', () => {
    const ws = new WeatherSync();
    let callbackReceived = null;

    ws.onUpdate((state) => {
      callbackReceived = state;
    });

    ws.weatherState.condition = 'rain';
    ws.weatherState.isDay = false;
    ws._notify();

    expect(callbackReceived).not.toBeNull();
    expect(callbackReceived.condition).toBe('rain');
    expect(callbackReceived.isDay).toBe(false);
  });
});
