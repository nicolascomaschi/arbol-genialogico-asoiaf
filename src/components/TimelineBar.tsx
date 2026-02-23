import React, { useState } from 'react';
import { RotateCcw, Flame, Crown, Settings } from 'lucide-react';
import { formatYear } from '../utils/date';
import { TimelineEvent } from '../types';

interface TimelineBarProps {
  minYear: number;
  maxYear: number;
  currentYear: number | null;
  onYearChange: (year: number) => void;
  showDragonRiders: boolean;
  onToggleDragonRiders: () => void;
  showKings: boolean;
  onToggleKings: () => void;
  onReset: () => void;
  events?: TimelineEvent[];
  onOpenEventsManager?: () => void;
}

const TimelineBar: React.FC<TimelineBarProps> = ({
  minYear,
  maxYear,
  currentYear,
  onYearChange,
  showDragonRiders,
  onToggleDragonRiders,
  showKings,
  onToggleKings,
  onReset,
  events = [],
  onOpenEventsManager
}) => {
  const sliderValue = currentYear ?? maxYear;
  const percentage = ((sliderValue - minYear) / (maxYear - minYear)) * 100;

  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  return (
    <div className="fixed bottom-0 left-0 w-full h-20 bg-zinc-950/90 border-t border-zinc-800 backdrop-blur-md z-[70] flex items-center px-4 gap-4 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">

      {/* Current Year Display (Left) */}
      <div className="flex flex-col items-center justify-center min-w-[80px] border-r border-zinc-800 pr-4">
         <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Año</div>
         <div className={`text-xl font-cinzel font-bold text-center leading-none ${currentYear !== null ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'text-zinc-600'}`}>
            {currentYear !== null ? formatYear(currentYear) : formatYear(maxYear)}
         </div>
      </div>

      {/* Timeline Slider Area (Middle) */}
      <div className="flex-1 relative h-full flex flex-col justify-center py-2">

        {/* Events Track (Top Half) */}
        <div className="absolute top-2 left-0 w-full h-6 pointer-events-none">
            {events.map(evt => {
                const totalSpan = maxYear - minYear;
                if (totalSpan <= 0) return null;

                const startP = Math.max(0, Math.min(100, ((evt.startYear - minYear) / totalSpan) * 100));
                const endP = Math.max(0, Math.min(100, ((evt.endYear - minYear) / totalSpan) * 100));
                const widthP = Math.max(0.5, endP - startP); // Min visual width

                return (
                    <div
                        key={evt.id}
                        className="absolute h-4 top-1 rounded-sm cursor-pointer pointer-events-auto hover:h-5 transition-all group"
                        style={{
                            left: `${startP}%`,
                            width: `${widthP}%`,
                            minWidth: '4px', // Visual min-width for short events
                            backgroundColor: evt.color === 'zinc' ? '#52525b' : (evt.color === 'gold' ? '#eab308' : evt.color)
                        }}
                        onMouseEnter={() => setHoveredEventId(evt.id)}
                        onMouseLeave={() => setHoveredEventId(null)}
                        onClick={(e) => { e.stopPropagation(); onYearChange(evt.startYear); }}
                    >
                        {/* Event Label (Only if wide enough, otherwise Tooltip) */}
                        {widthP > 5 && (
                            <span className="absolute inset-0 flex items-center px-1 text-[9px] font-bold text-black/60 truncate uppercase tracking-tighter select-none">
                                {evt.title}
                            </span>
                        )}

                        {/* Tooltip on Hover */}
                        {hoveredEventId === evt.id && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs font-cinzel font-bold rounded-lg shadow-xl whitespace-nowrap z-[80] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <div>{evt.title}</div>
                                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{formatYear(evt.startYear)} - {formatYear(evt.endYear)}</div>
                                <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-950 border-r border-b border-zinc-700 rotate-45"></div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        {/* Slider Track */}
        <div className="relative w-full h-10 flex items-center">
            {/* Base Line */}
            <div className="absolute w-full h-1 bg-zinc-800 rounded-full" />
            {/* Active Line */}
            <div className="absolute left-0 h-1 bg-gradient-to-r from-zinc-600 to-zinc-200 rounded-full" style={{ width: `${percentage}%` }} />

            {/* Input Range */}
            <input
              type="range"
              min={minYear}
              max={maxYear}
              value={sliderValue}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
              className="absolute w-full h-full opacity-0 cursor-pointer z-10"
            />

            {/* Custom Thumb */}
            <div
                className="absolute h-5 w-5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] border-2 border-zinc-900 pointer-events-none transition-all duration-75 ease-out z-20 flex items-center justify-center"
                style={{ left: `calc(${percentage}% - 10px)` }}
            >
                <div className="w-1.5 h-1.5 bg-zinc-900 rounded-full" />
            </div>
        </div>
      </div>

      {/* Controls (Right) */}
      <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
        <button
          onClick={onToggleDragonRiders}
          title="Jinetes de Dragón"
          className={`p-2 rounded-lg border transition-all ${showDragonRiders ? 'bg-orange-950/50 text-orange-400 border-orange-500/50' : 'bg-transparent text-zinc-500 border-transparent hover:bg-zinc-800 hover:text-zinc-300'}`}
        >
          <Flame size={18} />
        </button>

        <button
          onClick={onToggleKings}
          title="Reyes"
          className={`p-2 rounded-lg border transition-all ${showKings ? 'bg-yellow-950/50 text-yellow-400 border-yellow-500/50' : 'bg-transparent text-zinc-500 border-transparent hover:bg-zinc-800 hover:text-zinc-300'}`}
        >
          <Crown size={18} />
        </button>

        <div className="w-px h-8 bg-zinc-800 mx-1" />

        <button
          onClick={onOpenEventsManager}
          title="Gestionar Eras"
          className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
        >
          <Settings size={18} />
        </button>

        <button
          onClick={onReset}
          title="Restablecer"
          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-all"
        >
          <RotateCcw size={18} />
        </button>
      </div>

    </div>
  );
};

export default TimelineBar;
