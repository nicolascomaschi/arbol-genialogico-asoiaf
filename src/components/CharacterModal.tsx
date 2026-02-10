import React from 'react';
import { Plus, Palette, Info } from 'lucide-react';
import Modal from './Modal';
import { Character, CharacterStatus, HouseData, ThemeConfig } from '../types';
import { COLOR_THEMES } from '../constants/theme';

interface CharacterFormState {
  name: string; title: string; house: string; isKing: boolean; isBastard: boolean; isNonCanon: boolean; isDragonRider: boolean; dragonName: string; isGap: boolean; imageUrl: string;
  birthYear: string; deathYear: string; lore: string; status: CharacterStatus | string;
  newHouseName: string; newHouseColor: string; newHouseCustomColor: string;
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
  selectedCharId
}) => {
  if (!mode) return null;

  return (
      <Modal isOpen={isOpen} onClose={onClose} title="Personaje" accentClass={themeConfig.accentColor}>
         <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <input type="text" placeholder="Nombre" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required={!isLinkingExisting} />
            <input type="text" placeholder="Título" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <input type="url" placeholder="URL Imagen" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
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
                <div className="bg-zinc-900 p-2 rounded h-40 overflow-y-auto">
                    {allCharacters.filter(c => c.id !== selectedCharId).map(c => (
                        <div key={c.id} onClick={() => setLinkCharId(c.id)} className={`p-2 cursor-pointer hover:bg-zinc-800 ${linkCharId === c.id ? 'bg-zinc-700' : ''}`}>
                            {c.name}
                        </div>
                    ))}
                </div>
            )}

            {['add-child', 'add-parent', 'add-partner'].includes(mode) && (
                 <div className="flex bg-zinc-950 p-1 rounded-lg mb-2 border border-zinc-800">
                    <button type="button" onClick={(e) => { e.preventDefault(); setIsLinkingExisting(false); }} className={`flex-1 text-xs py-1.5 rounded-md ${!isLinkingExisting ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Crear Nuevo</button>
                    <button type="button" onClick={(e) => { e.preventDefault(); setIsLinkingExisting(true); }} className={`flex-1 text-xs py-1.5 rounded-md ${isLinkingExisting ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Vincular Existente</button>
                 </div>
            )}

            <div className="flex justify-end pt-4"><button type="submit" className="bg-white text-black px-4 py-2 rounded font-bold">Guardar</button></div>
         </form>
      </Modal>
  );
};

export default CharacterModal;
