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
  sigilDescription?: string; // Nuevo campo
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
  onSubmit: handleFormSubmit // Renombrado para claridad interna
}) => {
  // Wrapper para manejar el evento onSubmit correctamente
  const onSubmitWrapper = (e: React.FormEvent) => {
    e.preventDefault();
    handleFormSubmit(e);
  };

  return (
      <Modal isOpen={isOpen} onClose={onClose} title={mode === 'create-house' ? "Nueva Casa" : "Editar Casa"} accentClass={themeConfig.accentColor}>
         <form onSubmit={onSubmitWrapper} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Nombre Casa"
              className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Fundador"
                className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                value={formData.founder}
                onChange={e => setFormData({...formData, founder: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Asentamiento"
                className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                value={formData.seat}
                onChange={e => setFormData({...formData, seat: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="URL Escudo"
                  className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                  value={formData.sigilUrl}
                  onChange={e => setFormData({...formData, sigilUrl: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Descripción del Escudo"
                  className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                  value={formData.sigilDescription || ''}
                  onChange={e => setFormData({...formData, sigilDescription: e.target.value})}
                  title="Aparecerá al pasar el mouse por el escudo"
                />
            </div>

            <textarea
              placeholder="Historia..."
              className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white h-20 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
              value={formData.history}
              onChange={e => setFormData({...formData, history: e.target.value})}
            />

            <input
              type="text"
              placeholder="Lema"
              className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              value={formData.motto}
              onChange={e => setFormData({...formData, motto: e.target.value})}
            />

            <div className="flex flex-wrap gap-3 items-center pt-2">
                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider mr-2">Color Tema:</span>
                {Object.keys(COLOR_THEMES).map(colorKey => (
                  <button
                    key={colorKey}
                    type="button"
                    onClick={() => setFormData({...formData, color: colorKey, customColor: ''})}
                    className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${formData.color === colorKey && !formData.customColor ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    style={{ backgroundColor: COLOR_THEMES[colorKey].accentColor || colorKey }}
                    title={colorKey}
                  />
                ))}
                <div className="relative group ml-2">
                  <input
                    type="color"
                    className="w-8 h-8 cursor-pointer rounded-full border-0 p-0 opacity-0 absolute inset-0"
                    value={formData.customColor || '#ff0000'}
                    onChange={e => setFormData({...formData, customColor: e.target.value})}
                  />
                  <div
                    className={`w-6 h-6 rounded-full border-2 transition-all ${formData.customColor ? 'border-white scale-110' : 'border-zinc-700'}`}
                    style={{ backgroundColor: formData.customColor || 'transparent', background: !formData.customColor ? 'linear-gradient(45deg, #f00, #00f)' : undefined }}
                  />
                </div>
            </div>

            <div className="flex items-center gap-2 mt-2 pt-4 border-t border-zinc-800/50">
               <label className="flex items-center gap-2 cursor-pointer group select-none hover:bg-zinc-800/30 p-2 rounded transition-colors w-full">
                  <input
                    type="checkbox"
                    className="accent-zinc-500 w-4 h-4 rounded-sm"
                    checked={formData.isExtinct || false}
                    onChange={e => setFormData({...formData, isExtinct: e.target.checked})}
                  />
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors font-bold uppercase tracking-wider flex items-center gap-2">
                    <ShieldOff size={14}/> Casa Extinta / Antigua
                  </span>
               </label>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="bg-white hover:bg-zinc-200 text-black px-6 py-2 rounded font-bold font-cinzel transition-colors shadow-lg shadow-white/10"
              >
                Guardar
              </button>
            </div>
         </form>
      </Modal>
  );
};

export default HouseModal;
