import React, { useState, useEffect } from 'react';
import { Plus, Palette, Info, Search } from 'lucide-react';
import Modal from './Modal';
import { Character, CharacterStatus, HouseData, ThemeConfig } from '../types';
import { COLOR_THEMES } from '../constants/theme';

interface CharacterFormState {
  name: string; title: string; house: string; isKing: boolean; isBastard: boolean; isNonCanon: boolean; isDragonRider: boolean; isDisputed?: boolean; dragonName: string; isGap: boolean; imageUrl: string; wikiLink: string;
  birthYear: string; deathYear: string; lore: string; status: CharacterStatus | string;
  newHouseName: string; newHouseColor: string; newHouseCustomColor: string;
  artistName?: string; // New field
  artistLink?: string; // New field
}

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add-child' | 'add-parent' | 'add-partner' | 'edit' | 'add-root' | null;
  themeConfig: ThemeConfig;
  formData: CharacterFormState;
  setFormData: (data: CharacterFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLinkingExisting: boolean;
  setIsLinkingExisting: (value: boolean) => void;
  linkCharId: string;
  setLinkCharId: (id: string) => void;
  allCharacters: Character[];
  datasets: Record<string, HouseData>;
  selectedCharId: string | null;
  onUnlink?: (targetId: string, role: 'parent' | 'child' | 'partner') => void;
}

