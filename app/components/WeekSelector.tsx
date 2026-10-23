'use client';

import { useState, useEffect } from 'react';
import { getCurrentWeek, isFutureWeek, isCurrentWeek } from '../utils/weekCalculator';

interface WeekSelectorProps {
  year: number;
  week: number;
  onChange: (year: number, week: number) => void;
}

export default function WeekSelector({ year, week, onChange }: WeekSelectorProps) {
  const [canGoNext, setCanGoNext] = useState(true);
  const [isToday, setIsToday] = useState(false);

  useEffect(() => {
    setCanGoNext(!isFutureWeek(year, week));
    setIsToday(isCurrentWeek(year, week));
  }, [year, week]);

  const handlePrevious = () => {
    if (week === 1) {
      onChange(year - 1, 52);
    } else {
      onChange(year, week - 1);
    }
  };

  const handleNext = () => {
    if (!canGoNext) return;

    if (week === 52) {
      onChange(year + 1, 1);
    } else {
      onChange(year, week + 1);
    }
  };

  const handleToday = () => {
    const current = getCurrentWeek();
    onChange(current.year, current.week);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Bouton "Aujourd'hui" mis en avant */}
      {!isToday && (
        <button
          onClick={handleToday}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold shadow-md flex items-center gap-2"
          title="Revenir à la semaine actuelle"
        >
          <span>📅</span>
          <span>Aujourd&apos;hui</span>
        </button>
      )}

      {/* Navigation semaines */}
      <div className="flex items-center gap-2 bg-white rounded-lg shadow-md border-2 border-gray-200 p-2">
        <button
          onClick={handlePrevious}
          className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 font-bold text-xl"
          title="Semaine précédente"
        >
          ←
        </button>

        <div className="px-6 py-1 min-w-[180px] text-center">
          <div className="text-2xl font-bold text-gray-900">
            S{week}
          </div>
          <div className="text-sm text-gray-500 font-medium">
            {year}
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors font-bold text-xl ${
            canGoNext
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer'
              : 'bg-gray-50 text-gray-300 cursor-not-allowed'
          }`}
          title={canGoNext ? "Semaine suivante" : "Pas de navigation vers le futur"}
        >
          →
        </button>
      </div>

      {/* Indicateur semaine actuelle */}
      {isToday && (
        <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-sm border-2 border-green-300">
          ✓ Semaine actuelle
        </div>
      )}
    </div>
  );
}
