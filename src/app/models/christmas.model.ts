export interface Snowflake {
  element: HTMLDivElement;
  x: number;
  y: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
}

export interface ChristmasCard {
  id: number;
  theme: string;
  color: string;
  icon: string;
  title: string;
  message: string;
  decorations: string[];
}

export interface CalendarDay {
  day: number;
  isOpen: boolean;
  isLocked: boolean;
  isShaking: boolean;
  content: string;
  image: string;
  title: string;
  type: 'gift' | 'message' | 'song';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface CollectionMilestone {
  level: number;
  icon: string;
  name: string;
  description: string;
  isUnlocked: boolean;
  isClaimed: boolean;
  specialEffect?: boolean;
}
