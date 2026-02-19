import React, { useState } from 'react';
import { Trash2, Calendar, Type, Palette } from 'lucide-react';
import Modal from './Modal';
import { TimelineEvent, ThemeConfig } from '../types';

interface TimelineEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeConfig: ThemeConfig;
  events: TimelineEvent[];
  onSaveEvent: (event: TimelineEvent) => void;
  onDeleteEvent: (id: string) => void;
}

const TimelineEventModal: React.FC<TimelineEventModalProps> = ({
  isOpen,
  onClose,
  themeConfig,
  events,
  onSaveEvent,
  onDeleteEvent
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<TimelineEvent, 'id'>>({
    title: '',
    startYear: 0,
    endYear: 0,
    color: 'red',
    description: ''
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({ title: '', startYear: 0, endYear: 0, color: 'red', description: '' });
  };

  const handleEdit = (evt: TimelineEvent) => {
    setEditingId(evt.id);
    setFormData({
        title: evt.title,
        startYear: evt.startYear,
        endYear: evt.endYear,
        color: evt.color,
        description: evt.description || ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingId || `evt_${Date.now()}`;
    onSaveEvent({ ...formData, id });
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestión de Eras" accentClass={themeConfig.accentColor}>
      <div className="flex flex-col gap-6">

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex flex-col gap-3">
            <h4 className="text-sm font-cinzel font-bold text-zinc-400 flex items-center gap-2">
                {editingId ? 'Editar Evento' : 'Nueva Era / Evento'}
            </h4>

            <div className="flex gap-2">
                <div className="flex-1">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Nombre del Evento"
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 pl-8 text-white text-sm focus:border-zinc-500 outline-none"
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            required
                        />
                        <Type size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="number"
                        placeholder="Inicio"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 pl-8 text-white text-sm focus:border-zinc-500 outline-none"
                        value={formData.startYear}
                        onChange={e => setFormData({...formData, startYear: parseInt(e.target.value) || 0})}
                        required
                    />
                    <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                </div>
                <div className="relative flex-1">
                    <input
                        type="number"
                        placeholder="Fin"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 pl-8 text-white text-sm focus:border-zinc-500 outline-none"
                        value={formData.endYear}
                        onChange={e => setFormData({...formData, endYear: parseInt(e.target.value) || 0})}
                        required
                    />
                    <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                </div>
            </div>

            <div className="flex gap-2 items-center">
                <span className="text-xs text-zinc-500 font-bold uppercase mr-2"><Palette size={12} className="inline mr-1"/> Color</span>
                {['red', 'gold', 'blue', 'green', 'zinc'].map(c => (
                    <button
                        key={c}
                        type="button"
                        onClick={() => setFormData({...formData, color: c})}
                        className={`w-5 h-5 rounded-full border transition-all ${formData.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        style={{ backgroundColor: c === 'zinc' ? '#52525b' : (c === 'gold' ? '#eab308' : c) }}
                    />
                ))}
            </div>

            <textarea
                placeholder="Descripción (opcional)..."
                className="bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-xs h-16 resize-none focus:border-zinc-500 outline-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
            />

            <div className="flex justify-end gap-2 mt-2">
                {editingId && (
                    <button type="button" onClick={resetForm} className="px-3 py-1 text-xs text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                )}
                <button type="submit" className="bg-white text-black px-4 py-1.5 rounded text-sm font-bold hover:bg-zinc-200 transition-colors">
                    {editingId ? 'Actualizar' : 'Crear'}
                </button>
            </div>
        </form>

        {/* Lista de Eventos */}
        <div className="flex-1 overflow-hidden flex flex-col">
            <h4 className="text-xs font-cinzel font-bold text-zinc-500 uppercase mb-2">Eventos Existentes ({events.length})</h4>
            <div className="overflow-y-auto custom-scrollbar flex flex-col gap-2 max-h-[300px]">
                {events.length === 0 ? (
                    <div className="text-center py-8 text-zinc-600 text-xs italic">No hay eventos registrados</div>
                ) : (
                    events.map(evt => (
                        <div key={evt.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-center justify-between group hover:border-zinc-700 transition-colors">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: evt.color === 'zinc' ? '#52525b' : (evt.color === 'gold' ? '#eab308' : evt.color) }} />
                                    <span className="font-bold text-zinc-200 text-sm">{evt.title}</span>
                                </div>
                                <span className="text-xs text-zinc-500 font-mono ml-4">{evt.startYear} - {evt.endYear} AC</span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(evt)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white" title="Editar"><Type size={12}/></button>
                                <button onClick={() => onDeleteEvent(evt.id)} className="p-1.5 hover:bg-red-900/30 rounded text-zinc-500 hover:text-red-400" title="Eliminar"><Trash2 size={12}/></button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
    </Modal>
  );
};

export default TimelineEventModal;
