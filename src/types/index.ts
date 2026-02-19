export type CharacterStatus = 'alive' | 'dead' | 'missing' | 'unknown';

export type Character = {
  id: string;
  name: string;
  title: string;
  wikiSlug: string;
  imageUrl?: string;
  artistName?: string;
  artistLink?: string;
  generation: number;
  x: number;
  isKing?: boolean;
  isBastard?: boolean;
  isNonCanon?: boolean;
  isDragonRider?: boolean;
  isDisputed?: boolean;
  disputedParentageLore?: string;
  dragonName?: string;
  isGap?: boolean;
  house?: string;
  birthYear?: string;
  deathYear?: string;
  lore?: string;
  wikiLink?: string;
  status?: CharacterStatus;
};

export type Connection = {
  id: string;
  parents: string[];
  children: string[];
};

export type ThemeConfig = {
    bgGradient: string;
    accentColor: string;
    textColor: string;
    buttonBg: string;
    borderColor: string;
    glowColor: string;
};

export type HouseData = {
  id: string;
  characters: Character[];
  connections: Connection[];
  rootId?: string;
  isExtinct?: boolean;
  theme: {
    name: string;
    config: ThemeConfig;
    sigilUrl?: string;
    sigilDescription?: string;
    motto?: string;
    customColor?: string;
    seat?: string;
    history?: string;
  };
};

export type TimelineEvent = {
  id: string;
  title: string;
  startYear: number;
  endYear: number;
  color: string;
  description?: string;
};
