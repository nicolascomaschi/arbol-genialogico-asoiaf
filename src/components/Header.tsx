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
    sigilDescription?: string;
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
    // Fixed "Floating Island" Container
    <div className={`fixed top-4 left-6 right-6 z-[60] h-20 bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-center px-4 md:px-6 justify-between transition-all duration-300`}>

         {/* LEFT SECTION: House Identity */}
         <div className="flex items-center gap-4 group h-full">

             {/* SIGIL - Smaller & Cleaner */}
             <div className="relative group/sigil h-12 w-12 shrink-0">
                 <div
                   className={`w-full h-full rounded-xl flex items-center justify-center bg-black/20 overflow-hidden border border-white/10 shadow-inner transition-transform group-hover/sigil:scale-105`}
                   style={{ borderColor: theme.customColor || undefined }}
                 >
                    {theme.sigilUrl ? <img src={theme.sigilUrl} alt="" className="w-full h-full object-cover" /> : (isExtinct ? <ShieldOff size={24} className="opacity-80 text-zinc-500" /> : <Shield size={24} className="opacity-90" style={{ color: theme.customColor || undefined }} />)}
                    {!theme.customColor && !theme.sigilUrl && !isExtinct && <Shield size={24} className={`opacity-90 ${themeConfig.accentColor}`} />}
                 </div>

                {/* Sigil Tooltip */}
                {theme.sigilDescription && (
                    <div className="absolute top-14 left-0 w-64 bg-zinc-950 border border-zinc-700 p-3 rounded-lg shadow-2xl opacity-0 group-hover/sigil:opacity-100 transition-opacity pointer-events-none z-[100] text-xs font-sans text-zinc-300 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2 mb-1 text-white font-bold font-cinzel border-b border-zinc-800 pb-1">
                            <Shield size={12}/> Blasón
                        </div>
                        {theme.sigilDescription}
                    </div>
                )}
             </div>

             {/* TEXT INFO */}
             <div className="flex flex-col justify-center h-full pt-1">
                <h1 className={`text-xl font-cinzel font-bold tracking-widest uppercase transition-colors duration-300 flex items-center gap-3 leading-none`} style={{ color: theme.customColor }}>
                    {!theme.customColor && <span className={themeConfig.textColor}>{theme.name}</span>}
                    {theme.customColor && theme.name}
                    <button onClick={onEditHouse} className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-all scale-90 hover:scale-100"><Edit2 size={14}/></button>
                </h1>

                <div className="flex items-center gap-3 mt-1 text-[10px] font-cinzel tracking-wider text-zinc-400 group/seat cursor-help relative h-4">
                    {/* Motto or Status */}
                    <span className="italic opacity-80">{theme.motto ? `"${theme.motto}"` : (isExtinct ? "Casa Extinta" : "Editor de Linaje")}</span>

                    {/* Seat */}
                    {theme.seat && (
                        <>
                            <span className="w-px h-3 bg-zinc-700 mx-1"/>
                            <span className="flex items-center gap-1 hover:text-white transition-colors" title={`Asentamiento: ${theme.seat}`}>
                                <Castle size={10}/> {theme.seat}
                            </span>
                        </>
                    )}

                    {/* Saving Indicator */}
                    {isSaving && (
                        <>
                            <span className="w-px h-3 bg-zinc-700 mx-1"/>
                            <span className="flex items-center gap-1 text-zinc-500 font-sans not-italic animate-pulse">
                                <Loader2 size={10} className="animate-spin"/> Guardando...
                            </span>
                        </>
                    )}

                    {/* History Tooltip */}
                    {theme.history && (
                        <div className="absolute top-8 left-0 w-80 bg-zinc-950 border border-zinc-700 p-4 rounded-lg shadow-2xl opacity-0 group-hover/seat:opacity-100 transition-opacity pointer-events-none z-50 text-xs font-sans text-zinc-300 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-2 mb-2 text-white font-bold font-cinzel border-b border-zinc-800 pb-1"><Feather size={12}/> Historia de la Casa</div>
                            {theme.history}
                        </div>
                    )}
                </div>
             </div>
         </div>

         {/* RIGHT SECTION: Controls */}
         <div className="flex items-center gap-3 h-full">

             {/* SEARCH - Compact */}
             <div className="relative group/search">
                <div className={`bg-zinc-900/50 hover:bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700 flex items-center gap-2 transition-all w-48 focus-within:w-64 focus-within:bg-black focus-within:border-zinc-600`}>
                    <Search size={14} className="text-zinc-500 group-focus-within/search:text-zinc-300"/>
                    <input
                        type="text"
                        placeholder="Buscar personaje..."
                        className="bg-transparent border-none outline-none text-xs text-white w-full font-cinzel placeholder:text-zinc-600"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
                        onFocus={() => setIsSearchOpen(true)}
                        onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                    />
                    {searchQuery && <button onClick={() => setSearchQuery('')}><X size={12} className="text-zinc-500 hover:text-white"/></button>}
                </div>

                {/* Search Results Dropdown */}
                {isSearchOpen && searchResults.length > 0 && (
                    <div className="absolute top-full right-0 mt-3 w-72 bg-zinc-950 border border-zinc-700 rounded-xl shadow-2xl max-h-80 overflow-y-auto custom-scrollbar z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {searchResults.map(char => (
                            <button key={char.id} onClick={() => navigateToCharacterHouse(char)} className="w-full text-left px-4 py-3 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 flex items-center gap-3 transition-colors group/item">
                                <div className="w-8 h-8 rounded-full bg-zinc-900 overflow-hidden shrink-0 border border-zinc-700 group-hover/item:border-zinc-500 transition-colors">
                                    {char.imageUrl ? <img src={char.imageUrl} alt="" className="w-full h-full object-cover"/> : <User size={14} className="m-auto text-zinc-600 h-full w-full p-2"/>}
                                </div>
                                <div>
                                    <span className="font-cinzel font-bold text-xs text-zinc-200 block group-hover/item:text-white">{char.name}</span>
                                    <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">{(char as any).originHouseName ? <><Shield size={8}/> {(char as any).originHouseName}</> : "Sin casa"}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
             </div>

             <div className="w-px h-8 bg-zinc-800 mx-1"/>

             {/* HOUSE SELECTOR - Button Style */}
             <div className="relative">
                <button
                    onClick={() => setIsHouseMenuOpen(!isHouseMenuOpen)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-cinzel text-xs font-bold border ${isHouseMenuOpen ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:bg-zinc-900 hover:text-white hover:border-zinc-700'}`}
                >
                    <Menu size={14} />
                    <span>Casas</span>
                </button>

                {/* House Menu Dropdown */}
                {isHouseMenuOpen && (
                    <div className="absolute top-full right-0 mt-3 w-64 bg-zinc-950/95 backdrop-blur-xl border border-zinc-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-2 z-[60] flex flex-col gap-1 max-h-[60vh] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
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
             </div>
    </div>
  );
};

export default Header;
