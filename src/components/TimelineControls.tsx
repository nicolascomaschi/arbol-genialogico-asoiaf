import React from 'react';
import { RotateCcw, Flame, Crown } from 'lucide-react';
import { formatYear } from '../utils/date';

interface TimelineControlsProps {
  minYear: number;
  maxYear: number;
  currentYear: number | null;
  onYearChange: (year: number) => void;
  showDragonRiders: boolean;
  onToggleDragonRiders: () => void;
  showKings: boolean;
  onToggleKings: () => void;
  onReset: () => void;
  className?: string;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  minYear,
  maxYear,
  currentYear,
  onYearChange,
  showDragonRiders,
  onToggleDragonRiders,
  showKings,
  onToggleKings,
  onReset,
  className = ''
}) => {
  // If currentYear is null (timeline inactive), we treat it as maxYear for slider position
  const sliderValue = currentYear ?? maxYear;

  return (
    <div className={`bg-zinc-900/90 border border-zinc-700 rounded-xl p-4 flex flex-col gap-4 shadow-2xl backdrop-blur-md w-64 ${className}`}>

      {/* Timeline Slider Section */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
          <span>{formatYear(minYear)}</span>
          <span className={currentYear !== null ? 'text-white font-bold' : ''}>
            {currentYear !== null ? formatYear(currentYear) : 'Todos'}
          </span>
          <span>{formatYear(maxYear)}</span>
        </div>
        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={sliderValue}
          onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white hover:accent-zinc-300 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
        />
      </div>

      <div className="h-px bg-zinc-800 w-full" />

      {/* Filters Section */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
            <button
            onClick={onToggleDragonRiders}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-cinzel transition-all border ${
                showDragonRiders
                ? 'bg-orange-900/40 text-orange-200 border-orange-700/50'
                : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
            title="Ver solo Jinetes de Dragón"
            >
            <Flame size={14} className={showDragonRiders ? 'text-orange-500' : 'text-zinc-500'} />
            <span>Jinetes</span>
            </button>

            <button
            onClick={onToggleKings}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-cinzel transition-all border ${
                showKings
                ? 'bg-yellow-900/40 text-yellow-200 border-yellow-700/50'
                : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
            title="Ver solo Reyes"
            >
            <Crown size={14} className={showKings ? 'text-yellow-500' : 'text-zinc-500'} />
            <span>Reyes</span>
            </button>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="w-full py-2 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs flex items-center justify-center gap-2 transition-colors border border-zinc-700"
        title="Restablecer filtros"
      >
        <RotateCcw size={12} /> Restablecer Filtros
      </button>
    </div>
  );
};

export default TimelineControls;
