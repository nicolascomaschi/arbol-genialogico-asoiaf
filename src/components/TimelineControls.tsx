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

  // Calculate percentage for the tooltip position (inverted because slider is vertical max-to-min visually often, but here min is bottom)
  // Our slider is rotated -90deg.
  // Input Range: min (left/bottom) -> max (right/top).
  const percentage = ((sliderValue - minYear) / (maxYear - minYear)) * 100;

  return (
    <div className={`bg-zinc-900/95 border border-zinc-700 rounded-2xl py-4 px-2 flex flex-col items-center gap-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl w-20 transition-all duration-300 ${className}`}>

      {/* Current Year Display - Top Prominence */}
      <div className="flex flex-col items-center justify-center w-full pb-2 border-b border-zinc-800">
         <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Año</div>
         <div className={`text-sm font-cinzel font-bold text-center leading-none ${currentYear !== null ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'text-zinc-600'}`}>
            {currentYear !== null ? formatYear(currentYear) : '---'}
         </div>
      </div>

      {/* Filters Section (Icons Only) */}
      <div className="flex flex-col gap-3 w-full px-1">
        <button
          onClick={onToggleDragonRiders}
          className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200 border-2 ${
            showDragonRiders
              ? 'bg-orange-950/50 text-orange-400 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
              : 'bg-zinc-800/30 text-zinc-500 border-transparent hover:bg-zinc-800 hover:text-zinc-300 hover:border-zinc-600'
          }`}
          title="Ver solo Jinetes de Dragón"
        >
          <Flame size={20} className={showDragonRiders ? 'fill-orange-500/20' : ''} />
        </button>

        <button
          onClick={onToggleKings}
          className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200 border-2 ${
            showKings
              ? 'bg-yellow-950/50 text-yellow-400 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
              : 'bg-zinc-800/30 text-zinc-500 border-transparent hover:bg-zinc-800 hover:text-zinc-300 hover:border-zinc-600'
          }`}
          title="Ver solo Reyes"
        >
          <Crown size={20} className={showKings ? 'fill-yellow-500/20' : ''} />
        </button>
      </div>

      {/* Vertical Slider Section */}
      <div className="flex-1 flex flex-col items-center justify-center w-full relative min-h-[220px]">
        {/* Track Line Background */}
        <div className="absolute h-full w-1 bg-zinc-800 rounded-full" />
        <div className="absolute bottom-0 w-1 bg-gradient-to-t from-zinc-600 to-zinc-800 rounded-full transition-all duration-100" style={{ height: `${percentage}%` }} />

        {/* Input Range - Rotated */}
        {/* We use a large width and rotate it. The 'width' in CSS becomes the 'height' of the vertical slider area. */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <input
              type="range"
              min={minYear}
              max={maxYear}
              value={sliderValue}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
              className="w-[200px] h-10 opacity-0 cursor-pointer pointer-events-auto -rotate-90"
              style={{ width: '220px' }}
            />
        </div>

        {/* Custom Thumb Visual (Follows value) */}
        <div
            className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] border-2 border-zinc-900 pointer-events-none transition-all duration-75 ease-out"
            style={{ bottom: `calc(${percentage}% - 8px)` }}
        >
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2 py-1 bg-zinc-800 text-white text-[10px] font-mono rounded border border-zinc-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {formatYear(sliderValue)}
            </div>
        </div>

        {/* Min/Max indicators */}
        <div className="absolute -top-6 text-[9px] text-zinc-600 font-mono">{formatYear(maxYear)}</div>
        <div className="absolute -bottom-6 text-[9px] text-zinc-600 font-mono">{formatYear(minYear)}</div>
      </div>

      <div className="w-full h-px bg-zinc-800 mt-2" />

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="p-3 hover:bg-red-900/20 text-zinc-500 hover:text-red-400 rounded-xl transition-all duration-300 group"
        title="Restablecer filtros"
      >
        <RotateCcw size={18} className="group-hover:-rotate-180 transition-transform duration-500" />
      </button>
    </div>
  );
};

export default TimelineControls;
