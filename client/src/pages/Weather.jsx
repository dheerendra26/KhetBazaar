import { useState } from "react";
import { useLang } from "../context/LanguageContext";

const Weather = () => {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLang();

  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

  const fetchWeather = async () => {
    if (!city) return;
    setLoading(true); setError(""); setWeather(null);
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
      if (!res.ok) throw new Error(t("cityNotFound"));
      setWeather(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">{t("weatherTitle")}</h1>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder={t("enterCity")}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchWeather()}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={fetchWeather} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            {t("search")}
          </button>
        </div>
        {loading && <p className="text-center text-gray-600">{t("loadingWeather")}</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {weather && (
          <div className="mt-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800">{weather.name}, {weather.sys.country}</h2>
            <img src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} alt="weather icon" className="mx-auto" />
            <p className="text-4xl font-bold text-gray-800">{Math.round(weather.main.temp)}°C</p>
            <p className="capitalize text-gray-600">{weather.weather[0].description}</p>
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-700">
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="font-medium">{t("humidity")}</p>
                <p>{weather.main.humidity}%</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="font-medium">{t("wind")}</p>
                <p>{weather.wind.speed} m/s</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Weather;
