import React, { memo } from 'react';
import {
  GitCommit, MoreVertical, User, Crown, Flame, Ban, AlertTriangle,
  Skull, HelpCircle, Ghost, BookOpen, LogOut, Edit2, Plus, UserPlus,
  HeartPulse, Trash2
} from 'lucide-react';
import { Character, ThemeConfig } from '../types';
import { GAP_NODE_SIZE, CARD_WIDTH, CARD_HEIGHT, X_SPACING, Y_SPACING } from '../constants/config';

interface CharacterNodeProps {
  char: Character;
  activeTab: string;
  theme: {
    name: string;
    config: ThemeConfig;
    customColor?: string;
  };
  themeConfig: ThemeConfig;
  draggingNode: string | null;
  activeMenu: string | null;
  targetHouseName: string | null;
  onNodeDragStart: (e: React.MouseEvent, id: string) => void;
  setActiveMenu: (id: string | null) => void;
  onOpenModal: (mode: 'add-child' | 'add-parent' | 'add-partner' | 'edit', id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (char: Character) => void;
  isDimmed?: boolean;
}

const CharacterNode: React.FC<CharacterNodeProps> = ({
  char,
  activeTab,
  theme,
  themeConfig,
  draggingNode,
  activeMenu,
  targetHouseName,
  onNodeDragStart,
  setActiveMenu,
  onOpenModal,
  onDelete,
  onNavigate,
  isDimmed
}) => {
  return (
    <div
      className={`absolute rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] group transition-all duration-300
          ${isDimmed ? 'opacity-20 grayscale pointer-events-none' : ''}
          ${char.isGap ? 'w-[60px] h-[60px] rounded-full border-dashed border-2 border-zinc-600 bg-black/50 flex items-center justify-center' : ''}
          ${!char.isGap ? 'border border-zinc-700 bg-zinc-900 overflow-visible' : ''}
          ${!isDimmed && char.house === activeTab ? (theme.customColor ? '' : themeConfig.borderColor) : (!isDimmed ? 'border-zinc-700 opacity-80 hover:opacity-100' : 'border-zinc-800')}
          ${!isDimmed && char.isKing && char.house === activeTab && !theme.customColor ? themeConfig.glowColor : ''}
          ${activeMenu === char.id ? 'z-[60]' : (draggingNode === char.id ? 'z-[100] scale-105 ring-2 ring-white/20 cursor-grabbing' : (isDimmed ? 'z-0' : 'z-10 hover:z-50 hover:scale-[1.02] cursor-grab'))}
      `}
      style={{
          left: char.x * X_SPACING, top: char.generation * Y_SPACING,
          width: char.isGap ? GAP_NODE_SIZE : CARD_WIDTH, height: char.isGap ? GAP_NODE_SIZE : CARD_HEIGHT,
          borderColor: (!char.isGap && char.house === activeTab && theme.customColor) ? theme.customColor : undefined,
          boxShadow: (!char.isGap && char.isKing && char.house === activeTab && theme.customColor) ? `0 0 25px ${theme.customColor}66` : undefined,
          transition: draggingNode === char.id ? 'none' : 'transform 0.2s, box-shadow 0.2s, border-color 0.3s'
      }}
      onMouseDown={(e) => onNodeDragStart(e, char.id)}
    >
      {char.isGap ? (
         <>
              <GitCommit className="text-zinc-500" />
              {/* Botón de menú para Gaps */}
              <button
                  className="absolute -top-2 -right-2 p-1 bg-zinc-900 hover:bg-zinc-800 rounded-full border border-zinc-700 text-zinc-400 hover:text-white transition-colors z-30 shadow-md no-drag"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === char.id ? null : char.id); }}
              >
                  <MoreVertical size={14} />
              </button>
          </>
      ) : (
          <>
              {/* --- IMAGEN DE FONDO COMPLETA (Con overflow-hidden) --- */}
              <div className="absolute inset-0 z-0 overflow-hidden rounded-xl">
                  {char.imageUrl ? <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" /> : <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-700"><User size={64} strokeWidth={1}/></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"/>
              </div>

              {/* --- ICONOS DE ESTADO (Bottom Right Vertical) --- */}
              <div className="absolute bottom-16 right-3 z-20 flex flex-col gap-2 items-center pointer-events-auto">
                  {char.isKing && <div title="Monarca"><Crown size={14} className="text-yellow-500 drop-shadow-md"/></div>}
                  {char.isDragonRider && <div title={`Jinete de ${char.dragonName || 'Dragón'}`}><Flame size={14} className="text-orange-500 drop-shadow-md"/></div>}
                  {char.isBastard && <div title="Bastardo"><Ban size={14} className="text-zinc-400 drop-shadow-md"/></div>}
                  {char.isNonCanon && <div title="No Canon"><AlertTriangle size={14} className="text-amber-500 drop-shadow-md"/></div>}
                  {char.status === 'dead' && <div title="Fallecido"><Skull size={14} className="text-zinc-500"/></div>}
                  {char.status === 'missing' && <div title="Desaparecido"><HelpCircle size={14} className="text-amber-500"/></div>}
                  {char.status === 'unknown' && <div title="Desconocido"><Ghost size={14} className="text-purple-500"/></div>}
              </div>

              {/* --- LORE (Tooltip - Top Left) --- */}
              {(char.lore || char.wikiLink) && (
                  <div className="absolute top-2 left-2 z-20 group/lore pointer-events-auto">
                      {char.wikiLink ? (
                          <a
                             href={char.wikiLink}
                             target="_blank"
                             rel="noopener noreferrer"
                             onClick={(e) => e.stopPropagation()}
                             className="block text-zinc-400 hover:text-white transition-colors"
                             title="Ver Wiki"
                          >
                              <BookOpen size={16} className="drop-shadow-md"/>
                          </a>
                      ) : (
                          <BookOpen size={16} className="text-zinc-400 hover:text-white cursor-help drop-shadow-md"/>
                      )}
                      {char.lore && (
                          <div className="absolute left-0 top-6 w-56 bg-zinc-950 border border-zinc-700 p-3 rounded text-xs text-zinc-300 shadow-xl opacity-0 group-hover/lore:opacity-100 pointer-events-none transition-opacity font-lato leading-relaxed z-50">{char.lore}</div>
                      )}
                  </div>
              )}

              {/* --- TEXTO (Sobrepuesto abajo) --- */}
              <div className="absolute bottom-0 left-0 w-full p-4 z-10 bg-gradient-to-t from-black/90 to-transparent pt-8 rounded-b-xl">
                  <h3 className={`font-cinzel font-bold text-lg leading-tight text-white drop-shadow-md ${char.isNonCanon ? 'italic text-amber-200' : ''}`}>{char.name}</h3>
                  <p className="text-xs text-zinc-400 italic font-lato whitespace-pre-wrap leading-tight">{char.title}</p>
                  {(char.birthYear || char.deathYear) && <div className="text-[10px] text-zinc-500 mt-1 font-mono">{char.birthYear || '?'} - {char.deathYear || '?'}</div>}
              </div>

              {/* --- LINK A OTRA CASA (Top Right - Debajo de los 3 puntos) --- */}
              {targetHouseName && (
                  <button
                      onClick={(e) => { e.stopPropagation(); onNavigate(char); }}
                      className="absolute top-10 right-2 z-30 p-1.5 bg-black/60 hover:bg-zinc-800 rounded-full text-zinc-400 border border-zinc-700/50 transition-colors pointer-events-auto no-drag"
                      title={`Ver casa: ${targetHouseName}`}
                  >
                      <LogOut size={12} />
                  </button>
              )}

              {/* --- BOTÓN MENÚ (Top Right) --- */}
              <button className="absolute top-2 right-2 p-1.5 z-30 text-zinc-400 hover:text-white bg-black/60 hover:bg-black/90 rounded-full border border-zinc-700 transition-colors shadow-xl cursor-pointer pointer-events-auto no-drag" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === char.id ? null : char.id); }}><MoreVertical size={16} /></button>
          </>
      )}

      {activeMenu === char.id && (
          <div className="absolute top-8 right-2 mt-1 bg-zinc-950 border border-zinc-700 rounded-lg w-40 z-[100] text-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-100 origin-top-right pointer-events-auto" onMouseDown={e => e.stopPropagation()}>
              {!char.isGap && (
                  <>
                      <button onClick={() => onOpenModal('edit', char.id)} className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"><Edit2 size={12}/> Editar</button>
                      <div className="h-px bg-zinc-800"/>
                      <button onClick={() => onOpenModal('add-child', char.id)} className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"><Plus size={12}/> Hijo</button>
                      <button onClick={() => onOpenModal('add-parent', char.id)} className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"><UserPlus size={12}/> Padre</button>
                      <button onClick={() => onOpenModal('add-partner', char.id)} className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"><HeartPulse size={12}/> Pareja</button>
                      <div className="h-px bg-zinc-800"/>
                  </>
              )}
              <button onClick={() => onDelete(char.id)} className="w-full text-left px-3 py-2 hover:bg-red-900/30 text-red-400 flex items-center gap-2"><Trash2 size={12}/> {char.isGap ? "Eliminar Gap" : "Eliminar"}</button>
          </div>
      )}
    </div>
  );
};

export default memo(CharacterNode);
