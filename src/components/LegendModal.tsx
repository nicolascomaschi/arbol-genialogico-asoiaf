import React from 'react';
import {
  Crown, Flame, Ban, AlertTriangle, GitCommit, Skull,
  BookOpen, HelpCircle, Ghost, ShieldOff
} from 'lucide-react';
import Modal from './Modal';
import { ThemeConfig } from '../types';

interface LegendModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeConfig: ThemeConfig;
}

const LegendModal: React.FC<LegendModalProps> = ({ isOpen, onClose, themeConfig }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Simbología" accentClass={themeConfig.accentColor}>
         <div className="space-y-6">
            <div>
                <h4 className="text-sm font-cinzel font-bold text-zinc-400 mb-3 border-b border-zinc-800 pb-1">Iconos de Personaje</h4>
                <div className="grid grid-cols-2 gap-3 text-xs text-zinc-300">
                    <div className="flex items-center gap-2"><Crown size={14} className="text-yellow-500"/> <span>Monarca</span></div>
                    <div className="flex items-center gap-2"><Flame size={14} className="text-orange-500"/> <span>Jinete de Dragón</span></div>
                    <div className="flex items-center gap-2"><Ban size={14} className="text-zinc-400"/> <span>Bastardo</span></div>
                    <div className="flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500"/> <span>No Canon / Sin Confirmar</span></div>
                    <div className="flex items-center gap-2"><GitCommit size={14} className="text-zinc-500"/> <span>Nexo Perdido</span></div>
                    <div className="flex items-center gap-2"><Skull size={14} className="text-zinc-500"/> <span>Fallecido</span></div>
                    <div className="flex items-center gap-2"><BookOpen size={14} className="text-zinc-400"/> <span>Tiene Historia</span></div>
                    <div className="flex items-center gap-2"><HelpCircle size={14} className="text-amber-500"/> <span>Desaparecido</span></div>
                    <div className="flex items-center gap-2"><Ghost size={14} className="text-purple-500"/> <span>Desconocido</span></div>
                </div>
            </div>
            <div>
                <h4 className="text-sm font-cinzel font-bold text-zinc-400 mb-3 border-b border-zinc-800 pb-1">Líneas de Sangre</h4>
                <div className="space-y-3 text-xs text-zinc-300">
                    <div className="flex items-center gap-3"><div className="w-12 h-0.5 bg-zinc-500"></div><span>Descendencia Legítima</span></div>
                    <div className="flex items-center gap-3"><div className="w-12 h-0.5 border-t-2 border-dashed border-zinc-500"></div><span>Descendencia Bastarda</span></div>
                    <div className="flex items-center gap-3"><div className="w-12 h-0.5 border-t-2 border-dotted border-zinc-500"></div><span>Pareja / Matrimonio</span></div>
                </div>
            </div>
            <div>
                <h4 className="text-sm font-cinzel font-bold text-zinc-400 mb-3 border-b border-zinc-800 pb-1">Estados de Casa</h4>
                <div className="space-y-3 text-xs text-zinc-300">
                    <div className="flex items-center gap-3"><ShieldOff size={14} className="text-zinc-400"/> <span>Casa Extinta / Arruinada</span></div>
                </div>
            </div>
         </div>
      </Modal>
  );
};

export default LegendModal;
