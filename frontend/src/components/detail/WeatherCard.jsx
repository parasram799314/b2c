// components/detail/WeatherCard.jsx

export default function WeatherTab({ weather }) {
  if (!weather) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        <div className="text-4xl mb-3">🌤️</div>
        No weather data available.
      </div>
    );
  }

  const { city, forecasts = [], packingSuggestions = [], summary, isPlaceholder } = weather;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="font-bold text-base text-gray-900 mb-0.5">
          🌤️ Weather Forecast
          {city && <span className="text-gray-400 font-normal text-sm ml-2">— {city}</span>}
        </div>
        {summary && <div className="text-xs text-gray-500 mt-1">{summary}</div>}
        {isPlaceholder && (
          <div className="mt-2 text-xs bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5 text-yellow-700 inline-block">
            ⚠️ Estimated forecast — actual may vary
          </div>
        )}
      </div>

      {/* Forecast cards */}
      {forecasts.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-5 sm:grid-cols-4 md:grid-cols-5">
          {forecasts.map((day, i) => (
            <div
              key={i}
              className={`rounded-2xl p-3 flex flex-col items-center gap-1 border ${
                day.isReal
                  ? 'bg-white border-blue-100'
                  : 'bg-gray-50 border-gray-100'
              }`}
            >
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">{day.dayLabel}</div>
              <div className="text-xs text-gray-400">{day.displayDate}</div>
              <div className="text-3xl my-1">{day.emoji}</div>
              <div className="text-sm font-black text-gray-900">{day.temp}°C</div>
              <div className="text-xs text-gray-400">
                {day.tempMin}° – {day.tempMax}°
              </div>
              <div className="text-xs text-gray-500 text-center leading-tight mt-0.5">{day.condition}</div>
              <div className="flex items-center gap-1 mt-1 flex-wrap justify-center">
                {day.humidity && (
                  <span className="text-xs text-blue-400">💧{day.humidity}%</span>
                )}
                {day.windSpeed > 0 && (
                  <span className="text-xs text-gray-400">💨{day.windSpeed}km/h</span>
                )}
              </div>
              {!day.isReal && (
                <span className="text-xs text-gray-300 italic mt-0.5">est.</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Packing suggestions */}
      {packingSuggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="text-xs font-bold text-blue-800 mb-3">🧳 Packing Suggestions</div>
          <div className="grid grid-cols-2 gap-2">
            {packingSuggestions.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-blue-700">
                <span className="mt-0.5 flex-shrink-0">{tip.split(' ')[0]}</span>
                <span>{tip.split(' ').slice(1).join(' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weather legend */}
      <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-3">
        <div className="text-xs font-bold text-gray-600 mb-2">🌡️ Temperature Guide</div>
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
          <div>❄️ Below 10°C — Heavy coat</div>
          <div>🧣 10–18°C — Light jacket</div>
          <div>👕 18–28°C — Comfortable</div>
          <div>🥵 Above 28°C — Light clothes</div>
        </div>
      </div>
    </div>
  );
}