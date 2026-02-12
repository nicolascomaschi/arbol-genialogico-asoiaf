import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { HelpCircle, Move, RotateCcw, RotateCw, Wand2 } from 'lucide-react';
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

import { auth, db } from './services/firebase';
import { Character, HouseData, CharacterStatus, Connection } from './types';
import { COLOR_THEMES } from './constants/theme';
import { INITIAL_DATASETS } from './data/initialData';
import {
  CARD_WIDTH, X_SPACING, Y_SPACING, CANVAS_SIZE, APP_ID
} from './constants/config';
import { useUndoRedo } from './hooks/useUndoRedo';
import { calculateAutoLayout } from './utils/layout';
import { parseYear } from './utils/date';

import ConnectionLines from './components/ConnectionLines';
import CharacterNode from './components/CharacterNode';
import TimelineControls from './components/TimelineControls';
import Header from './components/Header';
import LegendModal from './components/LegendModal';
import HouseModal from './components/HouseModal';
import CharacterModal from './components/CharacterModal';
import Modal from './components/Modal';

// --- COMPONENTE PRINCIPAL (APP) ---

export default function App() {
  const [user, setUser] = useState<any>(null);

  // Undo/Redo Hook
  const {
    state: datasets,
    set: setDatasets,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetDatasets
  } = useUndoRedo<Record<string, HouseData>>(INITIAL_DATASETS);

  // Keep a ref of datasets to avoid stale closures in snapshot listeners
  const datasetsRef = useRef(datasets);
  useEffect(() => {
    datasetsRef.current = datasets;
  }, [datasets]);

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

  // Timeline & Filters
  const [timelineYear, setTimelineYear] = useState<number | null>(null);
  const [showDragonRiders, setShowDragonRiders] = useState(false);
  const [showKings, setShowKings] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Fallback Logic
  const currentData = datasets[activeTab] || INITIAL_DATASETS.targaryen;
  
  const theme = useMemo(() => ({
      ...currentData.theme,
      seat: currentData.theme.seat || (INITIAL_DATASETS[activeTab] ? INITIAL_DATASETS[activeTab]?.theme?.seat : ''),
      history: currentData.theme.history || (INITIAL_DATASETS[activeTab] ? INITIAL_DATASETS[activeTab]?.theme?.history : '')
  }), [currentData.theme, activeTab]);

  const characters = currentData.characters;
  const connections = currentData.connections;

  // Collapsing Logic
  const hiddenNodes = useMemo(() => {
    const hidden = new Set<string>();
    if (collapsedNodes.size === 0) return hidden;

    const queue = Array.from(collapsedNodes);
    const processed = new Set<string>();

    // Build a quick map of parent -> children
    const childrenMap: Record<string, string[]> = {};
    connections.forEach(conn => {
        conn.parents.forEach(p => {
            if (!childrenMap[p]) childrenMap[p] = [];
            childrenMap[p].push(...conn.children);
        });
    });

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (processed.has(currentId)) continue;
        processed.add(currentId);

        const children = childrenMap[currentId] || [];
        children.forEach(childId => {
            hidden.add(childId);
            queue.push(childId);
        });
    }
    return hidden;
  }, [collapsedNodes, connections]);

  const visibleCharacters = useMemo(() => {
      return characters.filter(c => !hiddenNodes.has(c.id));
  }, [characters, hiddenNodes]);

  const visibleConnections = useMemo(() => {
      return connections.filter(conn => {
          // Check visible participants
          const visibleChildren = conn.children.filter(c => !hiddenNodes.has(c));
          const visibleParents = conn.parents.filter(p => !hiddenNodes.has(p));

          // Show connection if:
          // 1. There is at least one visible child.
          // 2. OR there are visible parents (more than 1 parent usually means a partner connection, which we want to show even if no children).

          if (visibleChildren.length > 0) return true;
          if (visibleParents.length > 1) return true;

          return false;
      });
  }, [connections, hiddenNodes]);


  const toggleCollapse = useCallback((charId: string) => {
      setCollapsedNodes(prev => {
          const next = new Set(prev);
          if (next.has(charId)) {
              next.delete(charId);
          } else {
              next.add(charId);
          }
          return next;
      });
  }, []);

  const themeConfig = useMemo(() => theme.config || COLOR_THEMES.black, [theme.config]);

  const timelineBounds = useMemo(() => {
    const years = characters.flatMap(c => [
        parseYear(c.birthYear),
        parseYear(c.deathYear)
    ]).filter((y): y is number => y !== null);

    if (years.length === 0) return { min: -100, max: 300 };
    return {
        min: Math.min(...years) - 10,
        max: Math.max(...years) + 10
    };
  }, [characters]);

  const isNodeDimmed = useCallback((char: Character) => {
    if (showDragonRiders && !char.isDragonRider) return true;
    if (showKings && !char.isKing) return true;

    if (timelineYear !== null) {
        const birth = parseYear(char.birthYear);
        const death = parseYear(char.deathYear);
        if (birth !== null && birth > timelineYear) return true;
        if (death !== null && death < timelineYear) return true;
    }
    return false;
  }, [showDragonRiders, showKings, timelineYear]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.8);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const isFirstDragMove = useRef(false);

  const [modalMode, setModalMode] = useState<'add-child' | 'add-parent' | 'add-partner' | 'edit' | 'create-house' | 'edit-house' | 'add-root' | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    name: string; title: string; house: string; isKing: boolean; isBastard: boolean; isNonCanon: boolean; isDragonRider: boolean; dragonName: string; isGap: boolean; imageUrl: string; wikiLink: string;
    birthYear: string; deathYear: string; lore: string; status: CharacterStatus | string;
    newHouseName: string; newHouseColor: string; newHouseCustomColor: string;
  }>({ 
    name: '', title: '', house: 'targaryen', isKing: false, isBastard: false, isNonCanon: false, isDragonRider: false, dragonName: '', isGap: false, imageUrl: '', wikiLink: '',
    birthYear: '', deathYear: '', lore: '', status: 'alive',
    newHouseName: '', newHouseColor: 'black', newHouseCustomColor: ''
  });
  
  const [isLinkingExisting, setIsLinkingExisting] = useState(false);
  const [linkCharId, setLinkCharId] = useState<string>('');
  const [newHouseForm, setNewHouseForm] = useState<{
    name: string; color: string; customColor: string; founder: string;
    sigilUrl: string; sigilDescription?: string; motto: string; isExtinct: boolean; seat: string; history: string;
  }>({
    name: '', color: 'red', customColor: '', founder: 'Fundador', 
    sigilUrl: '', sigilDescription: '', motto: '', isExtinct: false, seat: '', history: ''
  });
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // AUTH
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
        if (u) {
            setUser(u);
        } else {
            const token = (window as any).__initial_auth_token;
            if (token) {
                signInWithCustomToken(auth, token).catch(console.error);
            } else {
                signInAnonymously(auth).catch(console.error);
            }
        }
    });
    return () => unsubscribe();
  }, []);

  // DATA SYNC
  useEffect(() => {
    if (!user || !db) return;
    const housesRef = collection(db, 'artifacts', APP_ID, 'users', user.uid, 'houses');
    const unsubscribe = onSnapshot(housesRef, (snapshot) => {
      // Ignore local writes (latency compensation) to preserve undo history
      if (snapshot.metadata.hasPendingWrites) return;

      if (!snapshot.empty) {
        const loadedDatasets: Record<string, HouseData> = {};
        snapshot.forEach(doc => {
          loadedDatasets[doc.id] = doc.data() as HouseData;
        });

        // Only update if data has actually changed to avoid clearing undo history unnecessarily
        // This handles the case where the server confirms our own write (which we already have)
        const merged = { ...datasetsRef.current, ...loadedDatasets };
        if (JSON.stringify(merged) !== JSON.stringify(datasetsRef.current)) {
            resetDatasets(merged);
        }
      }
    });
    return () => unsubscribe();
  }, [user, resetDatasets]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
        e.preventDefault();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        if (canRedo) redo();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);


  const saveHouseToDb = async (house: HouseData) => {
    if (!user || !db) return;
    setIsSaving(true);
    try {
        await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'houses', house.id), house);
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

  const applyAutoLayout = (characters: Character[], connections: Connection[]) => {
      return calculateAutoLayout(characters, connections);
  };

  const handleAutoLayout = () => {
    setDatasets(prev => {
      const currentHouse = prev[activeTab];
      if (!currentHouse) return prev;

      const newCharacters = applyAutoLayout(currentHouse.characters, currentHouse.connections);
      const updatedHouse = { ...currentHouse, characters: newCharacters };
      saveHouseToDb(updatedHouse);

      return { ...prev, [activeTab]: updatedHouse };
    });
  };

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

  const navigateToCharacterHouse = useCallback((char: Character) => {
    if (!datasets[char.house || '']) {
        setAlertInfo({ title: "Casa no disponible", message: "Esta casa no tiene su propia pestaña activa." });
        return;
    }
    setActiveTab(char.house!);
    setFocusTarget(char.id);
    setSearchQuery(''); setIsSearchOpen(false);
  }, [datasets]);

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

  const handleNodeDragStart = useCallback((e: React.MouseEvent, charId: string) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('.no-drag')) return;
    e.stopPropagation(); e.preventDefault();
    setDraggingNode(charId); setActiveMenu(null);
    isFirstDragMove.current = true;
  }, []);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    setActiveMenu(null);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNode) {
      const deltaX = e.movementX / scale;
      const deltaY = e.movementY / scale;

      // Use replace: true for subsequent moves to avoid filling history with intermediate states
      const shouldReplace = !isFirstDragMove.current;

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
      }, { replace: shouldReplace });

      isFirstDragMove.current = false;
    } else if (isPanning) {
      setPosition({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [draggingNode, isPanning, panStart, scale, activeTab, setDatasets]);

  const handleMouseUp = () => {
    if (draggingNode && datasets[activeTab]) saveHouseToDb(datasets[activeTab]);
    setIsPanning(false); setDraggingNode(null);
  };

  const deleteCharacter = useCallback((id: string) => { setDeleteTargetId(id); setActiveMenu(null); }, []);

  const handleUnlink = useCallback((targetId: string, role: 'parent' | 'child' | 'partner') => {
      if (!selectedCharId) return;
      const sourceId = selectedCharId;

      setDatasets(prev => {
          const next = { ...prev };
          let changed = false;

          Object.keys(next).forEach(houseId => {
              const house = next[houseId];
              let houseChanged = false;

              let newConnections = house.connections.map(conn => {
                  let newConn = { ...conn };
                  let modified = false;

                  // Partner: Remove target from parents if source is also a parent
                  if (role === 'partner') {
                      if (conn.parents.includes(sourceId) && conn.parents.includes(targetId)) {
                          newConn.parents = conn.parents.filter(id => id !== targetId);
                          modified = true;
                      }
                  }
                  // Parent: Remove target from parents if source is a child
                  else if (role === 'parent') {
                      if (conn.parents.includes(targetId) && conn.children.includes(sourceId)) {
                          newConn.parents = conn.parents.filter(id => id !== targetId);
                          modified = true;
                      }
                  }
                  // Child: Remove target from children if source is a parent
                  else if (role === 'child') {
                      if (conn.parents.includes(sourceId) && conn.children.includes(targetId)) {
                          newConn.children = conn.children.filter(id => id !== targetId);
                          modified = true;
                      }
                  }

                  if (modified) {
                      houseChanged = true;
                      return newConn;
                  }
                  return conn;
              }).filter(conn => {
                  // Cleanup invalid connections
                  if (conn.parents.length === 0) return false; // No parents
                  if (conn.children.length === 0 && conn.parents.length < 2) return false; // Single parent no kids (useless line)
                  return true;
              });

              if (houseChanged) {
                 // For unlinking, we do NOT trigger auto-layout automatically anymore,
                 // as it disrupts manual organization. User can trigger it manually.
                 next[houseId] = { ...house, connections: newConnections };
                 saveHouseToDb(next[houseId]);
                 changed = true;
              }
          });

          return changed ? next : prev;
      });
  }, [selectedCharId, setDatasets]);

  const executeDeleteCharacter = () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDatasets(prev => {
        const currentHouse = prev[activeTab];
        const newConnections = currentHouse.connections.map(conn => ({
                ...conn,
                parents: conn.parents.filter(p => p !== id),
                children: conn.children.filter(c => c !== id)
            })).filter(conn => conn.parents.length > 0 || conn.children.length > 0);

        const remainingChars = currentHouse.characters.filter(c => c.id !== id);
        // NO AUTO LAYOUT ON DELETE

        const updatedHouse = {
            ...currentHouse,
            characters: remainingChars,
            connections: newConnections
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
      theme: {
          name: newHouseForm.name,
          config: themeConfig,
          sigilUrl: newHouseForm.sigilUrl,
          sigilDescription: newHouseForm.sigilDescription,
          motto: newHouseForm.motto,
          customColor: newHouseForm.customColor,
          seat: newHouseForm.seat,
          history: newHouseForm.history
      }
    };
    setDatasets(prev => ({ ...prev, [houseId]: newHouse }));
    saveHouseToDb(newHouse);
    setActiveTab(houseId);
    setModalMode(null);
    setNewHouseForm({ name: '', color: 'red', customColor: '', founder: 'Fundador', sigilUrl: '', sigilDescription: '', motto: '', isExtinct: false, seat: '', history: '' });
  };

  const handleEditHouseSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const themeConfig = COLOR_THEMES[newHouseForm.color] || COLOR_THEMES.black;
      setDatasets(prev => {
          const house = prev[activeTab];
          const updatedTheme = {
              ...prev[activeTab].theme,
              name: newHouseForm.name,
              config: themeConfig,
              sigilUrl: newHouseForm.sigilUrl,
              sigilDescription: newHouseForm.sigilDescription,
              motto: newHouseForm.motto,
              customColor: newHouseForm.customColor,
              seat: newHouseForm.seat,
              history: newHouseForm.history
          };
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
                    imageUrl: formData.imageUrl, wikiLink: formData.wikiLink, birthYear: formData.birthYear, deathYear: formData.deathYear, lore: formData.lore, status: formData.status as CharacterStatus
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
               // Verify if a connection between these two already exists
               const existingConn = updatedConns.find(c =>
                   c.parents.length === 2 &&
                   c.parents.includes(baseChar!.id) &&
                   c.parents.includes(targetId)
               );

               if (!existingConn) {
                   updatedConns.push({ id: `conn_${Date.now()}`, parents: [baseChar!.id, targetId], children: [] });
               }
            }

            // NO AUTO LAYOUT AUTOMATICALLY
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

             // Manual Positioning Logic
             let newGen = 1;
             let newX = 0;
             if (baseChar) {
                newGen = baseChar.generation;
                newX = baseChar.x;
                if (modalMode === 'add-child') {
                    newGen = baseChar.generation + 1;
                    newX += 0.5; // Slightly offset right
                }
                else if (modalMode === 'add-parent') {
                    newGen = baseChar.generation - 1;
                    newX += 0.5;
                }
                else if (modalMode === 'add-partner') {
                    newGen = baseChar.generation; // Same generation
                    newX += 1.2; // Next to partner
                }
             } else if (modalMode === 'add-root') {
                 newGen = 1;
                 newX = 0;
             }

             const newChar: Character = {
                    id: newId, name: formData.name, title: formData.title, wikiSlug: formData.name.replace(/\s+/g, '_'),
                    generation: newGen, x: newX, house: 'targaryen', isKing: formData.isKing, isBastard: formData.isBastard, isNonCanon: formData.isNonCanon, isDragonRider: formData.isDragonRider, dragonName: formData.dragonName, isGap: formData.isGap,
                    imageUrl: formData.imageUrl, wikiLink: formData.wikiLink, birthYear: formData.birthYear, deathYear: formData.deathYear, lore: formData.lore, status: formData.status as CharacterStatus
             };

             const targetHouseId = (formData.house === 'CREATE_NEW') ? formData.newHouseName.toLowerCase().replace(/\s+/g, '-') : formData.house;
             newChar.house = targetHouseId;

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

  const openModalWrapper = useCallback((mode: typeof modalMode, charId: string) => {
    setModalMode(mode); setSelectedCharId(charId); setIsLinkingExisting(false); setLinkCharId('');
    if (mode === 'add-root') {
         setFormData({ name: '', title: '', house: activeTab, isKing: false, isBastard: false, isNonCanon: false, isDragonRider: false, dragonName: '', isGap: false, imageUrl: '', wikiLink: '', birthYear: '', deathYear: '', lore: '', status: 'alive', newHouseName: '', newHouseColor: 'black', newHouseCustomColor: '' });
         return;
    }
    const char = characters.find(c => c.id === charId);
    if (mode === 'edit' && char) {
        setFormData({ 
            name: char.name, title: char.title, house: char.house || activeTab, 
            isKing: !!char.isKing, isBastard: !!char.isBastard, isNonCanon: !!char.isNonCanon, isDragonRider: !!char.isDragonRider, dragonName: char.dragonName || '', isGap: !!char.isGap,
            imageUrl: char.imageUrl || '', wikiLink: char.wikiLink || '', birthYear: char.birthYear || '', deathYear: char.deathYear || '', lore: char.lore || '', status: char.status || 'alive',
            newHouseName: '', newHouseColor: 'black', newHouseCustomColor: ''
        });
    } else {
        setFormData({ name: '', title: '', house: activeTab, isKing: false, isBastard: false, isNonCanon: false, isDragonRider: false, dragonName: '', isGap: false, imageUrl: '', wikiLink: '', birthYear: '', deathYear: '', lore: '', status: 'alive', newHouseName: '', newHouseColor: 'black', newHouseCustomColor: '' });
    }
    setActiveMenu(null);
  }, [activeTab, characters, activeMenu]);

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-gray-200 overflow-hidden font-sans select-none relative">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lato:wght@300;400;700&display=swap');.font-cinzel { font-family: 'Cinzel', serif; } .font-lato { font-family: 'Lato', sans-serif; }`}</style>
      
      <Header
        theme={theme}
        themeConfig={themeConfig}
        isSaving={isSaving}
        datasets={datasets}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isHouseMenuOpen={isHouseMenuOpen}
        setIsHouseMenuOpen={setIsHouseMenuOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        searchResults={searchResults}
        navigateToCharacterHouse={navigateToCharacterHouse}
        onOpenCreateHouse={() => setModalMode('create-house')}
        onEditHouse={() => {
            const colorKey = Object.keys(COLOR_THEMES).find(k => COLOR_THEMES[k].accentColor === themeConfig.accentColor) || 'black';
            let founderName = '';
            if (currentData.rootId) { const root = characters.find(c => c.id === currentData.rootId); if(root) founderName = root.name; }
            setNewHouseForm({
                name: theme.name,
                color: colorKey,
                customColor: theme.customColor || '',
                founder: founderName,
                sigilUrl: theme.sigilUrl || '',
                sigilDescription: theme.sigilDescription || '',
                motto: theme.motto || '',
                isExtinct: !!currentData.isExtinct,
                seat: theme.seat || '',
                history: theme.history || ''
            });
            setModalMode('edit-house');
        }}
        isExtinct={!!currentData.isExtinct}
      />

      {/* FIXED BOTTOM LEFT CONTROLS */}
      <div className="fixed bottom-6 left-6 z-[70]">
        <div className="bg-zinc-900/95 border border-zinc-700 rounded-2xl py-3 px-2 flex flex-col items-center gap-2 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl w-14 transition-all duration-300">

           <button
              onClick={undo}
              disabled={!canUndo}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all ${!canUndo ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Deshacer (Ctrl+Z)"
           >
              <RotateCcw size={20}/>
           </button>

           <button
              onClick={redo}
              disabled={!canRedo}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all ${!canRedo ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Rehacer (Ctrl+Y)"
           >
              <RotateCw size={20}/>
           </button>

           <div className="w-8 h-px bg-zinc-800 my-1" />

           <button onClick={handleAutoLayout} title="Auto-Layout" className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all">
              <Wand2 size={20}/>
           </button>

           <button onClick={() => setShowLegend(true)} title="Leyenda" className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all">
              <HelpCircle size={20}/>
           </button>

           <button onClick={() => centerView()} title="Centrar Vista" className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all">
              <Move size={20}/>
           </button>
        </div>
      </div>

      {/* FIXED BOTTOM RIGHT TIMELINE */}
      <div className="fixed bottom-6 right-6 z-[70] flex flex-col gap-2 w-16">
           <TimelineControls
                minYear={timelineBounds.min}
                maxYear={timelineBounds.max}
                currentYear={timelineYear}
                onYearChange={setTimelineYear}
                showDragonRiders={showDragonRiders}
                onToggleDragonRiders={() => setShowDragonRiders(prev => !prev)}
                showKings={showKings}
                onToggleKings={() => setShowKings(prev => !prev)}
                onReset={() => { setTimelineYear(null); setShowDragonRiders(false); setShowKings(false); }}
                className="mb-2"
           />
      </div>

      {/* CANVAS */}
      <div 
        className={`flex-1 w-full h-full relative overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        ref={containerRef}
      >
        <div style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transformOrigin: '0 0', width: `${CANVAS_SIZE}px`, height: `${CANVAS_SIZE}px` }} className="relative transition-transform duration-75 ease-linear">
           {/* Grid Background */}
           <div className={`absolute inset-0 opacity-100 pointer-events-none bg-[#0a0a0a] ${currentData.isExtinct ? 'grayscale brightness-50' : ''}`}>
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")` }}/>
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#555 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
           </div>
           
           <ConnectionLines
              characters={visibleCharacters}
              connections={visibleConnections}
              hoveredNode={hoveredNode}
           />

           {visibleCharacters.length === 0 && characters.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="pointer-events-auto text-center"><h2 className="text-2xl font-cinzel font-bold text-zinc-500 mb-4">Vacío</h2><button onClick={() => setModalMode('add-root')} className="px-6 py-3 rounded-lg bg-zinc-800 text-white font-cinzel border border-zinc-600">Crear Primer Personaje</button></div>
                </div>
           )}

           {visibleCharacters.map((char) => {
             const targetHouseName = (char.house && char.house !== activeTab && datasets[char.house])
                ? datasets[char.house].theme.name
                : null;
             const hasChildren = connections.some(conn => conn.parents.includes(char.id));

             return (
                 <CharacterNode
                    key={char.id}
                    char={char}
                    activeTab={activeTab}
                    theme={theme}
                    themeConfig={themeConfig}
                    draggingNode={draggingNode}
                    activeMenu={activeMenu}
                    targetHouseName={targetHouseName}
                    onNodeDragStart={handleNodeDragStart}
                    setActiveMenu={setActiveMenu}
                    onOpenModal={openModalWrapper as any}
                    onDelete={deleteCharacter}
                    onNavigate={navigateToCharacterHouse}
                    isDimmed={isNodeDimmed(char)}
                    setHoveredNode={setHoveredNode}
                    isCollapsed={collapsedNodes.has(char.id)}
                    toggleCollapse={toggleCollapse}
                    hasChildren={hasChildren}
                 />
             );
           })}
        </div>
      </div>

      <LegendModal
        isOpen={showLegend}
        onClose={() => setShowLegend(false)}
        themeConfig={themeConfig}
      />

      <HouseModal
        isOpen={['create-house', 'edit-house'].includes(modalMode || '')}
        onClose={() => setModalMode(null)}
        mode={modalMode as 'create-house' | 'edit-house'}
        themeConfig={themeConfig}
        formData={newHouseForm}
        setFormData={setNewHouseForm}
        onSubmit={modalMode === 'create-house' ? handleCreateHouseSubmit : handleEditHouseSubmit}
      />

      <CharacterModal
        isOpen={['add-child', 'add-parent', 'add-partner', 'edit', 'add-root'].includes(modalMode || '')}
        onClose={() => setModalMode(null)}
        mode={modalMode as any}
        themeConfig={themeConfig}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleModalSubmit}
        isLinkingExisting={isLinkingExisting}
        setIsLinkingExisting={setIsLinkingExisting}
        linkCharId={linkCharId}
        setLinkCharId={setLinkCharId}
        allCharacters={getAllCharacters()}
        datasets={datasets}
        selectedCharId={selectedCharId}
        onUnlink={handleUnlink}
      />

      {deleteTargetId && <Modal isOpen={true} onClose={() => setDeleteTargetId(null)} title="Eliminar" accentClass="text-red-500"><div className="text-white mb-4">¿Eliminar personaje?</div><button onClick={executeDeleteCharacter} className="bg-red-600 text-white px-4 py-2 rounded w-full">Confirmar</button></Modal>}
      {alertInfo && <Modal isOpen={true} onClose={() => setAlertInfo(null)} title={alertInfo.title} accentClass="text-yellow-500"><div className="text-white mb-4">{alertInfo.message}</div><button onClick={() => setAlertInfo(null)} className="bg-zinc-700 text-white px-4 py-2 rounded w-full">OK</button></Modal>}

    </div>
  );
}
