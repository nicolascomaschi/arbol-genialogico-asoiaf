import React from 'react';
import { ShieldOff } from 'lucide-react';
import Modal from './Modal';
import { ThemeConfig } from '../types';
import { COLOR_THEMES } from '../constants/theme';

interface HouseFormState {
  name: string;
  color: string;
  customColor: string;
  founder: string;
  sigilUrl: string;
  motto: string;
  isExtinct: boolean;
  seat: string;
  history: string;
}

interface HouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create-house' | 'edit-house';
  themeConfig: ThemeConfig;
  formData: HouseFormState;
  setFormData: (data: HouseFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const HouseModal: React.FC<HouseModalProps> = ({
  isOpen,
  onClose,
  mode,
  themeConfig,
  formData,
  setFormData,
  onSubmit
}) => {
  return (
      <Modal isOpen={isOpen} onClose={onClose} title={mode === 'create-house' ? "Nueva Casa" : "Editar Casa"} accentClass={themeConfig.accentColor}>
         <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <input type="text" placeholder="Nombre Casa" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input type="text" placeholder="Fundador" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={formData.founder} onChange={e => setFormData({...formData, founder: e.target.value})} required />
            <div className="flex gap-2">
                <input type="text" placeholder="URL Escudo" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white flex-1" value={formData.sigilUrl} onChange={e => setFormData({...formData, sigilUrl: e.target.value})} />
                <input type="text" placeholder="Asentamiento" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white flex-1" value={formData.seat} onChange={e => setFormData({...formData, seat: e.target.value})} />
            </div>
            <textarea placeholder="Historia..." className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white h-20" value={formData.history} onChange={e => setFormData({...formData, history: e.target.value})} />
            <input type="text" placeholder="Lema" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={formData.motto} onChange={e => setFormData({...formData, motto: e.target.value})} />

            <div className="flex flex-wrap gap-2">
                {Object.keys(COLOR_THEMES).map(colorKey => (
                  <button key={colorKey} type="button" onClick={() => setFormData({...formData, color: colorKey, customColor: ''})} className={`w-6 h-6 rounded-full border-2 transition-all ${formData.color === colorKey && !formData.customColor ? 'border-white scale-110' : 'border-transparent opacity-50'}`} style={{ backgroundColor: colorKey === 'gold' ? '#ca8a04' : colorKey }} />
                ))}
                <input type="color" className="w-8 h-8 cursor-pointer rounded-full border-0 p-0" value={formData.customColor || '#ff0000'} onChange={e => setFormData({...formData, customColor: e.target.value})}/>
            </div>

            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-800/50">
               <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <input type="checkbox" className="accent-zinc-500 w-4 h-4 rounded-sm" checked={formData.isExtinct || false} onChange={e => setFormData({...formData, isExtinct: e.target.checked})}/>
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors font-bold uppercase tracking-wider flex items-center gap-1"><ShieldOff size={12}/> Casa Extinta / Antigua</span>
               </label>
            </div>

            <div className="flex justify-end pt-4"><button type="submit" className="bg-white text-black px-4 py-2 rounded font-bold">Guardar</button></div>
         </form>
      </Modal>
  );
};

export default HouseModal;
