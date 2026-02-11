import React, { useState } from 'react';
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
  const sliderValue = currentYear ?? maxYear;
  const percentage = ((sliderValue - minYear) / (maxYear - minYear)) * 100;

  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Helper to render tooltip to the right of the sidebar
  const renderTooltip = (text: string) => (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs font-cinzel font-bold rounded-lg shadow-xl whitespace-nowrap z-[60] pointer-events-none animate-in fade-in slide-in-from-left-2 duration-200">
      <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-zinc-700" />
      {text}
    </div>
  );

  return (
    <div className={`bg-zinc-900/95 border border-zinc-700 rounded-2xl py-4 px-2 flex flex-col items-center gap-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl w-20 transition-all duration-300 ${className}`}>

      {/* Current Year Display */}
      <div className="flex flex-col items-center justify-center w-full pb-2 border-b border-zinc-800">
         <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Año</div>
         <div className={`text-sm font-cinzel font-bold text-center leading-none ${currentYear !== null ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'text-zinc-600'}`}>
            {currentYear !== null ? formatYear(currentYear) : '---'}
         </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col gap-3 w-full px-1">
        <button
          onClick={onToggleDragonRiders}
          onMouseEnter={() => setHoveredButton('dragon')}
          onMouseLeave={() => setHoveredButton(null)}
          className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200 border-2 relative group ${
            showDragonRiders
              ? 'bg-orange-950/50 text-orange-400 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
              : 'bg-zinc-800/30 text-zinc-500 border-transparent hover:bg-zinc-800 hover:text-zinc-300 hover:border-zinc-600'
          }`}
        >
          <Flame size={20} className={showDragonRiders ? 'fill-orange-500/20' : ''} />
          {hoveredButton === 'dragon' && renderTooltip("Jinetes de Dragón")}
        </button>

        <button
          onClick={onToggleKings}
          onMouseEnter={() => setHoveredButton('kings')}
          onMouseLeave={() => setHoveredButton(null)}
          className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200 border-2 relative group ${
            showKings
              ? 'bg-yellow-950/50 text-yellow-400 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
              : 'bg-zinc-800/30 text-zinc-500 border-transparent hover:bg-zinc-800 hover:text-zinc-300 hover:border-zinc-600'
          }`}
        >
          <Crown size={20} className={showKings ? 'fill-yellow-500/20' : ''} />
          {hoveredButton === 'kings' && renderTooltip("Reyes de Poniente")}
        </button>
      </div>

      {/* Vertical Slider Section */}
      <div className="flex-1 flex flex-col items-center justify-center w-full relative min-h-[220px]">
        {/* Track Line Background */}
        <div className="absolute h-full w-1 bg-zinc-800 rounded-full" />
        <div className="absolute bottom-0 w-1 bg-gradient-to-t from-zinc-600 to-zinc-800 rounded-full transition-all duration-100" style={{ height: `${percentage}%` }} />

        {/* Input Range - Improved Hit Area */}
        <div className="absolute inset-0 flex items-center justify-center">
             <input
              type="range"
              min={minYear}
              max={maxYear}
              value={sliderValue}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
              // Standard vertical appearance where supported, fallback to rotation if needed but fixing dimensions
              // Note: Tailwind doesn't have built-in vertical range utils, using style.
              className="opacity-0 cursor-pointer w-full h-full"
              style={{
                  appearance: 'slider-vertical', // Works in Chrome/Edge/Safari
                  WebkitAppearance: 'slider-vertical',
                  width: '100%',
                  height: '100%'
              } as React.CSSProperties}
            />
        </div>

        {/* Custom Thumb Visual (Follows value) - Pointer events none so click goes through to input */}
        <div
            className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] border-2 border-zinc-900 pointer-events-none transition-all duration-75 ease-out"
            style={{ bottom: `calc(${percentage}% - 8px)` }}
        >
            {/* Year Tooltip next to thumb */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-zinc-800 text-white text-[10px] font-mono rounded border border-zinc-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                {formatYear(sliderValue)}
            </div>
        </div>
      </div>

      <div className="w-full h-px bg-zinc-800 mt-2" />

      {/* Reset Button */}
      <button
        onClick={onReset}
        onMouseEnter={() => setHoveredButton('reset')}
        onMouseLeave={() => setHoveredButton(null)}
        className="p-3 hover:bg-red-900/20 text-zinc-500 hover:text-red-400 rounded-xl transition-all duration-300 group relative"
      >
        <RotateCcw size={18} className="group-hover:-rotate-180 transition-transform duration-500" />
        {hoveredButton === 'reset' && renderTooltip("Restablecer")}
      </button>
    </div>
  );
};

export default TimelineControls;
