import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MousePointer2, ZoomIn, ZoomOut, Move, ExternalLink, Info, Plus, Trash2, Edit2, MoreVertical, X, Save, UserPlus, User, Image as ImageIcon, Shield, Library, ScrollText, Link as LinkIcon, LogOut, Palette, Cloud, Loader2, Crown, Ban, Search, Calendar, BookOpen, Skull, HelpCircle, Ghost, HeartPulse, Map, AlertTriangle, ShieldOff, Castle, Feather, GitCommit } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

/**
 * ESTE ES EL PUNTO DE PARTIDA ESTABLE
 * Contiene:
 * - Persistencia en Firebase
 * - Diseño de Tarjetas Clásico (Avatar Circular)
 * - Gestión completa de Casas (Crear, Editar, Extintas, Historia, Asentamiento)
 * - Gestión completa de Personajes (Relaciones, Estados, Lore, Bastardos, No Canon)
 * - Navegación (Zoom, Pan, Arrastrar Nodos)
 * - Buscador Global
 */

// --- FIREBASE SETUP ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- CONFIGURACIÓN Y TIPOS ---

const WIKI_BASE_URL = "https://hieloyfuego.fandom.com/wiki/";
const CARD_WIDTH = 240; 
const CARD_HEIGHT = 160; 
const GAP_NODE_SIZE = 60;
const X_SPACING = 280;
const Y_SPACING = 240; 
const CANVAS_SIZE = 8000;

type CharacterStatus = 'alive' | 'dead' | 'missing' | 'unknown';

type Character = {
  id: string;
  name: string;
  title: string;
  wikiSlug: string;
  imageUrl?: string;
  generation: number;
  x: number;
  isKing?: boolean;
  isBastard?: boolean;
  isNonCanon?: boolean;
  isGap?: boolean;
  house?: string;
  birthYear?: string;
  deathYear?: string;
  lore?: string;
  status?: CharacterStatus;
};

type Connection = {
  id: string;
  parents: string[];
  children: string[];
};

type ThemeConfig = {
    bgGradient: string;
    accentColor: string;
    textColor: string;
    buttonBg: string;
    borderColor: string;
    glowColor: string;
};

type HouseData = {
  id: string;
  characters: Character[];
  connections: Connection[];
  rootId?: string;
  isExtinct?: boolean;
  theme: {
    name: string;
    config: ThemeConfig;
    sigilUrl?: string;
    motto?: string;
    customColor?: string;
    seat?: string;
    history?: string;
  };
};

// --- PRESETS DE TEMAS ---