const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  mode,
  themeConfig,
  formData,
  setFormData,
  onSubmit,
  isLinkingExisting,
  setIsLinkingExisting,
  linkCharId,
  setLinkCharId,
  allCharacters,
  datasets,
  selectedCharId,
  onUnlink
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Reset search query when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
        setSearchQuery('');
    }
  }, [isOpen, mode, isLinkingExisting]);

  // Filter characters based on search query
  const filteredCharacters = React.useMemo(() => {
      // Guard against potential undefined allCharacters if that ever happens (though typing says it's array)
      if (!allCharacters) return [];

      let chars = allCharacters.filter(c => c.id !== selectedCharId);
      if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          chars = chars.filter(c =>
              c.name.toLowerCase().includes(query) ||
              (c.title && c.title.toLowerCase().includes(query))
          );
      }
      return chars;
  }, [allCharacters, selectedCharId, searchQuery]);

  // Compute relationships for "edit" mode
  const relationships = React.useMemo(() => {
    if (mode !== 'edit' || !selectedCharId) return null;

    const rels = {
      parents: [] as Character[],
      partners: [] as Character[],
      children: [] as Character[]
    };

    // Iterate through all houses to find connections involving this character
    Object.values(datasets).forEach(house => {
      house.connections.forEach(conn => {
        const isParent = conn.parents.includes(selectedCharId);
        const isChild = conn.children.includes(selectedCharId);

        if (isParent) {
           // As a parent, my partners are the other parents
           conn.parents.forEach(pId => {
             if (pId !== selectedCharId) {
               const p = allCharacters.find(c => c.id === pId);
               if (p && !rels.partners.some(x => x.id === p.id)) rels.partners.push(p);
             }
           });
           // As a parent, my children are in conn.children
           conn.children.forEach(cId => {
             const c = allCharacters.find(ch => ch.id === cId);
             if (c && !rels.children.some(x => x.id === c.id)) rels.children.push(c);
           });
        }

        if (isChild) {
           // As a child, my parents are in conn.parents
           conn.parents.forEach(pId => {
             const p = allCharacters.find(c => c.id === pId);
             if (p && !rels.parents.some(x => x.id === p.id)) rels.parents.push(p);
           });
        }
      });
    });

    return rels;
  }, [mode, selectedCharId, datasets, allCharacters]);

  if (!mode) return null;

  return (
      <Modal isOpen={isOpen} onClose={onClose} title="Personaje" accentClass={themeConfig.accentColor}>
         <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <input type="text" placeholder="Nombre" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required={!isLinkingExisting} />
            <input type="text" placeholder="Título" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <input type="url" placeholder="URL Imagen" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
            <div className="flex gap-2">
                <input type="text" placeholder="Nombre del Ilustrador" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white flex-1" value={formData.artistName || ''} onChange={e => setFormData({...formData, artistName: e.target.value})} />
                <input type="url" placeholder="Link del Ilustrador" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white flex-1" value={formData.artistLink || ''} onChange={e => setFormData({...formData, artistLink: e.target.value})} />
            </div>
            <input type="url" placeholder="URL Wiki (Lore)" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={formData.wikiLink} onChange={e => setFormData({...formData, wikiLink: e.target.value})} />
            <div className="flex gap-2">
                <input type="text" placeholder="Nacimiento" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white flex-1" value={formData.birthYear} onChange={e => setFormData({...formData, birthYear: e.target.value})} />
                <input type="text" placeholder="Muerte" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white flex-1" value={formData.deathYear} onChange={e => setFormData({...formData, deathYear: e.target.value})} />
            </div>
            <textarea placeholder="Lore..." className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white h-20" value={formData.lore} onChange={e => setFormData({...formData, lore: e.target.value})} />
            <div className="flex gap-4 items-center">
                <select className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white flex-1" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="alive">Vivo</option>
                    <option value="dead">Muerto</option>
                    <option value="missing">Desaparecido</option>
                    <option value="unknown">Desconocido</option>
                </select>
                <div className="flex-1">
                    <select className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white outline-none capitalize font-cinzel" value={formData.house} onChange={e => setFormData({...formData, house: e.target.value})}>
                      {Object.values(datasets).map(h => (<option key={h.id} value={h.id}>{h.theme.name}</option>))}
                      <option value="other">Otra/Desconocida</option>
                      <option value="CREATE_NEW" className="font-bold text-emerald-400">+ Crear Nueva Casa...</option>
                    </select>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={formData.isKing} onChange={e => setFormData({...formData, isKing: e.target.checked})} /> <span className="text-xs">Monarca</span></label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={formData.isBastard} onChange={e => setFormData({...formData, isBastard: e.target.checked})} /> <span className="text-xs">Bastardo</span></label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={formData.isNonCanon} onChange={e => setFormData({...formData, isNonCanon: e.target.checked})} /> <span className="text-xs">No Canon</span></label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={formData.isDisputed} onChange={e => setFormData({...formData, isDisputed: e.target.checked})} /> <span className="text-xs">Paternidad Disputada</span></label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={formData.isDragonRider} onChange={e => setFormData({...formData, isDragonRider: e.target.checked})} /> <span className="text-xs">Jinete Dragón</span></label>
                {formData.isDragonRider && (
                    <input
                        type="text"
                        placeholder="Nombre del Dragón"
                        className="bg-zinc-900 border border-zinc-700 rounded p-1 text-xs text-white w-32"
                        value={formData.dragonName}
                        onChange={e => setFormData({...formData, dragonName: e.target.value})}
                    />
                )}
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={formData.isGap} onChange={e => setFormData({...formData, isGap: e.target.checked})} /> <span className="text-xs">Gap</span></label>
            </div>
            {formData.house === 'CREATE_NEW' && (
                <div className="p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-lg animate-in fade-in slide-in-from-top-2">
                     <h4 className="text-xs font-bold text-emerald-400 mb-3 flex items-center gap-2 uppercase tracking-wide"><Plus size={12}/> Fundar Casa (Rápido)</h4>
                     <div className="flex flex-col gap-3">
                        <div><label className="block text-[10px] text-zinc-400 mb-1 uppercase font-bold">Nombre</label><input type="text" required className="w-full bg-black/50 border border-emerald-900 rounded p-2 text-xs text-white placeholder-emerald-900/50" value={formData.newHouseName} onChange={e => setFormData({...formData, newHouseName: e.target.value})} placeholder="Ej. Casa Martell"/></div>
                        <div><label className="block text-[10px] text-zinc-400 mb-1 uppercase font-bold">Color</label><div className="flex gap-2 items-center">{Object.keys(COLOR_THEMES).slice(0, 5).map(color => (<button key={color} type="button" onClick={() => setFormData({...formData, newHouseColor: color, newHouseCustomColor: ''})} className={`w-6 h-6 rounded-full border-2 transition-all ${formData.newHouseColor === color && !formData.newHouseCustomColor ? 'border-white scale-110' : 'border-transparent opacity-50'}`} style={{ backgroundColor: color === 'gold' ? '#ca8a04' : color }}/>))}<div className="relative ml-2"><button type="button" className={`w-6 h-6 rounded-full border-2 flex items-center justify-center bg-zinc-800 transition-all ${formData.newHouseCustomColor ? 'border-white scale-110 shadow-lg' : 'border-zinc-600 opacity-60'}`} title="Color Personalizado"><Palette size={10} color={formData.newHouseCustomColor || 'white'} /></button><input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={e => setFormData({...formData, newHouseCustomColor: e.target.value})}/></div></div></div>
                     </div>
                  </div>
            )}

            {!isLinkingExisting ? (
                <div className="flex bg-zinc-900 p-2 rounded h-10 overflow-y-auto justify-center items-center text-zinc-500 text-sm">
                   <Info size={14} className="mr-2"/> Usa "Vincular" para conectar
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar personaje..."
                            className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 pl-8 text-white text-sm focus:border-emerald-500/50 outline-none transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    </div>
                    <div className="bg-zinc-900 p-2 rounded h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                        {filteredCharacters.length === 0 ? (
                            <div className="text-zinc-500 text-xs text-center py-4">
                                No se encontraron personajes
                            </div>
                        ) : (
                            filteredCharacters.map(c => {
                                const charHouse = datasets[c.house || '']?.theme;
                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => setLinkCharId(c.id)}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${linkCharId === c.id ? 'bg-zinc-800 border-emerald-500/50 shadow-md' : 'border-transparent hover:bg-zinc-800 hover:border-zinc-700'}`}
                                    >
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-black overflow-hidden border border-zinc-700 shrink-0 relative">
                                            {c.imageUrl ? (
                                                <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-600 font-cinzel font-bold text-xs">
                                                    {c.name.charAt(0)}
                                                </div>
                                            )}
                                            {charHouse?.customColor && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border border-black" style={{ backgroundColor: charHouse.customColor }} />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-bold font-cinzel truncate ${linkCharId === c.id ? 'text-emerald-400' : 'text-zinc-200'}`}>
                                                    {c.name}
                                                </span>
                                                {charHouse && <span className="text-[10px] uppercase text-zinc-500 tracking-wider ml-2 shrink-0">{charHouse.name}</span>}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-zinc-400 font-lato">
                                                {c.title && <span className="truncate italic max-w-[120px]">{c.title}</span>}
                                                {(c.birthYear || c.deathYear) && (
                                                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-1.5 rounded">
                                                        {c.birthYear || '?'} - {c.deathYear || '?'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {['add-child', 'add-parent', 'add-partner'].includes(mode) && (
                 <div className="flex bg-zinc-950 p-1 rounded-lg mb-2 border border-zinc-800">
                    <button type="button" onClick={(e) => { e.preventDefault(); setIsLinkingExisting(false); }} className={`flex-1 text-xs py-1.5 rounded-md ${!isLinkingExisting ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Crear Nuevo</button>
                    <button type="button" onClick={(e) => { e.preventDefault(); setIsLinkingExisting(true); }} className={`flex-1 text-xs py-1.5 rounded-md ${isLinkingExisting ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Vincular Existente</button>
                 </div>
            )}

            {mode === 'edit' && relationships && onUnlink && (
              <div className="mt-4 border-t border-zinc-800 pt-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3">Relaciones</h4>
                <div className="flex flex-col gap-4">
                   {/* PARENTS */}
                   {relationships.parents.length > 0 && (
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold block mb-1">PADRES</span>
                        <div className="flex flex-wrap gap-2">
                           {relationships.parents.map(p => (
                             <div key={p.id} className="flex items-center gap-2 bg-zinc-800 px-2 py-1 rounded border border-zinc-700">
                                <span className="text-xs text-zinc-200">{p.name}</span>
                                <button type="button" onClick={() => onUnlink(p.id, 'parent')} className="text-zinc-500 hover:text-red-400 transition-colors">x</button>
                             </div>
                           ))}
                        </div>
                      </div>
                   )}
                   {/* PARTNERS */}
                   {relationships.partners.length > 0 && (
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold block mb-1">PAREJAS</span>
                        <div className="flex flex-wrap gap-2">
                           {relationships.partners.map(p => (
                             <div key={p.id} className="flex items-center gap-2 bg-zinc-800 px-2 py-1 rounded border border-zinc-700">
                                <span className="text-xs text-zinc-200">{p.name}</span>
                                <button type="button" onClick={() => onUnlink(p.id, 'partner')} className="text-zinc-500 hover:text-red-400 transition-colors">x</button>
                             </div>
                           ))}
                        </div>
                      </div>
                   )}
                   {/* CHILDREN */}
                   {relationships.children.length > 0 && (
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold block mb-1">HIJOS</span>
                        <div className="flex flex-wrap gap-2">
                           {relationships.children.map(p => (
                             <div key={p.id} className="flex items-center gap-2 bg-zinc-800 px-2 py-1 rounded border border-zinc-700">
                                <span className="text-xs text-zinc-200">{p.name}</span>
                                <button type="button" onClick={() => onUnlink(p.id, 'child')} className="text-zinc-500 hover:text-red-400 transition-colors">x</button>
                             </div>
                           ))}
                        </div>
                      </div>
                   )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4"><button type="submit" className="bg-white text-black px-4 py-2 rounded font-bold">Guardar</button></div>
         </form>
      </Modal>
  );
};

export default CharacterModal;
