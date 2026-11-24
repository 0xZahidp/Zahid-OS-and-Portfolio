/*
From Uiverse.io by KSAplay - https://uiverse.io/KSAplay/mean-dolphin-87
MIT License, Copyright (c) KSAplay (Kenny)
*/

'use client';

import React, { useState, useEffect } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayForecast {
  day: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
}

interface WeatherData {
  city: string;
  country?: string;
  isVisitorLocation: boolean;
  temperature: number;
  condition: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  daily: DayForecast[];
}

export const VisitorWeatherCard: React.FC<{ className?: string }> = ({ className }) => {
  // Live clock
  const [hour, setHour] = useState<string>('--:--');
  const [dateStr, setDateStr] = useState<string>('--- --/--');
  const [activeDayIdx, setActiveDayIdx] = useState<number | null>(null);

  // Weather state
  const [weather, setWeather] = useState<WeatherData>({
    city: 'Dhaka',
    isVisitorLocation: false,
    temperature: 26,
    condition: 'Sunny',
    weatherCode: 0,
    tempMax: 28,
    tempMin: 18,
    daily: [
      { day: 'TUE', weatherCode: 0, tempMax: 27, tempMin: 19 },
      { day: 'WED', weatherCode: 1, tempMax: 26, tempMin: 18 },
      { day: 'THU', weatherCode: 2, tempMax: 26, tempMin: 17 },
      { day: 'FRI', weatherCode: 0, tempMax: 27, tempMin: 17 },
    ],
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'visitor' | 'dhaka'>('visitor');

  // 1. Clock interval
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format hour: "14:28"
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setHour(`${hours}:${mins}`);

      // Format date: "MON 08-23"
      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const dayName = dayNames[now.getDay()];
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      setDateStr(`${dayName} ${month}-${day}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Fetch Weather based on viewMode (Visitor vs Dhaka)
  useEffect(() => {
    let isCancelled = false;

    const fetchWeather = async () => {
      setIsLoading(true);
      try {
        let city = 'Dhaka';
        let isVisitor = false;
        let lat = 23.8103;
        let lon = 90.4125;

        if (viewMode === 'visitor') {
          // Detect visitor's native timezone
          const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka';
          const detectedCity = userTz.split('/')[1]?.replace(/_/g, ' ') || 'Dhaka';

          if (detectedCity && detectedCity.toLowerCase() !== 'dhaka') {
            city = detectedCity;
            isVisitor = true;

            // Geocode visitor city via Open-Meteo free API
            try {
              const geoRes = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
                  city
                )}&count=1`
              );
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData.results && geoData.results[0]) {
                  lat = geoData.results[0].latitude;
                  lon = geoData.results[0].longitude;
                  city = geoData.results[0].name || city;
                }
              }
            } catch {
              // fallback to default coordinates
            }
          }
        }

        // Fetch forecast from Open-Meteo
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
        );

        if (weatherRes.ok) {
          const data = await weatherRes.json();
          if (isCancelled) return;

          const currentTemp = Math.round(data.current?.temperature_2m ?? 26);
          const currentCode = data.current?.weather_code ?? 0;
          const maxTemp = Math.round(data.daily?.temperature_2m_max?.[0] ?? currentTemp + 2);
          const minTemp = Math.round(data.daily?.temperature_2m_min?.[0] ?? currentTemp - 6);

          // Build next 4 days forecast
          const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
          const today = new Date();
          const dailyForecast: DayForecast[] = [];

          for (let i = 1; i <= 4; i++) {
            const nextDate = new Date();
            nextDate.setDate(today.getDate() + i);
            const dName = dayNames[nextDate.getDay()];
            dailyForecast.push({
              day: dName,
              weatherCode: data.daily?.weather_code?.[i] ?? 0,
              tempMax: Math.round(data.daily?.temperature_2m_max?.[i] ?? currentTemp),
              tempMin: Math.round(data.daily?.temperature_2m_min?.[i] ?? currentTemp - 5),
            });
          }

          setWeather({
            city,
            isVisitorLocation: isVisitor,
            temperature: currentTemp,
            condition: getWeatherLabel(currentCode),
            weatherCode: currentCode,
            tempMax: maxTemp,
            tempMin: minTemp,
            daily: dailyForecast,
          });
        }
      } catch {
        // Keep initial fallback values
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchWeather();
    return () => {
      isCancelled = true;
    };
  }, [viewMode]);

  const getWeatherLabel = (code: number) => {
    if (code === 0) return 'Sunny';
    if (code <= 3) return 'Partly Cloudy';
    if (code === 45 || code === 48) return 'Foggy';
    if (code >= 51 && code <= 67) return 'Rainy';
    if (code >= 71 && code <= 77) return 'Snowy';
    if (code >= 80 && code <= 82) return 'Showers';
    if (code >= 95) return 'Thunderstorm';
    return 'Clear';
  };

  const renderWeatherIcon = (code: number, className = 'size-5') => {
    if (code === 0) return <Sun className={cn('text-amber-300 drop-shadow-sm', className)} />;
    if (code <= 3) return <CloudSun className={cn('text-amber-200 drop-shadow-sm', className)} />;
    if (code === 45 || code === 48) return <Cloud className={cn('text-zinc-200', className)} />;
    if (code >= 51 && code <= 67) return <CloudRain className={cn('text-cyan-200', className)} />;
    if (code >= 71 && code <= 77) return <Snowflake className={cn('text-cyan-100', className)} />;
    if (code >= 80 && code <= 82) return <CloudRain className={cn('text-sky-300', className)} />;
    if (code >= 95) return <CloudLightning className={cn('text-amber-400', className)} />;
    return <Sun className={cn('text-amber-300 drop-shadow-sm', className)} />;
  };

  // Currently displayed temperature / condition (if user clicked a daily button)
  const displayTemp = activeDayIdx !== null && weather.daily[activeDayIdx]
    ? weather.daily[activeDayIdx].tempMax
    : weather.temperature;

  const displayCondition = activeDayIdx !== null && weather.daily[activeDayIdx]
    ? getWeatherLabel(weather.daily[activeDayIdx].weatherCode)
    : weather.condition;

  const displayRange = activeDayIdx !== null && weather.daily[activeDayIdx]
    ? `${weather.daily[activeDayIdx].tempMax}°/${weather.daily[activeDayIdx].tempMin}°`
    : `${weather.tempMax}°/${weather.tempMin}°`;

  const displayCode = activeDayIdx !== null && weather.daily[activeDayIdx]
    ? weather.daily[activeDayIdx].weatherCode
    : weather.weatherCode;

  return (
    <div
      className={cn(
        'group/weather relative flex flex-col justify-between overflow-hidden rounded-[24px]',
        'min-h-[190px] h-full sm:min-h-[210px]',
        'border border-line/80 shadow-md transition-all duration-300 select-none',
        className
      )}
    >
      {/* 1. Top Section: Info & Main Weather (Uiverse info-section) */}
      <section className="relative flex-1 p-5 text-white flex items-center justify-between overflow-hidden">
        {/* Background Design (Stone & Copper Sunset Gradient + Circles) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#B45309] via-[#C2410C] to-[#9A3412] dark:from-[#78350F] dark:via-[#92400E] dark:to-[#451A03]"
        >
          {/* Top-right Sun Orbs (from Uiverse mean-dolphin-87) */}
          <div className="absolute -top-[70%] -right-[30%] size-[280px] rounded-full bg-[#F59E0B]/30 blur-xs pointer-events-none" />
          <div className="absolute -top-[55%] -right-[15%] size-[190px] rounded-full bg-[#FCD34D]/35 blur-xs pointer-events-none" />
          <div className="absolute -top-[25%] -right-[5%] size-[95px] rounded-full bg-[#FEF3C7]/90 shadow-lg shadow-amber-300/40 pointer-events-none" />
        </div>

        {/* Left Side: Weather Icon, Condition, Temperature, High/Low Range */}
        <div className="relative z-10 flex flex-col justify-between h-full space-y-1">
          <div className="flex items-center gap-2">
            <div className="shrink-0">
              {renderWeatherIcon(displayCode, 'size-6 sm:size-7')}
            </div>
            <span className="text-xs sm:text-sm font-semibold tracking-wide drop-shadow-xs">
              {displayCondition}
            </span>
          </div>

          <div className="pt-2">
            <div className="text-4xl sm:text-5xl font-black tracking-tight font-mono leading-none drop-shadow-xs">
              {displayTemp}°
            </div>
            <div className="text-[11px] font-mono font-medium text-amber-100/90 tracking-wide mt-1">
              {displayRange}
            </div>
          </div>
        </div>

        {/* Right Side: Live Hour, Date, Location Tag */}
        <div className="relative z-10 flex flex-col items-end justify-between h-full space-y-2 text-right">
          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight leading-none tabular-nums drop-shadow-xs">
              {hour}
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-100/90 mt-1 font-semibold">
              {dateStr}
            </div>
          </div>

          {/* Location Badge with Toggle */}
          <button
            type="button"
            onClick={() => {
              setActiveDayIdx(null);
              setViewMode((prev) => (prev === 'visitor' ? 'dhaka' : 'visitor'));
            }}
            title="Click to toggle between Your Location and Dhaka, Bangladesh"
            className="group/loc inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/25 hover:bg-black/40 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium transition-all cursor-pointer shadow-xs"
          >
            <MapPin className="size-3 text-amber-300 shrink-0 group-hover/loc:scale-110 transition-transform" />
            <span className="truncate max-w-[110px] sm:max-w-[130px] font-semibold">
              {weather.city}
            </span>
            <RefreshCw
              className={cn(
                'size-2.5 text-amber-200/80 transition-transform',
                isLoading && 'animate-spin'
              )}
            />
          </button>
        </div>
      </section>

      {/* 2. Bottom Section: 4-Day Forecast Tabs (Uiverse days-section) */}
      <section className="relative z-10 flex items-center justify-between h-11 w-full bg-[#78350F]/95 dark:bg-[#1C1917]/95 border-t border-white/10 gap-0.5 p-0.5">
        {weather.daily.map((item, idx) => {
          const isSelected = activeDayIdx === idx;
          return (
            <button
              key={item.day}
              type="button"
              onClick={() => setActiveDayIdx(isSelected ? null : idx)}
              title={`${item.day}: ${item.tempMax}° / ${item.tempMin}°, ${getWeatherLabel(item.weatherCode)}`}
              className={cn(
                'flex-1 h-full rounded-[10px] flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer',
                isSelected
                  ? 'bg-amber-500/40 shadow-inner scale-[0.96] ring-1 ring-amber-300/40'
                  : 'bg-[#92400E]/70 dark:bg-[#292524]/80 hover:bg-[#B45309]/80 hover:scale-[0.97]'
              )}
            >
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-white/90">
                {item.day}
              </span>
              <span className="shrink-0">
                {renderWeatherIcon(item.weatherCode, 'size-3.5')}
              </span>
              <span className="text-[10px] font-mono text-amber-200/90 hidden sm:inline">
                {item.tempMax}°
              </span>
            </button>
          );
        })}
      </section>
    </div>
  );
};
