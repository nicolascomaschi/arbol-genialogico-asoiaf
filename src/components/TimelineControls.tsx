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
    <div className={`bg-zinc-900/90 border border-zinc-700 rounded-xl py-4 px-2 flex flex-col items-center gap-4 shadow-2xl backdrop-blur-md w-16 ${className}`}>

      {/* Filters Section (Icons Only) */}
      <div className="flex flex-col gap-2 w-full">
        <button
          onClick={onToggleDragonRiders}
          className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all border ${
            showDragonRiders
              ? 'bg-orange-900/40 text-orange-200 border-orange-700/50'
              : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
          title="Ver solo Jinetes de Dragón"
        >
          <Flame size={18} className={showDragonRiders ? 'text-orange-500' : 'text-zinc-500'} />
        </button>

        <button
          onClick={onToggleKings}
          className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all border ${
            showKings
              ? 'bg-yellow-900/40 text-yellow-200 border-yellow-700/50'
              : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
          title="Ver solo Reyes"
        >
          <Crown size={18} className={showKings ? 'text-yellow-500' : 'text-zinc-500'} />
        </button>
      </div>

      <div className="w-full h-px bg-zinc-800" />

      {/* Vertical Slider Section */}
      <div className="flex-1 flex flex-col items-center gap-2 h-64 w-full relative py-2">
        <div className="text-[10px] text-zinc-500 font-mono">{formatYear(maxYear)}</div>

        {/* Slider Container */}
        <div className="relative flex-1 w-full flex items-center justify-center">
             {/* We use a transformed horizontal input to behave vertically */}
             <input
              type="range"
              min={minYear}
              max={maxYear}
              value={sliderValue}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
              className="absolute w-48 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white hover:accent-zinc-300 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all -rotate-90 origin-center"
              style={{ width: '160px' }} // Width becomes height when rotated
            />
        </div>

        <div className="text-[10px] text-zinc-500 font-mono">{formatYear(minYear)}</div>
      </div>

      <div className="w-full h-px bg-zinc-800" />

      {/* Current Year & Reset */}
      <div className="flex flex-col items-center gap-2 w-full">
        <div className={`text-[10px] font-bold font-mono text-center ${currentYear !== null ? 'text-white' : 'text-zinc-500'}`}>
            {currentYear !== null ? formatYear(currentYear) : 'TODOS'}
        </div>

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
