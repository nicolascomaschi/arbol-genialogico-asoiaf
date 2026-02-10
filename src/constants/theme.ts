import { ThemeConfig } from '../types';

export const COLOR_THEMES: Record<string, ThemeConfig> = {
  red: {
    bgGradient: 'from-black via-red-950/20 to-black',
    accentColor: 'text-red-500', textColor: 'text-red-100',
    buttonBg: 'bg-red-900/60 hover:bg-red-800/80 border-red-800', borderColor: 'border-red-900',
    glowColor: 'shadow-red-900/50'
  },
  blue: {
    bgGradient: 'from-black via-sky-950/20 to-black',
    accentColor: 'text-sky-300', textColor: 'text-sky-100',
    buttonBg: 'bg-sky-900/60 hover:bg-sky-800/80 border-sky-800', borderColor: 'border-sky-900',
    glowColor: 'shadow-sky-900/50'
  },
  gold: {
    bgGradient: 'from-black via-yellow-950/20 to-black',
    accentColor: 'text-yellow-500', textColor: 'text-yellow-100',
    buttonBg: 'bg-yellow-900/60 hover:bg-yellow-800/80 border-yellow-800', borderColor: 'border-yellow-700',
    glowColor: 'shadow-yellow-600/40'
  },
  green: {
    bgGradient: 'from-black via-emerald-950/20 to-black',
    accentColor: 'text-emerald-400', textColor: 'text-emerald-100',
    buttonBg: 'bg-emerald-900/60 hover:bg-emerald-800/80 border-emerald-800', borderColor: 'border-emerald-800',
    glowColor: 'shadow-emerald-900/50'
  },
  black: {
    bgGradient: 'from-zinc-900 via-zinc-950 to-black',
    accentColor: 'text-zinc-400', textColor: 'text-zinc-200',
    buttonBg: 'bg-zinc-800 hover:bg-zinc-700 border-zinc-600', borderColor: 'border-zinc-600',
    glowColor: 'shadow-zinc-500/20'
  },
  purple: {
    bgGradient: 'from-black via-purple-950/20 to-black',
    accentColor: 'text-purple-400', textColor: 'text-purple-500',
    buttonBg: 'bg-purple-900/40 hover:bg-purple-900/60', borderColor: 'border-purple-800',
    glowColor: 'shadow-purple-900/50'
  },
  pink: {
    bgGradient: 'from-black via-pink-950/20 to-black',
    accentColor: 'text-pink-400', textColor: 'text-pink-500',
    buttonBg: 'bg-pink-900/40 hover:bg-pink-900/60', borderColor: 'border-pink-800',
    glowColor: 'shadow-pink-900/50'
  },
  cyan: {
    bgGradient: 'from-black via-cyan-950/20 to-black',
    accentColor: 'text-cyan-400', textColor: 'text-cyan-500',
    buttonBg: 'bg-cyan-900/40 hover:bg-cyan-900/60', borderColor: 'border-cyan-800',
    glowColor: 'shadow-cyan-900/50'
  },
  stone: {
    bgGradient: 'from-black via-stone-900/40 to-black',
    accentColor: 'text-stone-400', textColor: 'text-stone-500',
    buttonBg: 'bg-stone-800/60 hover:bg-stone-700/60', borderColor: 'border-stone-600',
    glowColor: 'shadow-stone-500/20'
  }
};
