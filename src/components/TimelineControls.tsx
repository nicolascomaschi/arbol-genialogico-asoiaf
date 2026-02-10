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
  onReset
}) => {
  // If currentYear is null (timeline inactive), we treat it as maxYear for slider position
  const sliderValue = currentYear ?? maxYear;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900/90 border border-zinc-700 rounded-xl px-6 py-4 flex items-center gap-6 shadow-2xl backdrop-blur-md max-w-4xl w-[90%] md:w-auto">

      {/* Filters Section */}
      <div className="flex items-center gap-4 border-r border-zinc-700 pr-4">
        <button
          onClick={onToggleDragonRiders}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-cinzel transition-all border ${
            showDragonRiders
              ? 'bg-orange-900/40 text-orange-200 border-orange-700/50'
              : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
          title="Ver solo Jinetes de Dragón"
        >
          <Flame size={14} className={showDragonRiders ? 'text-orange-500' : 'text-zinc-500'} />
          <span className="hidden md:inline">Jinetes</span>
        </button>

        <button
          onClick={onToggleKings}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-cinzel transition-all border ${
            showKings
              ? 'bg-yellow-900/40 text-yellow-200 border-yellow-700/50'
              : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
          title="Ver solo Reyes"
        >
          <Crown size={14} className={showKings ? 'text-yellow-500' : 'text-zinc-500'} />
          <span className="hidden md:inline">Reyes</span>
        </button>
      </div>

      {/* Timeline Slider Section */}
      <div className="flex-1 flex flex-col gap-1 min-w-[200px]">
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

      {/* Reset Button */}
      <div className="border-l border-zinc-700 pl-4">
        <button
          onClick={onReset}
          className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
          title="Restablecer filtros"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};

export default TimelineControls;
