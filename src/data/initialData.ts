import { HouseData } from '../types';
import { COLOR_THEMES } from '../constants/theme';

export const INITIAL_DATASETS: Record<string, HouseData> = {
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
