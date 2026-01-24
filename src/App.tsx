import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MousePointer2, ZoomIn, ZoomOut, Move, ExternalLink, Info, Plus, Trash2, Edit2, MoreVertical, X, Save, UserPlus, User, Image as ImageIcon, Shield, Library, ScrollText, Link as LinkIcon, LogOut, Palette, Cloud, Loader2, Crown, Ban, Search, Calendar, BookOpen, Skull, HelpCircle, Ghost, HeartPulse, Map, AlertTriangle, ShieldOff, Castle, Feather, GitCommit, Menu, Flame } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: "AIzaSyC7P041hWSO-I4tmbPZHD--y_LH4mYLFVQ",
  authDomain: "arbol-genealogico-asoiaf.firebaseapp.com",
  projectId: "arbol-genealogico-asoiaf",
  storageBucket: "arbol-genealogico-asoiaf.firebasestorage.app",
  messagingSenderId: "582222396267",
  appId: "1:582222396267:web:21da337c8e056576a5ea2e"
};
let app: any, auth: any, db: any;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.warn("Firebase no se pudo inicializar. La app funcionará en modo local.", e);
}

const appId = 'arbol-targaryen-v1';

// --- CONFIGURACIÓN Y TIPOS ---

const CARD_WIDTH = 220; 
const CARD_HEIGHT = 300; 
const GAP_NODE_SIZE = 60;
const X_SPACING = 260;
const Y_SPACING = 340; 
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
  isDragonRider?: boolean;
  dragonName?: string; // --- NUEVO CAMPO: NOMBRE DEL DRAGÓN ---
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
        { id: 'aegon1', name: 'Aegon I', title: 'El Conquistador', wikiSlug: 'Aegon_I_Targaryen', imageUrl: 'https://awoiaf.westeros.org/images/thumb/e/e8/Aegon_the_Conqueror_by_Jota_Saraiva.jpg/300px-Aegon_the_Conqueror_by_Jota_Saraiva.jpg', generation: 1, x: 0.5, isKing: true, isDragonRider: true, dragonName: 'Balerion', house: 'targaryen', birthYear: '27 BC', deathYear: '37 AC', status: 'dead', lore: 'Conquistó Poniente montado en Balerion el Terror Negro.' },
        { id: 'visenya', name: 'Visenya', title: 'Reina', wikiSlug: 'Visenya_Targaryen', imageUrl: 'https://awoiaf.westeros.org/images/thumb/d/d4/Visenya_Targaryen_by_Fabio_Arangio.jpg/300px-Visenya_Targaryen_by_Fabio_Arangio.jpg', generation: 1, x: -1, isKing: true, isDragonRider: true, dragonName: 'Vhagar', house: 'targaryen', birthYear: '29 BC', deathYear: '44 AC', status: 'dead' },
        { id: 'rhaenys', name: 'Rhaenys', title: 'Reina', wikiSlug: 'Rhaenys_Targaryen', imageUrl: 'https://awoiaf.westeros.org/images/thumb/f/f6/Rhaenys_Targaryen_Amoka.jpg/300px-Rhaenys_Targaryen_Amoka.jpg', generation: 1, x: 2, isKing: true, isDragonRider: true, dragonName: 'Meraxes', house: 'targaryen', birthYear: '26 BC', deathYear: '10 AC', status: 'dead' },
        { id: 'aenys1', name: 'Aenys I', title: 'Rey', wikiSlug: 'Aenys_I_Targaryen', generation: 2, x: 2, isKing: true, isDragonRider: true, dragonName: 'Quicksilver', house: 'targaryen', birthYear: '07 AC', deathYear: '42 AC', status: 'dead' },
        { id: 'maegor1', name: 'Maegor I', title: 'El Cruel', wikiSlug: 'Maegor_I_Targaryen', generation: 2, x: -1, isKing: true, isDragonRider: true, dragonName: 'Balerion', house: 'targaryen', birthYear: '12 AC', deathYear: '48 AC', status: 'dead' },
        // La Danza
        { id: 'viserys1', name: 'Viserys I', title: 'El Pacífico', wikiSlug: 'Viserys_I_Targaryen', imageUrl: 'https://awoiaf.westeros.org/images/thumb/2/23/Viserys_I_Targaryen_Amoka.jpg/300px-Viserys_I_Targaryen_Amoka.jpg', generation: 4, x: 0.5, isKing: true, isDragonRider: true, dragonName: 'Balerion', house: 'targaryen', birthYear: '77 AC', deathYear: '129 AC', status: 'dead' },
        { id: 'daemon', name: 'Daemon', title: 'El Príncipe Canalla', wikiSlug: 'Daemon_Targaryen', imageUrl: 'https://awoiaf.westeros.org/images/thumb/e/e0/Daemon_Targaryen_The_Rogue_Prince.jpg/300px-Daemon_Targaryen_The_Rogue_Prince.jpg', generation: 4, x: 2, isDragonRider: true, dragonName: 'Caraxes', house: 'targaryen', birthYear: '81 AC', deathYear: '130 AC', status: 'dead' },
        { id: 'rhaenyra', name: 'Rhaenyra', title: 'La Reina Negra', wikiSlug: 'Rhaenyra_Targaryen', generation: 5, x: 0.5, isKing: true, isDragonRider: true, dragonName: 'Syrax', house: 'targaryen', birthYear: '97 AC', deathYear: '130 AC', status: 'dead' },
        { id: 'aegon2', name: 'Aegon II', title: 'El Usurpador', wikiSlug: 'Aegon_II_Targaryen', generation: 5, x: -1, isKing: true, isDragonRider: true, dragonName: 'Sunfyre', house: 'targaryen', birthYear: '107 AC', deathYear: '131 AC', status: 'dead' },
    ],
    connections: [
        { id: 'c1', parents: ['visenya', 'aegon1', 'rhaenys'], children: [] }, 
        { id: 'c2', parents: ['aegon1', 'rhaenys'], children: ['aenys1'] },
        { id: 'c3', parents: ['aegon1', 'visenya'], children: ['maegor1'] },
        { id: 'c4', parents: ['viserys1'], children: ['rhaenyra', 'aegon2'] },
    ],
    rootId: 'aegon1',
    theme: { name: 'Casa Targaryen', config: COLOR_THEMES.red, motto: 'Fuego y Sangre', seat: 'Rocadragón', history: 'La sangre del dragón.' }
  },
  stark: {
    id: 'stark',
    characters: [
        { id: 'eddard', name: 'Eddard "Ned"', title: 'Mano del Rey', wikiSlug: 'Eddard_Stark', imageUrl: 'https://awoiaf.westeros.org/images/thumb/7/7b/Eddard_Stark_Amoka.jpg/300px-Eddard_Stark_Amoka.jpg', generation: 1, x: 0, house: 'stark', birthYear: '263 AC', deathYear: '298 AC', status: 'dead', lore: 'Señor de Invernalia.' },
    ],
    connections: [],
    rootId: 'eddard',
    theme: { name: 'Casa Stark', config: COLOR_THEMES.blue, motto: 'Se acerca el Invierno', seat: 'Invernalia', history: 'Reyes en el Norte.' }
  },
  lannister: {
    id: 'lannister',
    characters: [
        { id: 'tywin', name: 'Tywin', title: 'Mano del Rey', wikiSlug: 'Tywin_Lannister', imageUrl: 'https://awoiaf.westeros.org/images/thumb/e/e1/Tywin_Lannister_Amoka.jpg/300px-Tywin_Lannister_Amoka.jpg', generation: 1, x: -1, house: 'lannister', birthYear: '242 AC', deathYear: '300 AC', status: 'dead' },
    ],
    connections: [],
    rootId: 'tywin',
    theme: { name: 'Casa Lannister', config: COLOR_THEMES.gold, motto: '¡Oye mi Rugido!', seat: 'Roca Casterly', history: 'Señores de Roca Casterly.' }
  },
  baratheon: {
    id: 'baratheon',
    characters: [
        { id: 'robert', name: 'Robert I', title: 'Rey', wikiSlug: 'Robert_Baratheon', imageUrl: 'https://awoiaf.westeros.org/images/thumb/d/d4/Robert_Baratheon_Amoka.jpg/300px-Robert_Baratheon_Amoka.jpg', generation: 1, x: 0, isKing: true, house: 'baratheon', birthYear: '262 AC', deathYear: '298 AC', status: 'dead' },
    ],
    connections: [],
    rootId: 'robert',
    theme: { name: 'Casa Baratheon', config: COLOR_THEMES.gold, motto: 'Nuestra es la Furia', seat: 'Bastión de Tormentas', history: 'Señores de las Tierras de la Tormenta.' }
  },
  velaryon: {
    id: 'velaryon',
    characters: [
        { id: 'corlys', name: 'Corlys', title: 'La Serpiente Marina', wikiSlug: 'Corlys_Velaryon', imageUrl: 'https://awoiaf.westeros.org/images/thumb/6/61/Corlys_Velaryon_The_Sea_Snake.jpg/300px-Corlys_Velaryon_The_Sea_Snake.jpg', generation: 1, x: 0, house: 'velaryon', birthYear: '53 AC', status: 'dead' },
    ],
    connections: [],
    rootId: 'corlys',
    theme: { name: 'Casa Velaryon', config: COLOR_THEMES.cyan, motto: 'El Viejo, el Verdadero, el Valiente', seat: 'Marea Alta', history: 'Antigua y orgullosa casa noble de ascendencia Valyria, famosa por su dominio de los mares.' }
  },
  hightower: {
    id: 'hightower',
    characters: [
        { id: 'otto', name: 'Otto Hightower', title: 'Mano del Rey', wikiSlug: 'Otto_Hightower', imageUrl: 'https://awoiaf.westeros.org/images/thumb/7/70/Otto_Hightower_Amoka.jpg/300px-Otto_Hightower_Amoka.jpg', generation: 1, x: 0, house: 'hightower', birthYear: '76 AC', status: 'dead' },
    ],
    connections: [],
    rootId: 'otto',
    theme: { name: 'Casa Hightower', config: COLOR_THEMES.green, motto: 'Iluminamos el Camino', seat: 'El Faro', history: 'Protectores de la Ciudadela.' }
  }
};

