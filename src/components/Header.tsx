import React from 'react';
import {
  Shield, ShieldOff, Edit2, Loader2, Feather, Menu, Plus,
  Search, X, User, Castle
} from 'lucide-react';
import { ThemeConfig, HouseData, Character } from '../types';

interface HeaderProps {
  theme: {
    name: string;
    config: ThemeConfig;
    sigilUrl?: string;
    motto?: string;
    customColor?: string;
    seat?: string;
    history?: string;
  };
  themeConfig: ThemeConfig;
  isSaving: boolean;
  datasets: Record<string, HouseData>;
  activeTab: string;
  setActiveTab: (id: string) => void;
  isHouseMenuOpen: boolean;
  setIsHouseMenuOpen: (isOpen: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;
  searchResults: Character[];
  navigateToCharacterHouse: (char: Character) => void;
  onOpenCreateHouse: () => void;
  onEditHouse: () => void;
  isExtinct: boolean;
}

const Header: React.FC<HeaderProps> = ({
  theme,
  themeConfig,
  isSaving,
  datasets,
  activeTab,
  setActiveTab,
  isHouseMenuOpen,
  setIsHouseMenuOpen,
  searchQuery,
  setSearchQuery,
  isSearchOpen,
  setIsSearchOpen,
  searchResults,
  navigateToCharacterHouse,
  onOpenCreateHouse,
  onEditHouse,
  isExtinct
}) => {
  return (
    <div className={`absolute top-0 left-0 w-full z-50 bg-gradient-to-b p-0 pb-12 pointer-events-none transition-colors duration-500`} style={theme.customColor ? { background: `linear-gradient(to bottom, ${theme.customColor}E6, transparent)` } : undefined}>
         {!theme.customColor && <div className={`absolute inset-0 bg-gradient-to-b ${themeConfig.bgGradient} -z-10`} />}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 pointer-events-auto gap-4">
             <div className="flex items-center gap-6 group">
                 {/* SIGIL */}
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-black/40 backdrop-blur-md border-2 shadow-lg overflow-hidden shrink-0 relative`} style={{ borderColor: theme.customColor || undefined }}>
                    {!theme.customColor && <div className={`absolute inset-0 border-2 ${themeConfig.borderColor} opacity-50 rounded-xl pointer-events-none`} />}
                    {theme.sigilUrl ? <img src={theme.sigilUrl} alt="" className="w-full h-full object-cover" /> : (isExtinct ? <ShieldOff size={28} className="opacity-90 drop-shadow-lg text-zinc-500" /> : <Shield size={28} className="opacity-90 drop-shadow-lg" style={{ color: theme.customColor || undefined }} />)}
                    {!theme.customColor && !theme.sigilUrl && !isExtinct && <Shield size={28} className={`opacity-90 drop-shadow-lg ${themeConfig.accentColor}`} />}
                 </div>
                 {/* TITLE */}
                 <div>
                    <h1 className={`text-2xl font-cinzel font-bold tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-colors duration-300 flex items-center gap-3`} style={{ color: theme.customColor }}>
                        {!theme.customColor && <span className={themeConfig.textColor}>{theme.name}</span>}
                        {theme.customColor && theme.name}
                        <button onClick={onEditHouse} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-opacity"><Edit2 size={16}/></button>
                    </h1>
                    <div className="text-zinc-300 text-xs mt-0.5 italic font-cinzel tracking-wider flex items-center gap-2 opacity-80 group/seat cursor-help relative">
                        <span className="w-8 h-px bg-zinc-500/50 inline-block"/>
                        {theme.motto ? `"${theme.motto}"` : (isExtinct ? "Casa Extinta" : "Editor de Linaje")}
                        {theme.seat && <span className="text-zinc-600 mx-1">•</span>}
                        {theme.seat && <span className="flex items-center gap-1 text-zinc-400 hover:text-white" title={`Asentamiento: ${theme.seat}`}><Castle size={12}/> {theme.seat}</span>}
                        <span className="w-8 h-px bg-zinc-500/50 inline-block"/>
                        {isSaving && <span className="ml-2 flex items-center gap-1 text-zinc-500 text-[10px] font-sans not-italic"><Loader2 size={10} className="animate-spin"/> Guardando...</span>}
                        {/* House History Tooltip */}
                        {theme.history && (
                            <div className="absolute top-6 left-0 w-80 bg-zinc-950 border border-zinc-700 p-4 rounded-lg shadow-2xl opacity-0 group-hover/seat:opacity-100 transition-opacity pointer-events-none z-50 text-xs font-sans text-zinc-300 text-left">
                                <div className="flex items-center gap-2 mb-2 text-white font-bold font-cinzel border-b border-zinc-800 pb-1"><Feather size={12}/> Historia de la Casa</div>
                                {theme.history}
                            </div>
                        )}
                    </div>
                 </div>
             </div>
             {/* TABS & TOOLS */}
             <div className="flex flex-col items-end gap-2">
                 {/* MENU HAMBURGUESA DE CASAS */}
                 <div className="relative">
                    <button
                        onClick={() => setIsHouseMenuOpen(!isHouseMenuOpen)}
                        className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-md border border-zinc-700/50 text-zinc-300 hover:text-white transition-colors font-cinzel text-xs"
                    >
                        <Menu size={14} /> <span className="hidden sm:inline">Casas</span>
                    </button>
                    {isHouseMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-zinc-950/95 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl p-2 z-[60] flex flex-col gap-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase px-2 py-1">Seleccionar Casa</h3>
                            {Object.values(datasets).map(h => {
                                const isActive = activeTab === h.id;
                                const hCustom = h.theme.customColor;
                                return (
                                    <button
                                        key={h.id}
                                        onClick={() => { setActiveTab(h.id); setIsHouseMenuOpen(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold font-cinzel border transition-all flex items-center gap-3 ${isActive && !hCustom ? `${h.theme.config.accentColor} bg-white/5 border-white/10` : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'} ${h.isExtinct ? 'opacity-70 grayscale' : ''}`}
                                        style={isActive && hCustom ? { color: hCustom, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: hCustom } : {}}
                                    >
                                        {h.isExtinct ? (
                                            <ShieldOff size={14} className={isActive ? "opacity-100" : "opacity-70"} />
                                        ) : h.theme.sigilUrl ? (
                                            <img src={h.theme.sigilUrl} alt="" className="w-4 h-4 object-contain opacity-80" />
                                        ) : (
                                            <Shield size={14} fill={isActive ? "currentColor" : "none"} />
                                        )}
                                        {h.theme.name}
                                    </button>
                                );
                            })}
                            <div className="h-px bg-zinc-800 my-1 mx-2"/>
                            <button
                                onClick={() => { onOpenCreateHouse(); setIsHouseMenuOpen(false); }}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-emerald-400 hover:bg-emerald-950/30 border border-transparent hover:border-emerald-900/50 font-cinzel flex items-center gap-2"
                            >
                                <Plus size={14}/> Nueva Casa
                            </button>
                        </div>
                    )}
                 </div>

                 {/* SEARCH */}
                 <div className="flex gap-2">
                    <div className="bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-700 flex items-center gap-2">
                        <Search size={14} className="text-zinc-400"/>
                        <input type="text" placeholder="Buscar..." className="bg-transparent border-none outline-none text-xs text-white w-32 font-cinzel" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }} onFocus={() => setIsSearchOpen(true)} onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}/>
                        {searchQuery && <button onClick={() => setSearchQuery('')}><X size={12} className="text-zinc-500 hover:text-white"/></button>}
                    </div>
                 </div>
                 {isSearchOpen && searchResults.length > 0 && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-zinc-950 border border-zinc-700 rounded-lg shadow-2xl max-h-80 overflow-y-auto custom-scrollbar z-50">
                        {searchResults.map(char => (
                            <button key={char.id} onClick={() => navigateToCharacterHouse(char)} className="w-full text-left px-4 py-3 border-b border-zinc-800 last:border-0 hover:bg-zinc-800 flex items-center gap-3 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-zinc-900 overflow-hidden shrink-0 border border-zinc-600">{char.imageUrl ? <img src={char.imageUrl} alt="" className="w-full h-full object-cover"/> : <User size={16} className="m-auto text-zinc-500"/>}</div>
                                <div><span className="font-cinzel font-bold text-sm text-zinc-200 block">{char.name}</span><span className="text-[10px] text-zinc-500 flex items-center gap-1">{(char as any).originHouseName && <><Shield size={8}/> {(char as any).originHouseName}</>}</span></div>
                            </button>
                        ))}
                    </div>
                )}
             </div>
        </div>
      </div>
  );
};

export default Header;
