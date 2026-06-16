'use client';
import { useState, useEffect } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { motion } from 'framer-motion';

import { useT, useIsRtl } from '@/lib/i18n';

interface WeatherCardProps {
  city: string;
  country: string;
  departDate: string;
}

export default function WeatherCard({ city, country, departDate }: WeatherCardProps) {
  const t = useT();
  const isRtl = useIsRtl();
  const [data, setData] = useState<{ temp: number; min: number; max: number; code: number; isForecast: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchWeather = async () => {
      if (!city) return;
      try {
        setLoading(true);
        // 1. Get coordinates for city
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) {
          setLoading(false);
          return;
        }
        const { latitude, longitude } = geoData.results[0];

        // 2. Determine if departDate is within 14 days
        const tripDate = new Date(departDate);
        const today = new Date();
        const diffDays = Math.ceil((tripDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        const isForecast = diffDays >= 0 && diffDays <= 14;

        // 3. Fetch weather
        let url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        
        const weatherRes = await fetch(url);
        const weatherData = await weatherRes.json();
        
        if (active) {
          if (isForecast && weatherData.daily && weatherData.daily.time) {
            // Find the specific day
            const dayIndex = weatherData.daily.time.findIndex((t: string) => t === departDate);
            if (dayIndex !== -1) {
              setData({
                temp: Math.round((weatherData.daily.temperature_2m_max[dayIndex] + weatherData.daily.temperature_2m_min[dayIndex]) / 2),
                min: Math.round(weatherData.daily.temperature_2m_min[dayIndex]),
                max: Math.round(weatherData.daily.temperature_2m_max[dayIndex]),
                code: weatherData.daily.weather_code[dayIndex],
                isForecast: true
              });
            } else {
               // Fallback to current
               setData({
                temp: Math.round(weatherData.current.temperature_2m),
                min: Math.round(weatherData.daily.temperature_2m_min[0]),
                max: Math.round(weatherData.daily.temperature_2m_max[0]),
                code: weatherData.current.weather_code,
                isForecast: false
              });
            }
          } else {
            setData({
              temp: Math.round(weatherData.current.temperature_2m),
              min: Math.round(weatherData.daily.temperature_2m_min[0]),
              max: Math.round(weatherData.daily.temperature_2m_max[0]),
              code: weatherData.current.weather_code,
              isForecast: false
            });
          }
        }
      } catch (e) {
        console.error('Weather error:', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchWeather();
    return () => { active = false; };
  }, [city, departDate]);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return '☀️'; // Clear
    if (code === 1 || code === 2 || code === 3) return '⛅'; // Partly cloudy
    if (code >= 45 && code <= 48) return '🌫️'; // Fog
    if (code >= 51 && code <= 67) return '🌧️'; // Rain/Drizzle
    if (code >= 71 && code <= 77) return '❄️'; // Snow
    if (code >= 80 && code <= 82) return '🌦️'; // Showers
    if (code >= 95 && code <= 99) return '⛈️'; // Thunderstorm
    return '🌥️';
  };

  const getWeatherName = (code: number) => {
    if (code === 0) return isRtl ? 'مشمس' : 'Clear';
    if (code === 1 || code === 2 || code === 3) return isRtl ? 'غائم جزئياً' : 'Partly Cloudy';
    if (code >= 45 && code <= 48) return isRtl ? 'ضباب' : 'Fog';
    if (code >= 51 && code <= 67) return isRtl ? 'ممطر' : 'Rain';
    if (code >= 71 && code <= 77) return isRtl ? 'ثلوج' : 'Snow';
    if (code >= 80 && code <= 82) return isRtl ? 'زخات مطر' : 'Showers';
    if (code >= 95 && code <= 99) return isRtl ? 'عواصف' : 'Thunderstorm';
    return isRtl ? 'غيوم' : 'Cloudy';
  };

  if (loading) return (
    <div className="card-flat animate-pulse p-4 rounded-2xl flex items-center justify-center min-h-[100px] border border-white/5">
      <div className="w-6 h-6 border-2 border-royal-gold border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!data) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card-flat p-4 rounded-2xl flex items-center justify-between border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
         <span className="text-8xl blur-sm">{getWeatherIcon(data.code)}</span>
      </div>
      
      <div className="relative z-10">
        <h4 className="text-sm text-zinc-400 font-medium mb-1">
          {data.isForecast ? (isRtl ? 'طقس الوصول المتوقع' : 'Expected Arrival Weather') : (isRtl ? `الطقس الآن في ${city}` : `Current Weather in ${city}`)}
        </h4>
        <div className="flex items-center gap-3">
          <span className="text-4xl drop-shadow-lg">{getWeatherIcon(data.code)}</span>
          <div>
            <div className="text-2xl font-bold text-foreground drop-shadow-md">
              {data.temp}°<span className="text-lg text-zinc-500 font-normal">C</span>
            </div>
            <div className="text-xs text-zinc-400 font-medium">
              {getWeatherName(data.code)} • {data.min}° / {data.max}°
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