// --- COMPONENTES AUXILIARES ---

const Modal = ({ isOpen, onClose, title, children, accentClass }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`bg-stone-900 border-2 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-stone-600`}>
        <div className={`flex justify-between items-center p-4 border-b border-stone-700 bg-stone-950`}>
          <h3 className={`text-xl font-cinzel font-bold text-stone-200 tracking-wide`}>{title}</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 bg-stone-900 max-h-[85vh] overflow-y-auto custom-scrollbar text-stone-300">
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

        const parentX = parents.reduce((sum, p) => sum + (p.x * X_SPACING), 0) / parents.length + CARD_WIDTH/2;
        const parentY = parents[0].generation * Y_SPACING + CARD_HEIGHT;

        return (
          <g key={conn.id}>
             {/* Línea horizontal entre padres (parejas) */}
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
            {/* Líneas hacia hijos - Curvas Bezier elegantes */}
            {children.map(child => {
              const childX = (child.x * X_SPACING) + CARD_WIDTH / 2;
              const childY = child.generation * Y_SPACING;
              const startX = parentX; 
              const startY = parentY;
              const midY = startY + (childY - startY) / 2;
              const isBastardLine = child.isBastard;

              return (
                <path
                  key={`${conn.id}-${child.id}`}
                  d={`M ${startX} ${startY} C ${startX} ${midY}, ${childX} ${midY}, ${childX} ${childY}`}
                  fill="none" stroke="#71717a" strokeWidth={isBastardLine ? "2" : "3"} 
                  strokeDasharray={isBastardLine ? "8,6" : "none"} className="opacity-70"
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
  const [isHouseMenuOpen, setIsHouseMenuOpen] = useState(false);

  // Fallback Logic
  const currentData = datasets[activeTab] || INITIAL_DATASETS.targaryen;
  
  const theme = {
      ...currentData.theme,
      seat: currentData.theme.seat || (INITIAL_DATASETS[activeTab] ? INITIAL_DATASETS[activeTab]?.theme?.seat : ''),
      history: currentData.theme.history || (INITIAL_DATASETS[activeTab] ? INITIAL_DATASETS[activeTab]?.theme?.history : '')
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
    name: string; title: string; house: string; isKing: boolean; isBastard: boolean; isNonCanon: boolean; isDragonRider: boolean; dragonName: string; isGap: boolean; imageUrl: string;
    birthYear: string; deathYear: string; lore: string; status: CharacterStatus;
    newHouseName: string; newHouseColor: string; newHouseCustomColor: string;
  }>({ 
    name: '', title: '', house: 'targaryen', isKing: false, isBastard: false, isNonCanon: false, isDragonRider: false, dragonName: '', isGap: false, imageUrl: '',
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

  // AUTH
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      const token = (window as any).__initial_auth_token;
      if (token) {
        await signInWithCustomToken(auth, token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // DATA SYNC
  useEffect(() => {
    if (!user || !db) return;
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
    if (!user || !db) return;
    setIsSaving(true);
    try {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'houses', house.id), house);
    } catch (e) {
        console.error("Error saving house:", e);
    } finally {
        setIsSaving(false);
    }
  };

  // ACTIONS
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
    setNewHouseForm({ name: '', color: 'red', customColor: '', founder: 'Fundador', sigilUrl: '', motto: '', isExtinct: false, seat: '', history: '' });
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
                    isKing: formData.isKing, isBastard: formData.isBastard, isNonCanon: formData.isNonCanon, isDragonRider: formData.isDragonRider, dragonName: formData.dragonName, isGap: formData.isGap,
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
                    generation: newGen, x: newX, house: targetHouseId, isKing: formData.isKing, isBastard: formData.isBastard, isNonCanon: formData.isNonCanon, isDragonRider: formData.isDragonRider, dragonName: formData.dragonName, isGap: formData.isGap,
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
         setFormData({ name: '', title: '', house: activeTab, isKing: false, isBastard: false, isNonCanon: false, isDragonRider: false, dragonName: '', isGap: false, imageUrl: '', birthYear: '', deathYear: '', lore: '', status: 'alive', newHouseName: '', newHouseColor: 'black', newHouseCustomColor: '' });
         return;
    }
    const char = characters.find(c => c.id === charId);
    if (mode === 'edit' && char) {
        setFormData({ 
            name: char.name, title: char.title, house: char.house || activeTab, 
            isKing: !!char.isKing, isBastard: !!char.isBastard, isNonCanon: !!char.isNonCanon, isDragonRider: !!char.isDragonRider, dragonName: char.dragonName || '', isGap: !!char.isGap,
            imageUrl: char.imageUrl || '', birthYear: char.birthYear || '', deathYear: char.deathYear || '', lore: char.lore || '', status: char.status || 'alive',
            newHouseName: '', newHouseColor: 'black', newHouseCustomColor: ''
        });
    } else {
        setFormData({ name: '', title: '', house: activeTab, isKing: false, isBastard: false, isNonCanon: false, isDragonRider: false, dragonName: '', isGap: false, imageUrl: '', birthYear: '', deathYear: '', lore: '', status: 'alive', newHouseName: '', newHouseColor: 'black', newHouseCustomColor: '' });
    }
    setActiveMenu(null);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-gray-200 overflow-hidden font-sans select-none relative">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lato:wght@300;400;700&display=swap');.font-cinzel { font-family: 'Cinzel', serif; } .font-lato { font-family: 'Lato', sans-serif; }`}</style>
      
      {/* HEADER & UI */}
      <div className={`absolute top-0 left-0 w-full z-50 bg-gradient-to-b p-0 pb-12 pointer-events-none transition-colors duration-500`} style={theme.customColor ? { background: `linear-gradient(to bottom, ${theme.customColor}E6, transparent)` } : undefined}>
         {!theme.customColor && <div className={`absolute inset-0 bg-gradient-to-b ${themeConfig.bgGradient} -z-10`} />}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 pointer-events-auto gap-4">
             <div className="flex items-center gap-6 group">
                 {/* SIGIL */}
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-black/40 backdrop-blur-md border-2 shadow-lg overflow-hidden shrink-0 relative`} style={{ borderColor: theme.customColor || undefined }}>
                    {!theme.customColor && <div className={`absolute inset-0 border-2 ${themeConfig.borderColor} opacity-50 rounded-xl pointer-events-none`} />}
                    {theme.sigilUrl ? <img src={theme.sigilUrl} alt="" className="w-full h-full object-cover" /> : (currentData.isExtinct ? <ShieldOff size={28} className="opacity-90 drop-shadow-lg text-zinc-500" /> : <Shield size={28} className="opacity-90 drop-shadow-lg" style={{ color: theme.customColor || undefined }} />)}
                    {!theme.customColor && !theme.sigilUrl && !currentData.isExtinct && <Shield size={28} className={`opacity-90 drop-shadow-lg ${themeConfig.accentColor}`} />}
                 </div>
                 {/* TITLE */}
                 <div>
                    <h1 className={`text-2xl font-cinzel font-bold tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-colors duration-300 flex items-center gap-3`} style={{ color: theme.customColor }}>
                        {!theme.customColor && <span className={themeConfig.textColor}>{theme.name}</span>}
                        {theme.customColor && theme.name}
                        <button onClick={() => { 
                             const colorKey = Object.keys(COLOR_THEMES).find(k => COLOR_THEMES[k].accentColor === themeConfig.accentColor) || 'black';
                             let founderName = '';
                             if (currentData.rootId) { const root = characters.find(c => c.id === currentData.rootId); if(root) founderName = root.name; }
                             setNewHouseForm({ name: theme.name, color: colorKey, customColor: theme.customColor || '', founder: founderName, sigilUrl: theme.sigilUrl || '', motto: theme.motto || '', isExtinct: !!currentData.isExtinct, seat: theme.seat || '', history: theme.history || '' });
                             setModalMode('edit-house');
                        }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-opacity"><Edit2 size={16}/></button>
                    </h1>
                    <div className="text-zinc-300 text-xs mt-0.5 italic font-cinzel tracking-wider flex items-center gap-2 opacity-80 group/seat cursor-help relative">
                        <span className="w-8 h-px bg-zinc-500/50 inline-block"/>
                        {theme.motto ? `"${theme.motto}"` : (currentData.isExtinct ? "Casa Extinta" : "Editor de Linaje")}
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
                                onClick={() => { setModalMode('create-house'); setIsHouseMenuOpen(false); }} 
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

      {/* FIXED BOTTOM LEFT BUTTONS */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
           <button onClick={() => setShowLegend(true)} className="bg-zinc-900/90 hover:bg-zinc-800 px-4 py-2.5 rounded-lg text-xs border border-zinc-700 flex items-center gap-2 text-zinc-300 font-cinzel shadow-xl backdrop-blur-sm transition-all hover:scale-105"><HelpCircle size={16}/> Leyenda</button>
           <button onClick={() => centerView()} className="bg-zinc-900/90 hover:bg-zinc-800 px-4 py-2.5 rounded-lg text-xs border border-zinc-700 flex items-center gap-2 text-zinc-300 font-cinzel shadow-xl backdrop-blur-sm transition-all hover:scale-105"><Move size={16}/> Centrar</button>
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
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#555 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
           </div>
           
           <ConnectionLines characters={characters} connections={connections} />

           {characters.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="pointer-events-auto text-center"><h2 className="text-2xl font-cinzel font-bold text-zinc-500 mb-4">Vacío</h2><button onClick={() => setModalMode('add-root')} className="px-6 py-3 rounded-lg bg-zinc-800 text-white font-cinzel border border-zinc-600">Crear Primer Personaje</button></div>
                </div>
           )}

           {characters.map((char) => (
             <div key={char.id}
                // --- DISEÑO "CARTA" ---
                className={`absolute rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] group transition-all duration-300
                    ${char.isGap ? 'w-[60px] h-[60px] rounded-full border-dashed border-2 border-zinc-600 bg-black/50 flex items-center justify-center' : ''}
                    ${!char.isGap ? 'border border-zinc-700 bg-zinc-900 overflow-visible' : ''}
                    ${char.house === activeTab ? (theme.customColor ? '' : themeConfig.borderColor) : 'border-zinc-700 opacity-80 hover:opacity-100'}
                    ${char.isKing && char.house === activeTab && !theme.customColor ? themeConfig.glowColor : ''}
                    ${activeMenu === char.id ? 'z-[60]' : (draggingNode === char.id ? 'z-[100] scale-105 ring-2 ring-white/20 cursor-grabbing' : 'z-10 hover:z-50 hover:scale-[1.02] cursor-grab')}
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
                        {char.lore && (
                            <div className="absolute top-2 left-2 z-20 group/lore pointer-events-auto">
                                <BookOpen size={16} className="text-zinc-400 hover:text-white cursor-help drop-shadow-md"/>
                                <div className="absolute left-0 top-6 w-56 bg-zinc-950 border border-zinc-700 p-3 rounded text-xs text-zinc-300 shadow-xl opacity-0 group-hover/lore:opacity-100 pointer-events-none transition-opacity font-lato leading-relaxed z-50">{char.lore}</div>
                            </div>
                        )}

                        {/* --- TEXTO (Sobrepuesto abajo) --- */}
                        <div className="absolute bottom-0 left-0 w-full p-4 z-10 bg-gradient-to-t from-black/90 to-transparent pt-8 rounded-b-xl">
                            <h3 className={`font-cinzel font-bold text-lg leading-tight text-white drop-shadow-md ${char.isNonCanon ? 'italic text-amber-200' : ''}`}>{char.name}</h3>
                            <p className="text-xs text-zinc-400 italic font-lato line-clamp-1">{char.title}</p>
                            {(char.birthYear || char.deathYear) && <div className="text-[10px] text-zinc-500 mt-1 font-mono">{char.birthYear || '?'} - {char.deathYear || '?'}</div>}
                        </div>
                        
                        {/* --- LINK A OTRA CASA (Top Right - Debajo de los 3 puntos) --- */}
                        {char.house && char.house !== activeTab && datasets[char.house] && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); navigateToCharacterHouse(char); }} 
                                className="absolute top-10 right-2 z-30 p-1.5 bg-black/60 hover:bg-zinc-800 rounded-full text-zinc-400 border border-zinc-700/50 transition-colors pointer-events-auto no-drag"
                                title={`Ver casa: ${datasets[char.house].theme.name}`}
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
                                <button onClick={() => openModalWrapper('edit', char.id)} className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"><Edit2 size={12}/> Editar</button>
                                <div className="h-px bg-zinc-800"/>
                                <button onClick={() => openModalWrapper('add-child', char.id)} className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"><Plus size={12}/> Hijo</button>
                                <button onClick={() => openModalWrapper('add-parent', char.id)} className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"><UserPlus size={12}/> Padre</button>
                                <button onClick={() => openModalWrapper('add-partner', char.id)} className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"><HeartPulse size={12}/> Pareja</button>
                                <div className="h-px bg-zinc-800"/>
                            </>
                        )}
                        <button onClick={() => deleteCharacter(char.id)} className="w-full text-left px-3 py-2 hover:bg-red-900/30 text-red-400 flex items-center gap-2"><Trash2 size={12}/> {char.isGap ? "Eliminar Gap" : "Eliminar"}</button>
                    </div>
                )}
             </div>
           ))}
        </div>
      </div>

      {/* --- ALL MODALS (Legend, Create House, Edit Character, Delete Confirm, Alert) --- */}
      <Modal isOpen={showLegend} onClose={() => setShowLegend(false)} title="Simbología" accentClass={themeConfig.accentColor}>
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
                  <button key={colorKey} type="button" onClick={() => setNewHouseForm({...newHouseForm, color: colorKey, customColor: ''})} className={`w-6 h-6 rounded-full border-2 transition-all ${newHouseForm.color === colorKey && !newHouseForm.customColor ? 'border-white scale-110' : 'border-transparent opacity-50'}`} style={{ backgroundColor: colorKey === 'gold' ? '#ca8a04' : colorKey }} />
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
            <input type="text" placeholder="Nombre" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required={!isLinkingExisting} />
            <input type="text" placeholder="Título" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <input type="url" placeholder="URL Imagen" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
            <div className="flex gap-2">
                <input type="text" placeholder="Nacimiento" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white flex-1" value={formData.birthYear} onChange={e => setFormData({...formData, birthYear: e.target.value})} />
                <input type="text" placeholder="Muerte" className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white flex-1" value={formData.deathYear} onChange={e => setFormData({...formData, deathYear: e.target.value})} />
            </div>
            <textarea placeholder="Lore..." className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white h-20" value={formData.lore} onChange={e => setFormData({...formData, lore: e.target.value})} />
            <div className="flex gap-4 items-center">
                <select className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white flex-1" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as CharacterStatus})}>
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
                    {getAllCharacters().filter(c => c.id !== selectedCharId).map(c => (
                        <div key={c.id} onClick={() => setLinkCharId(c.id)} className={`p-2 cursor-pointer hover:bg-zinc-800 ${linkCharId === c.id ? 'bg-zinc-700' : ''}`}>
                            {c.name}
                        </div>
                    ))}
                </div>
            )}
            
            {['add-child', 'add-parent', 'add-partner'].includes(modalMode || '') && (
                 <div className="flex bg-zinc-950 p-1 rounded-lg mb-2 border border-zinc-800">
                    <button type="button" onClick={(e) => { e.preventDefault(); setIsLinkingExisting(false); }} className={`flex-1 text-xs py-1.5 rounded-md ${!isLinkingExisting ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Crear Nuevo</button>
                    <button type="button" onClick={(e) => { e.preventDefault(); setIsLinkingExisting(true); }} className={`flex-1 text-xs py-1.5 rounded-md ${isLinkingExisting ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Vincular Existente</button>
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