const COLOR_THEMES: Record<string, ThemeConfig> = {
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

// --- DATOS INICIALES ---

const INITIAL_DATASETS: Record<string, HouseData> = {
  targaryen: {
    id: 'targaryen',
    characters: [
        { id: 'aegon1', name: 'Aegon I', title: 'El Conquistador', wikiSlug: 'Aegon_I_Targaryen', generation: 1, x: 0.5, isKing: true, house: 'targaryen', birthYear: '27 BC', deathYear: '37 AC', status: 'dead', lore: 'Conquistó Poniente montado en Balerion el Terror Negro.' },
        { id: 'visenya', name: 'Visenya', title: 'Reina', wikiSlug: 'Visenya_Targaryen', generation: 1, x: -1, house: 'targaryen', birthYear: '29 BC', deathYear: '44 AC', status: 'dead' },
        { id: 'rhaenys', name: 'Rhaenys', title: 'Reina', wikiSlug: 'Rhaenys_Targaryen', generation: 1, x: 2, house: 'targaryen', birthYear: '26 BC', deathYear: '10 AC', status: 'dead' },
        { id: 'aenys1', name: 'Aenys I', title: 'Rey', wikiSlug: 'Aenys_I_Targaryen', generation: 2, x: 2, isKing: true, house: 'targaryen', birthYear: '07 AC', deathYear: '42 AC', status: 'dead' },
        { id: 'maegor1', name: 'Maegor I', title: 'El Cruel', wikiSlug: 'Maegor_I_Targaryen', generation: 2, x: -1, isKing: true, house: 'targaryen', birthYear: '12 AC', deathYear: '48 AC', status: 'dead' },
        { id: 'jaehaerys1', name: 'Jaehaerys I', title: 'El Conciliador', wikiSlug: 'Jaehaerys_I_Targaryen', generation: 3, x: 2, isKing: true, house: 'targaryen', birthYear: '34 AC', deathYear: '103 AC', status: 'dead' },
        { id: 'alysanne', name: 'Alysanne', title: 'La Bondadosa', wikiSlug: 'Alysanne_Targaryen', generation: 3, x: 3, house: 'targaryen', birthYear: '36 AC', deathYear: '100 AC', status: 'dead' },
    ],
    connections: [
        { id: 'c1', parents: ['visenya', 'aegon1', 'rhaenys'], children: [] }, 
        { id: 'c2', parents: ['aegon1', 'rhaenys'], children: ['aenys1'] },
        { id: 'c3', parents: ['aegon1', 'visenya'], children: ['maegor1'] },
        { id: 'c4', parents: ['aenys1'], children: ['jaehaerys1', 'alysanne'] },
    ],
    rootId: 'aegon1',
    theme: { 
        name: 'Casa Targaryen', 
        config: COLOR_THEMES.red, 
        motto: 'Fuego y Sangre',
        seat: 'Fortaleza Roja / Rocadragón',
        history: 'La Casa Targaryen es una casa noble de ascendencia Valyria que reinó en los Siete Reinos durante casi trescientos años.'
    }
  },
  stark: {
    id: 'stark',
    characters: [
        { id: 'eddard', name: 'Eddard "Ned"', title: 'Mano del Rey', wikiSlug: 'Eddard_Stark', generation: 1, x: 0, house: 'stark', birthYear: '263 AC', deathYear: '298 AC', status: 'dead', lore: 'Señor de Invernalia, ejecutado por orden del Rey Joffrey.' },
        { id: 'catelyn', name: 'Catelyn Tully', title: 'Lady', wikiSlug: 'Catelyn_Tully', generation: 1, x: 1, house: 'tully', birthYear: '264 AC', deathYear: '299 AC', status: 'dead' },
        { id: 'robb', name: 'Robb', title: 'Rey en el Norte', wikiSlug: 'Robb_Stark', generation: 2, x: -2, isKing: true, house: 'stark', birthYear: '283 AC', deathYear: '299 AC', status: 'dead' },
        { id: 'sansa', name: 'Sansa', title: 'Reina en el Norte', wikiSlug: 'Sansa_Stark', generation: 2, x: -0.5, isKing: true, house: 'stark', birthYear: '286 AC', status: 'alive' },
        { id: 'arya', name: 'Arya', title: 'Nadie', wikiSlug: 'Arya_Stark', generation: 2, x: 0.5, house: 'stark', birthYear: '289 AC', status: 'alive' },
        { id: 'bran', name: 'Bran', title: 'El Roto', wikiSlug: 'Bran_Stark', generation: 2, x: 1.5, isKing: true, house: 'stark', birthYear: '290 AC', status: 'alive' },
        { id: 'rickon', name: 'Rickon', title: 'Príncipe', wikiSlug: 'Rickon_Stark', generation: 2, x: 2.5, house: 'stark', birthYear: '295 AC', status: 'dead' },
        { id: 'jon', name: 'Jon Nieve', title: 'El Bastardo de Invernalia', wikiSlug: 'Jon_Snow', generation: 2, x: 3.5, house: 'stark', isBastard: true, birthYear: '283 AC', status: 'unknown' },
    ],
    connections: [
        { id: 's2', parents: ['eddard', 'catelyn'], children: ['robb', 'sansa', 'arya', 'bran', 'rickon'] },
        { id: 's3', parents: ['eddard'], children: ['jon'] }, 
    ],
    rootId: 'eddard',
    theme: { 
        name: 'Casa Stark', 
        config: COLOR_THEMES.blue, 
        motto: 'Se acerca el Invierno',
        seat: 'Invernalia',
        history: 'Una de las grandes casas de Poniente, gobernantes del Norte desde la Edad de los Héroes.'
    }
  },
  lannister: {
    id: 'lannister',
    characters: [
        { id: 'tywin', name: 'Tywin', title: 'Mano del Rey', wikiSlug: 'Tywin_Lannister', generation: 1, x: -1, house: 'lannister', birthYear: '242 AC', deathYear: '300 AC', status: 'dead' },
        { id: 'joanna', name: 'Joanna', title: 'Lady', wikiSlug: 'Joanna_Lannister', generation: 1, x: 0, house: 'lannister', birthYear: '246 AC', deathYear: '273 AC', status: 'dead' },
        { id: 'cersei', name: 'Cersei', title: 'Reina', wikiSlug: 'Cersei_Lannister', generation: 2, x: -2, isKing: true, house: 'lannister', birthYear: '266 AC', status: 'alive' },
        { id: 'jaime', name: 'Jaime', title: 'Matarreyes', wikiSlug: 'Jaime_Lannister', generation: 2, x: -1, house: 'lannister', birthYear: '266 AC', status: 'alive' },
        { id: 'tyrion', name: 'Tyrion', title: 'El Gnomo', wikiSlug: 'Tyrion_Lannister', generation: 2, x: 0, house: 'lannister', birthYear: '273 AC', status: 'alive' },
        { id: 'joffrey', name: 'Joffrey', title: 'Rey', wikiSlug: 'Joffrey_Baratheon', generation: 3, x: -2.5, isKing: true, house: 'baratheon', isBastard: true, birthYear: '286 AC', deathYear: '300 AC', status: 'dead' },
    ],
    connections: [
        { id: 'l2', parents: ['tywin', 'joanna'], children: ['cersei', 'jaime', 'tyrion'] },
        { id: 'l3', parents: ['cersei', 'jaime'], children: ['joffrey'] }, 
    ],
    rootId: 'tywin',
    theme: { 
        name: 'Casa Lannister', 
        config: COLOR_THEMES.gold, 
        motto: '¡Oye mi Rugido!',
        seat: 'Roca Casterly',
        history: 'Principales señores de las Tierras del Oeste. Son la casa más rica de los Siete Reinos.'
    }
  },
  baratheon: {
    id: 'baratheon',
    characters: [
        { id: 'steffon', name: 'Steffon', title: 'Lord', wikiSlug: 'Steffon_Baratheon', generation: 1, x: 0, house: 'baratheon', birthYear: '246 AC', deathYear: '278 AC', status: 'dead' },
        { id: 'cassana', name: 'Cassana Estermont', title: 'Lady', wikiSlug: 'Cassana_Estermont', generation: 1, x: 1, house: 'estermont', status: 'dead' },
        { id: 'robert', name: 'Robert I', title: 'Rey', wikiSlug: 'Robert_Baratheon', generation: 2, x: -1.5, isKing: true, house: 'baratheon', birthYear: '262 AC', deathYear: '298 AC', status: 'dead' },
        { id: 'stannis', name: 'Stannis', title: 'Señor de Rocadragón', wikiSlug: 'Stannis_Baratheon', generation: 2, x: 0, house: 'baratheon', birthYear: '264 AC', status: 'alive' },
        { id: 'renly', name: 'Renly', title: 'Señor de Bastión de Tormentas', wikiSlug: 'Renly_Baratheon', generation: 2, x: 1.5, house: 'baratheon', birthYear: '277 AC', deathYear: '299 AC', status: 'dead' },
    ],
    connections: [
        { id: 'b1', parents: ['steffon', 'cassana'], children: ['robert', 'stannis', 'renly'] },
    ],
    rootId: 'steffon',
    theme: { 
        name: 'Casa Baratheon', 
        config: COLOR_THEMES.gold, 
        motto: 'Nuestra es la Furia',
        seat: 'Bastión de Tormentas',
        history: 'El linaje más joven de las grandes casas, nacido durante las Guerras de Conquista.'
    }
  },
  velaryon: {
    id: 'velaryon',
    characters: [
        { id: 'corlys', name: 'Corlys', title: 'La Serpiente Marina', wikiSlug: 'Corlys_Velaryon', generation: 1, x: 0, house: 'velaryon', birthYear: '53 AC', status: 'dead' },
        { id: 'rhaenys_t', name: 'Rhaenys Targaryen', title: 'La Reina que Nunca Fue', wikiSlug: 'Rhaenys_Targaryen', generation: 1, x: 1, house: 'targaryen', birthYear: '74 AC', deathYear: '129 AC', status: 'dead' },
        { id: 'laena', name: 'Laena', title: 'Lady', wikiSlug: 'Laena_Velaryon', generation: 2, x: -0.5, house: 'velaryon', birthYear: '92 AC', deathYear: '120 AC', status: 'dead' },
        { id: 'laenor', name: 'Laenor', title: 'Ser', wikiSlug: 'Laenor_Velaryon', generation: 2, x: 1.5, house: 'velaryon', birthYear: '94 AC', deathYear: '120 AC', status: 'dead' },
    ],
    connections: [
        { id: 'v1', parents: ['corlys', 'rhaenys_t'], children: ['laena', 'laenor'] },
    ],
    rootId: 'corlys',
    theme: { 
        name: 'Casa Velaryon', 
        config: COLOR_THEMES.cyan, 
        motto: 'El Viejo, el Verdadero, el Valiente',
        seat: 'Marea Alta',
        history: 'Antigua y orgullosa casa noble de ascendencia Valyria, famosa por su dominio de los mares.'
    }
  },
  hightower: {
    id: 'hightower',
    characters: [
        { id: 'otto', name: 'Otto Hightower', title: 'Mano del Rey', wikiSlug: 'Otto_Hightower', generation: 1, x: 0, house: 'hightower', birthYear: '76 AC', status: 'dead' },
        { id: 'alicent', name: 'Alicent', title: 'Reina Viuda', wikiSlug: 'Alicent_Hightower', generation: 2, x: 0, house: 'hightower', birthYear: '88 AC', deathYear: '133 AC', status: 'dead' },
    ],
    connections: [
        { id: 'h1', parents: ['otto'], children: ['alicent'] },
    ],
    rootId: 'otto',
    theme: { 
        name: 'Casa Hightower', 
        config: COLOR_THEMES.green, 
        motto: 'Iluminamos el Camino',
        seat: 'El Faro',
        history: 'Una de las casas más antiguas, orgullosas y poderosas del Dominio.'
    }
  }
};

// --- COMPONENTES AUXILIARES ---

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  accentClass
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  accentClass?: string;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`bg-zinc-950 border-2 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-zinc-700`}>
        <div className={`flex justify-between items-center p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950`}>
          <h3 className={`text-xl font-cinzel font-bold text-white tracking-wide`}>{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 bg-zinc-950/95 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] max-h-[85vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

const ConnectionLines = ({ characters, connections }: { characters: Character[], connections: Connection[] }) => {
  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible filter drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]">
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#71717a" />
        </marker>
      </defs>
      {connections.map((conn) => {
        const parents = conn.parents.map(id => characters.find(c => c.id === id)).filter(Boolean) as Character[];
        const children = conn.children.map(id => characters.find(c => c.id === id)).filter(Boolean) as Character[];
        
        if (parents.length === 0) return null;

        const parentX = parents.reduce((sum, p) => sum + (p.x * X_SPACING), 0) / parents.length;
        const parentY = parents[0].generation * Y_SPACING + CARD_HEIGHT;

        return (
          <g key={conn.id}>
             {parents.length > 1 && (
              <path 
                d={`M ${(parents[0].x * X_SPACING) + CARD_WIDTH/2} ${parents[0].generation * Y_SPACING + CARD_HEIGHT/2} 
                    L ${(parents[1].x * X_SPACING) + CARD_WIDTH/2} ${parents[1].generation * Y_SPACING + CARD_HEIGHT/2}`}
                stroke="#71717a" 
                strokeWidth="2" 
                strokeDasharray="6,4"
                className="opacity-60"
              />
            )}
            {children.map(child => {
              const childX = (child.x * X_SPACING) + CARD_WIDTH / 2;
              const childY = child.generation * Y_SPACING;
              const startX = parentX + CARD_WIDTH / 2;
              const startY = parentY;
              const midY = startY + (childY - startY) / 2;
              const isBastardLine = child.isBastard;

              return (
                <path
                  key={`${conn.id}-${child.id}`}
                  d={`M ${startX} ${startY} C ${startX} ${midY}, ${childX} ${midY}, ${childX} ${childY}`}
                  fill="none" 
                  stroke="#71717a" 
                  strokeWidth={isBastardLine ? "2" : "3"} 
                  strokeDasharray={isBastardLine ? "8,6" : "none"}
                  className="opacity-70"
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};


// --- COMPONENTE PRINCIPAL (APP) ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [datasets, setDatasets] = useState<Record<string, HouseData>>(INITIAL_DATASETS);
  const [activeTab, setActiveTab] = useState<string>('targaryen');
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Character[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [alertInfo, setAlertInfo] = useState<{title: string, message: string} | null>(null);

  // Fallback Logic
  const currentData = datasets[activeTab] || INITIAL_DATASETS.targaryen;
  
  const theme = {
      ...currentData.theme,
      seat: currentData.theme.seat || (INITIAL_DATASETS[activeTab] ? INITIAL_DATASETS[activeTab].theme.seat : ''),
      history: currentData.theme.history || (INITIAL_DATASETS[activeTab] ? INITIAL_DATASETS[activeTab].theme.history : '')
  };

  const characters = currentData.characters;
  const connections = currentData.connections;
  const themeConfig = theme.config || COLOR_THEMES.black;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.8);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingNode, setDraggingNode] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<'add-child' | 'add-parent' | 'add-partner' | 'edit' | 'create-house' | 'edit-house' | 'add-root' | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    name: string; title: string; house: string; isKing: boolean; isBastard: boolean; isNonCanon: boolean; isGap: boolean; imageUrl: string;
    birthYear: string; deathYear: string; lore: string; status: CharacterStatus;
    newHouseName: string; newHouseColor: string; newHouseCustomColor: string;
  }>({ 
    name: '', title: '', house: 'targaryen', isKing: false, isBastard: false, isNonCanon: false, isGap: false, imageUrl: '',
    birthYear: '', deathYear: '', lore: '', status: 'alive',
    newHouseName: '', newHouseColor: 'black', newHouseCustomColor: ''
  });
  
  const [isLinkingExisting, setIsLinkingExisting] = useState(false);
  const [linkCharId, setLinkCharId] = useState<string>('');
  const [newHouseForm, setNewHouseForm] = useState({ 
    name: '', color: 'red', customColor: '', founder: 'Fundador', 
    sigilUrl: '', motto: '', isExtinct: false, seat: '', history: '' 
  });
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // AUTH & SYNC
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const housesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'houses');
    const unsubscribe = onSnapshot(housesRef, (snapshot) => {
      if (!snapshot.empty) {
        const loadedDatasets: Record<string, HouseData> = {};
        snapshot.forEach(doc => {
          loadedDatasets[doc.id] = doc.data() as HouseData;
        });
        setDatasets(prev => ({ ...prev, ...loadedDatasets }));
      }
    });
    return () => unsubscribe();
  }, [user]);

  const saveHouseToDb = async (house: HouseData) => {
    if (!user) return;
    setIsSaving(true);
    try {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'houses', house.id), house);
    } catch (e) {
        console.error("Error saving house:", e);
    } finally {
        setIsSaving(false);
    }
  };

  // HELPERS
  const getAllCharacters = useCallback(() => {
    return Object.values(datasets).flatMap(house => 
        house.characters.map(c => ({...c, originHouseId: house.id, originHouseName: house.theme.name}))
    );
  }, [datasets]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
        setSearchResults([]);
        return;
    }
    const allChars = getAllCharacters();
    const results = allChars.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.title && c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setSearchResults(results);
  }, [searchQuery, getAllCharacters]);

  const navigateToCharacterHouse = (char: Character) => {
    if (!datasets[char.house || '']) {
        setAlertInfo({ title: "Casa no disponible", message: "Esta casa no tiene su propia pestaña activa." });
        return;
    }
    setActiveTab(char.house!);
    setFocusTarget(char.id);
    setSearchQuery(''); setIsSearchOpen(false);
  };

  // ACTIONS
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!containerRef.current) return;
    const zoomSensitivity = 0.001;
    const newScale = Math.min(Math.max(0.1, scale - e.deltaY * zoomSensitivity), 3);
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = (mouseX - position.x) / scale;
    const worldY = (mouseY - position.y) / scale;
    const newX = mouseX - (worldX * newScale);
    const newY = mouseY - (worldY * newScale);
    setScale(newScale);
    setPosition({ x: newX, y: newY });
  }, [scale, position]);

  const handleNodeDragStart = (e: React.MouseEvent, charId: string) => {
    // CRITICAL: Prevent drag if clicking button
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('.no-drag')) return;
    
    e.stopPropagation(); e.preventDefault();
    setDraggingNode(charId); setActiveMenu(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    setActiveMenu(null);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNode) {
      const deltaX = e.movementX / scale;
      const deltaY = e.movementY / scale;
      setDatasets(prev => {
        const house = prev[activeTab];
        if(!house) return prev;
        const newChars = house.characters.map(c => {
          if (c.id === draggingNode) {
            return { ...c, x: c.x + (deltaX / X_SPACING), generation: c.generation + (deltaY / Y_SPACING) };
          }
          return c;
        });
        return { ...prev, [activeTab]: { ...house, characters: newChars } };
      });
    } else if (isPanning) {
      setPosition({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [draggingNode, isPanning, panStart, scale, activeTab]);

  const handleMouseUp = () => {
    if (draggingNode && datasets[activeTab]) saveHouseToDb(datasets[activeTab]);
    setIsPanning(false); setDraggingNode(null);
  };

  const deleteCharacter = (id: string) => { setDeleteTargetId(id); setActiveMenu(null); };

  const executeDeleteCharacter = () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDatasets(prev => {
        const currentHouse = prev[activeTab];
        const updatedHouse = {
            ...currentHouse,
            characters: currentHouse.characters.filter(c => c.id !== id),
            connections: currentHouse.connections.map(conn => ({
                ...conn,
                parents: conn.parents.filter(p => p !== id),
                children: conn.children.filter(c => c !== id)
            })).filter(conn => conn.parents.length > 0 || conn.children.length > 0)
        };
        saveHouseToDb(updatedHouse);
        return { ...prev, [activeTab]: updatedHouse };
    });
    setDeleteTargetId(null);
  };

  const handleCreateHouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const houseId = newHouseForm.name.toLowerCase().replace(/\s+/g, '-');
    const themeConfig = COLOR_THEMES[newHouseForm.color] || COLOR_THEMES.black;
    const newHouse: HouseData = {
      id: houseId,
      characters: [{ id: `founder_${Date.now()}`, name: newHouseForm.founder, title: 'Fundador', wikiSlug: '', generation: 0, x: 0, house: houseId, birthYear: '', deathYear: '', status: 'alive' }],
      connections: [],
      rootId: `founder_${Date.now()}`,
      isExtinct: newHouseForm.isExtinct,
      theme: { name: newHouseForm.name, config: themeConfig, sigilUrl: newHouseForm.sigilUrl, motto: newHouseForm.motto, customColor: newHouseForm.customColor, seat: newHouseForm.seat, history: newHouseForm.history }
    };
    setDatasets(prev => ({ ...prev, [houseId]: newHouse }));
    saveHouseToDb(newHouse);
    setActiveTab(houseId);
    setModalMode(null);
    setNewHouseForm({ 
        name: '', color: 'red', customColor: '', founder: 'Fundador', 
        sigilUrl: '', motto: '', isExtinct: false, seat: '', history: '' 
    });
  };

  const handleEditHouseSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const themeConfig = COLOR_THEMES[newHouseForm.color] || COLOR_THEMES.black;
      setDatasets(prev => {
          const house = prev[activeTab];
          const updatedTheme = { ...prev[activeTab].theme, name: newHouseForm.name, config: themeConfig, sigilUrl: newHouseForm.sigilUrl, motto: newHouseForm.motto, customColor: newHouseForm.customColor, seat: newHouseForm.seat, history: newHouseForm.history };
          let updatedCharacters = house.characters;
          if (house.rootId) { updatedCharacters = house.characters.map(c => c.id === house.rootId ? { ...c, name: newHouseForm.founder } : c); }
          const updatedHouse = { ...house, isExtinct: newHouseForm.isExtinct, characters: updatedCharacters, theme: updatedTheme };
          saveHouseToDb(updatedHouse);
          return { ...prev, [activeTab]: updatedHouse };
      });
      setModalMode(null);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalMode) return;
    if (modalMode !== 'add-root' && !selectedCharId) return;
    const baseChar = selectedCharId ? characters.find(c => c.id === selectedCharId) : null;
    if (modalMode !== 'add-root' && !baseChar) return;
    let targetHouseToSave: HouseData | null = null;
    let createdHouseToSave: HouseData | null = null;

    if (modalMode === 'edit') {
        const targetHouseId = (formData.house === 'CREATE_NEW') ? formData.newHouseName.toLowerCase().replace(/\s+/g, '-') : formData.house;
        setDatasets(prev => {
            let nextDatasets = { ...prev };
            if (formData.house === 'CREATE_NEW' && !nextDatasets[targetHouseId]) {
                 const themeConfig = COLOR_THEMES[formData.newHouseColor] || COLOR_THEMES.black;
                 nextDatasets[targetHouseId] = { id: targetHouseId, characters: [], connections: [], theme: { name: formData.newHouseName, config: themeConfig, customColor: formData.newHouseCustomColor } };
                 createdHouseToSave = nextDatasets[targetHouseId];
            }
            const currentHouse = nextDatasets[activeTab];
            const updatedHouse = {
                ...currentHouse,
                characters: currentHouse.characters.map(c => c.id === selectedCharId ? { 
                    ...c, name: formData.name, title: formData.title, house: targetHouseId, 
                    isKing: formData.isKing, isBastard: formData.isBastard, isNonCanon: formData.isNonCanon, isGap: formData.isGap,
                    imageUrl: formData.imageUrl, birthYear: formData.birthYear, deathYear: formData.deathYear, lore: formData.lore, status: formData.status
                } : c)
            };
            nextDatasets[activeTab] = updatedHouse;
            targetHouseToSave = updatedHouse;
            return nextDatasets;
        });
    } else {
        const updateFunction = (currentHouse: HouseData, newCharOrLink: Character | string, mode: string) => {
            let updatedChars = [...currentHouse.characters];
            let updatedConns = [...currentHouse.connections];
            let targetId = typeof newCharOrLink === 'string' ? newCharOrLink : newCharOrLink.id;
  
            if (typeof newCharOrLink !== 'string') {
                updatedChars.push(newCharOrLink);
            } else {
                const isLocal = updatedChars.some(c => c.id === targetId);
                if (!isLocal) {
                    const allChars = getAllCharacters();
                    const globalChar = allChars.find(c => c.id === targetId);
                    if (globalChar) {
                        let newX = baseChar ? baseChar.x : 0;
                        let newGen = globalChar.generation;
                        if (baseChar) {
                          if (mode === 'add-child') { newGen = baseChar.generation + 1; newX += 0.5; }
                          else if (mode === 'add-parent') { newGen = baseChar.generation - 1; newX += 0.5; }
                          else if (mode === 'add-partner') { newGen = baseChar.generation; newX += 1.2; }
                        }
                        updatedChars.push({ ...globalChar, x: newX, generation: newGen });
                    }
                }
            }
            if (mode === 'add-child') {
               const existingConnIndex = updatedConns.findIndex(c => c.children.includes(targetId));
               if (existingConnIndex >= 0) {
                   const existingConn = updatedConns[existingConnIndex];
                   if (!existingConn.parents.includes(baseChar!.id)) {
                       const newParents = [...existingConn.parents, baseChar!.id];
                       updatedConns[existingConnIndex] = { ...existingConn, parents: newParents };
                   }
               } else {
                   updatedConns.push({ id: `conn_${Date.now()}`, parents: [baseChar!.id], children: [targetId] });
               }
            } else if (mode === 'add-parent') {
               const existingConnIndex = updatedConns.findIndex(c => c.children.includes(baseChar!.id));
               if (existingConnIndex >= 0) {
                   const existingConn = updatedConns[existingConnIndex];
                   if (!existingConn.parents.includes(targetId)) {
                       const newParents = [...existingConn.parents, targetId];
                       updatedConns[existingConnIndex] = { ...existingConn, parents: newParents };
                   }
               } else {
                   updatedConns.push({ id: `conn_${Date.now()}`, parents: [targetId], children: [baseChar!.id] });
               }
            } else if (mode === 'add-partner') {
               updatedConns.push({ id: `conn_${Date.now()}`, parents: [baseChar!.id, targetId], children: [] });
            }
            return { ...currentHouse, characters: updatedChars, connections: updatedConns };
        };

        if (isLinkingExisting && linkCharId) {
             setDatasets(prev => {
                 const updatedHouse = updateFunction(prev[activeTab], linkCharId, modalMode!);
                 targetHouseToSave = updatedHouse;
                 return { ...prev, [activeTab]: updatedHouse };
             });
        } else {
             const newId = `custom_${Date.now()}`;
             let newGen = 1; let newX = 0;
             if (baseChar) {
                newGen = baseChar.generation; newX = baseChar.x;
                if (modalMode === 'add-child') { newGen += 1; newX += 0.5; }
                else if (modalMode === 'add-parent') { newGen -= 1; newX += 0.5; }
                else if (modalMode === 'add-partner') { newX += 1.2; }
             } else if (modalMode === 'add-root') { newGen = 1; newX = 0; }
    
             const targetHouseId = (formData.house === 'CREATE_NEW') ? formData.newHouseName.toLowerCase().replace(/\s+/g, '-') : formData.house;
             setDatasets(prev => {
                let nextDatasets = { ...prev };
                if (formData.house === 'CREATE_NEW' && !nextDatasets[targetHouseId]) {
                    const themeConfig = COLOR_THEMES[formData.newHouseColor] || COLOR_THEMES.black;
                    const newHouseData = {
                        id: targetHouseId, characters: [], connections: [],
                        theme: { name: formData.newHouseName, config: themeConfig, customColor: formData.newHouseCustomColor }
                    };
                    nextDatasets[targetHouseId] = newHouseData;
                }
                const newChar: Character = {
                    id: newId, name: formData.name, title: formData.title, wikiSlug: formData.name.replace(/\s+/g, '_'),
                    generation: newGen, x: newX, house: targetHouseId, isKing: formData.isKing, isBastard: formData.isBastard, isNonCanon: formData.isNonCanon, isGap: formData.isGap,
                    imageUrl: formData.imageUrl, birthYear: formData.birthYear, deathYear: formData.deathYear, lore: formData.lore, status: formData.status
                };
                let activeHouse = nextDatasets[activeTab];
                let updatedActiveHouse = activeHouse;
                if (modalMode === 'add-root') {
                     updatedActiveHouse = { ...activeHouse, characters: [...activeHouse.characters, newChar] };
                } else {
                     updatedActiveHouse = updateFunction(activeHouse, newChar, modalMode!);
                }
                nextDatasets[activeTab] = updatedActiveHouse;
                targetHouseToSave = updatedActiveHouse;

                if (targetHouseId && targetHouseId !== activeTab) {
                    const targetHouse = nextDatasets[targetHouseId];
                    if (targetHouse) {
                        if (!targetHouse.characters.some(c => c.id === newId)) {
                            const rootCharCopy = { ...newChar, x: 0, generation: 1 };
                            const updatedTargetHouse = { ...targetHouse, characters: [...targetHouse.characters, rootCharCopy], rootId: newId };
                            nextDatasets[targetHouseId] = updatedTargetHouse;
                            createdHouseToSave = updatedTargetHouse;
                        }
                    }
                }
                return nextDatasets;
             });
        }
    }
    setTimeout(() => { if (targetHouseToSave) saveHouseToDb(targetHouseToSave); if (createdHouseToSave) saveHouseToDb(createdHouseToSave); }, 0);
    setModalMode(null);
  };

  const centerView = (targetCharId?: string) => {
    if (typeof window === 'undefined') return;
    if (!datasets[activeTab]) return;
    const targetScale = 0.8;
    const houseData = datasets[activeTab];
    let targetChar = houseData.characters[0];
    if (targetCharId) {
        const found = houseData.characters.find(c => c.id === targetCharId);
        if (found) targetChar = found;
    } else if (houseData.rootId) {
        const root = houseData.characters.find(c => c.id === houseData.rootId);
        if (root) targetChar = root;
    }
    if (!targetChar) { setPosition({ x: window.innerWidth/2, y: 100 }); return; }
    const centerX = (targetChar.x * X_SPACING) + (CARD_WIDTH/2);
    const screenCenter = window.innerWidth / 2;
    const newX = screenCenter - (centerX * targetScale);
    setScale(targetScale);
    setPosition({ x: newX, y: 100 }); 
  };

  useEffect(() => {
    if (focusTarget) { centerView(focusTarget); setFocusTarget(null); } else { centerView(); }
  }, [activeTab]);

  const openModalWrapper = (mode: typeof modalMode, charId: string) => {
    setModalMode(mode); setSelectedCharId(charId); setIsLinkingExisting(false); setLinkCharId('');
    if (mode === 'add-root') {
         setFormData({ name: '', title: '', house: activeTab, isKing: false, isBastard: false, isNonCanon: false, isGap: false, imageUrl: '', birthYear: '', deathYear: '', lore: '', status: 'alive', newHouseName: '', newHouseColor: 'black', newHouseCustomColor: '' });
         return;
    }
    const char = characters.find(c => c.id === charId);
    if (mode === 'edit' && char) {
        setFormData({ 
            name: char.name, title: char.title, house: char.house || activeTab, 
            isKing: !!char.isKing, isBastard: !!char.isBastard, isNonCanon: !!char.isNonCanon, isGap: !!char.isGap,
            imageUrl: char.imageUrl || '', birthYear: char.birthYear || '', deathYear: char.deathYear || '', lore: char.lore || '', status: char.status || 'alive',
            newHouseName: '', newHouseColor: 'black', newHouseCustomColor: ''
        });
    } else {
        setFormData({ name: '', title: '', house: activeTab, isKing: false, isBastard: false, isNonCanon: false, isGap: false, imageUrl: '', birthYear: '', deathYear: '', lore: '', status: 'alive', newHouseName: '', newHouseColor: 'black', newHouseCustomColor: '' });
    }
    setActiveMenu(null);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-gray-200 overflow-hidden font-sans select-none relative">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lato:wght@300;400;700&display=swap');.font-cinzel { font-family: 'Cinzel', serif; } .font-lato { font-family: 'Lato', sans-serif; }`}</style>
      
      {/* HEADER & UI */}
      <div className={`absolute top-0 left-0 w-full z-50 bg-gradient-to-b p-0 pb-12 pointer-events-none transition-colors duration-500`} style={theme.customColor ? { background: `linear-gradient(to bottom, ${theme.customColor}E6, transparent)` } : undefined}>
         {!theme.customColor && <div className={`absolute inset-0 bg-gradient-to-b ${themeConfig.bgGradient} -z-10`} />}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 pointer-events-auto gap-4">
             <div className="flex items-center gap-6 group">
                 {/* SIGIL */}
                 <div className={`w-20 h-20 rounded-2xl flex items-center justify-center bg-black/40 backdrop-blur-md border-2 shadow-lg overflow-hidden shrink-0 relative`} style={{ borderColor: theme.customColor || undefined }}>
                    {!theme.customColor && <div className={`absolute inset-0 border-2 ${themeConfig.borderColor} opacity-50 rounded-xl pointer-events-none`} />}
                    {theme.sigilUrl ? <img src={theme.sigilUrl} alt="" className="w-full h-full object-cover" /> : (currentData.isExtinct ? <ShieldOff size={40} className="opacity-90 drop-shadow-lg text-zinc-500" /> : <Shield size={40} className="opacity-90 drop-shadow-lg" style={{ color: theme.customColor || undefined }} />)}
                    {!theme.customColor && !theme.sigilUrl && !currentData.isExtinct && <Shield size={40} className={`opacity-90 drop-shadow-lg ${themeConfig.accentColor}`} />}
                 </div>
                 {/* TITLE */}
                 <div>
                    <h1 className={`text-4xl font-cinzel font-bold tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-colors duration-300 flex items-center gap-3`} style={{ color: theme.customColor }}>
                        {!theme.customColor && <span className={themeConfig.textColor}>{theme.name}</span>}
                        {theme.customColor && theme.name}
                        <button onClick={() => { 
                             const colorKey = Object.keys(COLOR_THEMES).find(k => COLOR_THEMES[k].accentColor === themeConfig.accentColor) || 'black';
                             let founderName = '';
                             if (currentData.rootId) { const root = characters.find(c => c.id === currentData.rootId); if(root) founderName = root.name; }
                             setNewHouseForm({ name: theme.name, color: colorKey, customColor: theme.customColor || '', founder: founderName, sigilUrl: theme.sigilUrl || '', motto: theme.motto || '', isExtinct: !!currentData.isExtinct, seat: theme.seat || '', history: theme.history || '' });
                             setModalMode('edit-house');
                        }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-opacity"><Edit2 size={18}/></button>
                    </h1>
                    <div className="text-zinc-300 text-sm mt-1 italic font-cinzel tracking-wider flex items-center gap-2 opacity-80 group/seat cursor-help relative">
                        <span className="w-8 h-px bg-zinc-500/50 inline-block"/>
                        {theme.motto ? `"${theme.motto}"` : (currentData.isExtinct ? "Casa Extinta" : "Editor de Linaje")}
                        {theme.seat && <span className="ml-2 flex items-center gap-1 text-zinc-400 hover:text-white" title={`Asentamiento: ${theme.seat}`}><Castle size={12}/> {theme.seat}</span>}
                        <span className="w-8 h-px bg-zinc-500/50 inline-block"/>
                        {isSaving && <span className="ml-2 flex items-center gap-1 text-zinc-500 text-xs font-sans not-italic"><Loader2 size={10} className="animate-spin"/> Guardando...</span>}
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
                 <div className="flex flex-wrap gap-2 bg-black/60 p-2 rounded-xl backdrop-blur-md border border-zinc-700/50">
                    {Object.values(datasets).map(h => {
                        const isActive = activeTab === h.id;
                        return (
                            <button key={h.id} onClick={() => setActiveTab(h.id)} className={`px-4 py-2 rounded-lg text-xs font-bold font-cinzel border transition-all flex items-center gap-2 ${isActive ? 'bg-white/10 border-white/20' : 'border-transparent text-zinc-400 hover:text-white'}`}>
                                {h.theme.sigilUrl ? <img src={h.theme.sigilUrl} className="w-4 h-4 object-contain"/> : <Shield size={14}/>} {h.theme.name}
                            </button>
                        );
                    })}
                    <div className="w-px bg-zinc-600 mx-1 h-6 self-center"/>
                    <button onClick={() => setModalMode('create-house')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-emerald-400 border border-transparent hover:border-emerald-900 font-cinzel"><Plus size={14}/> Nueva</button>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => setShowLegend(true)} className="bg-zinc-900/80 px-4 py-2 rounded-lg text-xs border border-zinc-700 flex items-center gap-2 text-zinc-300 font-cinzel"><HelpCircle size={14}/> Leyenda</button>
                    <button onClick={() => centerView()} className="bg-zinc-900/80 px-4 py-2 rounded-lg text-xs border border-zinc-700 flex items-center gap-2 text-zinc-300 font-cinzel"><Move size={14}/> Centrar</button>
                 </div>
             </div>
        </div>
      </div>

      {/* CANVAS */}
      <div 
        className={`flex-1 w-full h-full relative overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleCanvasMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel} ref={containerRef}
      >
        <div style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transformOrigin: '0 0', width: `${CANVAS_SIZE}px`, height: `${CANVAS_SIZE}px` }} className="relative transition-transform duration-75 ease-linear">
           {/* Grid Background */}
           <div className={`absolute inset-0 opacity-100 pointer-events-none bg-[#0a0a0a] ${currentData.isExtinct ? 'grayscale brightness-50' : ''}`}>
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")` }}/>
           </div>
           
           <ConnectionLines characters={characters} connections={connections} />

           {characters.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="pointer-events-auto text-center"><h2 className="text-2xl font-cinzel font-bold text-zinc-500 mb-4">Vacío</h2><button onClick={() => setModalMode('add-root')} className="px-6 py-3 rounded-lg bg-zinc-800 text-white font-cinzel border border-zinc-600">Crear Primer Personaje</button></div>
                </div>
           )}

           {characters.map((char) => (
             <div key={char.id}
                className={`absolute rounded-lg shadow-2xl group transition-all duration-300
                    ${char.isGap ? 'w-[60px] h-[60px] rounded-full border-dashed border-2 border-zinc-600 bg-black/50 flex items-center justify-center' : ''}
                    ${!char.isGap ? 'border-double border-4 bg-zinc-900/90' : ''}
                    ${char.house === activeTab ? (theme.customColor ? '' : themeConfig.borderColor) : 'border-zinc-700 opacity-80 hover:opacity-100'}
                    ${char.isKing && char.house === activeTab && !theme.customColor ? themeConfig.glowColor : ''}
                    ${activeMenu === char.id ? 'z-[60]' : (draggingNode === char.id ? 'z-[100] scale-105 ring-2 ring-white/20 cursor-grabbing' : 'z-10 hover:z-50 hover:scale-[1.02] cursor-grab')}
                    ${char.status === 'dead' ? 'grayscale brightness-75' : ''}
                `}
                style={{ 
                    left: char.x * X_SPACING, top: char.generation * Y_SPACING, 
                    width: char.isGap ? GAP_NODE_SIZE : CARD_WIDTH, height: char.isGap ? GAP_NODE_SIZE : CARD_HEIGHT,
                    borderColor: (!char.isGap && char.house === activeTab && theme.customColor) ? theme.customColor : undefined,
                    boxShadow: (!char.isGap && char.isKing && char.house === activeTab && theme.customColor) ? `0 0 25px ${theme.customColor}66` : undefined, 
                    transition: draggingNode === char.id ? 'none' : 'transform 0.2s, box-shadow 0.2s, border-color 0.3s' 
                }}
                onMouseDown={(e) => handleNodeDragStart(e, char.id)}
             >
                {char.isGap ? (
                    <GitCommit className="text-zinc-500" />
                ) : (
                    <>
                        {/* RESTAURADO: DISEÑO CLÁSICO (AVATAR CIRCULAR + TEXTO) */}
                        <div className="flex-1 flex flex-col items-center justify-center p-3 relative bg-gradient-to-b from-white/5 to-transparent">
                            <div className="relative mb-2">
                                <div className={`w-16 h-16 rounded-full overflow-hidden border-2 bg-zinc-950 shadow-inner ${char.house === activeTab && !theme.customColor ? 'border-zinc-500' : 'border-zinc-600'} ${char.isBastard ? 'border-dashed' : ''} ${char.isNonCanon ? 'border-dotted' : ''}`} style={{ borderColor: (char.house === activeTab && theme.customColor) ? theme.customColor : undefined }}>
                                {char.imageUrl ? <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div className="w-full h-full flex items-center justify-center text-zinc-700"><User size={32} /></div>}
                                </div>
                            {char.isKing && <div className="absolute -top-2 -right-2 bg-black/80 rounded-full p-1 border border-yellow-900 shadow-lg transform rotate-12 z-20"><Crown size={14} className="text-yellow-500 fill-yellow-500/20" /></div>}
                            {char.isBastard && <div className="absolute -bottom-1 -left-1 bg-black/80 rounded-full p-0.5 border border-zinc-600 z-20" title="Bastardo"><Ban size={12} className="text-zinc-400" /></div>}
                            {char.isNonCanon && <div className="absolute -top-1 -left-1 bg-black/80 rounded-full p-0.5 border border-amber-600 z-20" title="No Canon"><AlertTriangle size={12} className="text-amber-500" /></div>}
                            {char.status === 'dead' && <div className="absolute bottom-0 right-0 bg-black/80 px-1 rounded-md border border-zinc-800 z-20 shadow-md"><Skull size={10} className="text-zinc-500" /></div>}
                            {char.status === 'missing' && <div className="absolute bottom-0 right-0 bg-black/80 px-1 rounded-md border border-zinc-800 z-20 shadow-md"><HelpCircle size={10} className="text-amber-500" /></div>}
                            {char.status === 'unknown' && <div className="absolute bottom-0 right-0 bg-black/80 px-1 rounded-md border border-zinc-800 z-20 shadow-md"><Ghost size={10} className="text-purple-500" /></div>}
                            </div>
                            
                            {char.lore && (
                                <div className="absolute top-2 left-2 z-20 group/lore"><BookOpen size={16} className="text-zinc-500 hover:text-white transition-colors cursor-help" />
                                    <div className="absolute left-0 top-6 w-48 bg-black/95 border border-zinc-700 p-3 rounded-lg text-xs text-zinc-300 shadow-xl opacity-0 group-hover/lore:opacity-100 transition-opacity pointer-events-none z-50 font-lato leading-relaxed">{char.lore}</div>
                                </div>
                            )}

                            <h3 className={`font-cinzel font-bold text-lg leading-tight text-center line-clamp-2 px-1 ${char.isKing ? (theme.customColor ? '' : themeConfig.accentColor) : 'text-zinc-200'} ${char.isNonCanon ? 'italic text-amber-100/70' : ''}`} style={{ color: (char.isKing && theme.customColor) ? theme.customColor : undefined }}>{char.name}</h3>
                            <p className="text-xs text-zinc-400 italic mt-1 font-lato text-center line-clamp-1">{char.title}</p>
                            
                            {(char.birthYear || char.deathYear) && (<div className="flex items-center justify-center gap-1 mt-1 text-[10px] text-zinc-500 font-mono bg-black/30 px-2 py-0.5 rounded-full border border-white/5"><Calendar size={8} /> <span>{char.birthYear || '?'}</span> <span>-</span> <span>{char.deathYear || '?'}</span></div>)}
                            
                            {char.house && char.house !== activeTab && datasets[char.house] && (<button onClick={(e) => { e.stopPropagation(); navigateToCharacterHouse(char); }} className="mt-2 flex items-center gap-1 bg-zinc-950/80 hover:bg-black px-3 py-1 rounded-full text-[10px] text-zinc-300 border border-zinc-700/50 transition-colors uppercase tracking-wide"><LogOut size={10} /> {datasets[char.house].theme.name.replace('Casa ', '')}</button>)}
                            
                            {/* BOTÓN DE MENÚ (Asegurado z-index alto y fuera del flujo de drag) */}
                            <button className="absolute top-2 right-2 p-2 z-30 text-zinc-600 hover:text-white rounded-full bg-black/20 hover:bg-black/50 transition-colors cursor-pointer" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === char.id ? null : char.id); }}><MoreVertical size={16} /></button>
                        </div>
                    </>
                )}
                
                {activeMenu === char.id && (
                    <div className="absolute top-full right-0 mt-1 bg-zinc-950 border border-zinc-700 rounded w-48 z-[70] text-sm overflow-hidden shadow-xl" onMouseDown={e => e.stopPropagation()}>
                        <button onClick={() => openModalWrapper('edit', char.id)} className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-zinc-300">Editar</button>
                        <button onClick={() => openModalWrapper('add-child', char.id)} className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-zinc-300">Hijo</button>
                        <button onClick={() => openModalWrapper('add-parent', char.id)} className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-zinc-300">Padre</button>
                        <button onClick={() => openModalWrapper('add-partner', char.id)} className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-zinc-300">Pareja</button>
                        <button onClick={() => deleteCharacter(char.id)} className="w-full text-left px-4 py-2 hover:bg-red-900/30 text-red-400">Eliminar</button>
                    </div>
                )}
             </div>
           ))}
        </div>
      </div>

      {/* --- ALL MODALS --- */}
      <Modal isOpen={showLegend} onClose={() => setShowLegend(false)} title="Simbología" accentClass={themeConfig.accentColor}>
         <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                <div className="flex items-center gap-2"><Crown size={14} className="text-yellow-500"/> Monarca</div>
                <div className="flex items-center gap-2"><Ban size={14} className="text-zinc-400"/> Bastardo</div>
                <div className="flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500"/> No Canon</div>
                <div className="flex items-center gap-2"><GitCommit size={14} className="text-zinc-500"/> Nexo Perdido</div>
            </div>
         </div>
      </Modal>

      <Modal isOpen={['create-house', 'edit-house'].includes(modalMode || '')} onClose={() => setModalMode(null)} title={modalMode === 'create-house' ? "Nueva Casa" : "Editar Casa"} accentClass={themeConfig.accentColor}>
         <form onSubmit={modalMode === 'create-house' ? handleCreateHouseSubmit : handleEditHouseSubmit} className="flex flex-col gap-4">
            <input type="text" placeholder="Nombre Casa" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={newHouseForm.name} onChange={e => setNewHouseForm({...newHouseForm, name: e.target.value})} required />
            <input type="text" placeholder="Fundador" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={newHouseForm.founder} onChange={e => setNewHouseForm({...newHouseForm, founder: e.target.value})} required />
            <div className="flex gap-2">
                <input type="text" placeholder="URL Escudo" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white flex-1" value={newHouseForm.sigilUrl} onChange={e => setNewHouseForm({...newHouseForm, sigilUrl: e.target.value})} />
                <input type="text" placeholder="Asentamiento" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white flex-1" value={newHouseForm.seat} onChange={e => setNewHouseForm({...newHouseForm, seat: e.target.value})} />
            </div>
            <textarea placeholder="Historia..." className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white h-20" value={newHouseForm.history} onChange={e => setNewHouseForm({...newHouseForm, history: e.target.value})} />
            <input type="text" placeholder="Lema" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={newHouseForm.motto} onChange={e => setNewHouseForm({...newHouseForm, motto: e.target.value})} />
            
            <div className="flex flex-wrap gap-2">
                {Object.keys(COLOR_THEMES).map(colorKey => (
                  <button key={colorKey} type="button" onClick={() => setNewHouseForm({...newHouseForm, color: colorKey, customColor: ''})} className={`w-8 h-8 rounded-full border-2 ${newHouseForm.color === colorKey && !newHouseForm.customColor ? 'border-white scale-110' : 'border-zinc-800'}`} style={{ backgroundColor: colorKey === 'black' ? '#222' : colorKey === 'gold' ? '#ca8a04' : colorKey === 'stone' ? '#57534e' : colorKey }} />
                ))}
                <input type="color" className="w-8 h-8 cursor-pointer rounded-full border-0 p-0" value={newHouseForm.customColor || '#ff0000'} onChange={e => setNewHouseForm({...newHouseForm, customColor: e.target.value})}/>
            </div>

            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-800/50">
               <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <input type="checkbox" className="accent-zinc-500 w-4 h-4 rounded-sm" checked={newHouseForm.isExtinct || false} onChange={e => setNewHouseForm({...newHouseForm, isExtinct: e.target.checked})}/>
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors font-bold uppercase tracking-wider flex items-center gap-1"><ShieldOff size={12}/> Casa Extinta / Antigua</span>
               </label>
            </div>

            <div className="flex justify-end pt-4"><button type="submit" className="bg-white text-black px-4 py-2 rounded font-bold">Guardar</button></div>
         </form>
      </Modal>

      <Modal isOpen={['add-child', 'add-parent', 'add-partner', 'edit', 'add-root'].includes(modalMode || '')} onClose={() => setModalMode(null)} title="Personaje" accentClass={themeConfig.accentColor}>
         <form onSubmit={handleModalSubmit} className="flex flex-col gap-4">
            {/* Character fields... Name, Title, Image, Dates, Lore, Checkboxes... */}
            <input type="text" placeholder="Nombre" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input type="text" placeholder="Título" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <input type="url" placeholder="URL Imagen" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
            <div className="flex gap-2">
                <input type="text" placeholder="Nacimiento" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white flex-1" value={formData.birthYear} onChange={e => setFormData({...formData, birthYear: e.target.value})} />
                <input type="text" placeholder="Muerte" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white flex-1" value={formData.deathYear} onChange={e => setFormData({...formData, deathYear: e.target.value})} />
            </div>
            <textarea placeholder="Lore..." className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white h-20" value={formData.lore} onChange={e => setFormData({...formData, lore: e.target.value})} />
            <select className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as CharacterStatus})}>
                <option value="alive">Vivo</option>
                <option value="dead">Muerto</option>
                <option value="missing">Desaparecido</option>
                <option value="unknown">Desconocido</option>
            </select>
            <div className="flex gap-2">
                <label><input type="checkbox" checked={formData.isKing} onChange={e => setFormData({...formData, isKing: e.target.checked})} /> Monarca</label>
                <label><input type="checkbox" checked={formData.isBastard} onChange={e => setFormData({...formData, isBastard: e.target.checked})} /> Bastardo</label>
                <label><input type="checkbox" checked={formData.isNonCanon} onChange={e => setFormData({...formData, isNonCanon: e.target.checked})} /> No Canon</label>
                <label><input type="checkbox" checked={formData.isGap} onChange={e => setFormData({...formData, isGap: e.target.checked})} /> Gap</label>
            </div>
            {formData.house === 'CREATE_NEW' && (
                <div className="bg-zinc-800 p-2 rounded">
                    <input type="text" placeholder="Nueva Casa" className="bg-zinc-900 border border-zinc-700 rounded p-2 w-full text-white" value={formData.newHouseName} onChange={e => setFormData({...formData, newHouseName: e.target.value})} required/>
                </div>
            )}
            
            {!isLinkingExisting ? (
                <></>
            ) : (
                <div className="bg-zinc-900 p-2 rounded h-40 overflow-y-auto">
                    {getAllCharacters().filter(c => c.id !== selectedCharId).map(c => (
                        <div key={c.id} onClick={() => setLinkCharId(c.id)} className={`p-2 cursor-pointer hover:bg-zinc-800 ${linkCharId === c.id ? 'bg-zinc-700' : ''}`}>
                            {c.name}
                        </div>
                    ))}
                </div>
            )}
            
            {['add-child', 'add-parent', 'add-partner'].includes(modalMode || '') && (
                 <div className="flex bg-zinc-950 p-1 rounded-lg mb-2 border border-zinc-800">
                    <button type="button" onClick={() => setIsLinkingExisting(false)} className={`flex-1 text-xs py-1.5 rounded-md ${!isLinkingExisting ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Crear Nuevo</button>
                    <button type="button" onClick={() => setIsLinkingExisting(true)} className={`flex-1 text-xs py-1.5 rounded-md ${isLinkingExisting ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Vincular Existente</button>
                 </div>
            )}

            <div className="flex justify-end pt-4"><button type="submit" className="bg-white text-black px-4 py-2 rounded font-bold">Guardar</button></div>
         </form>
      </Modal>

      {/* Confirm & Alert Modals... */}
      {deleteTargetId && <Modal isOpen={true} onClose={() => setDeleteTargetId(null)} title="Eliminar" accentClass="text-red-500"><div className="text-white mb-4">¿Eliminar personaje?</div><button onClick={executeDeleteCharacter} className="bg-red-600 text-white px-4 py-2 rounded w-full">Confirmar</button></Modal>}
      {alertInfo && <Modal isOpen={true} onClose={() => setAlertInfo(null)} title={alertInfo.title} accentClass="text-yellow-500"><div className="text-white mb-4">{alertInfo.message}</div><button onClick={() => setAlertInfo(null)} className="bg-zinc-700 text-white px-4 py-2 rounded w-full">OK</button></Modal>}

    </div>
  );
}