
export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type Vector2 = {
  x: number;
  y: number;
};

export enum EntityType {
  PLAYER = 'player',
  MONSTER = 'monster',
  NPC = 'npc',
}

export enum PlayerClass {
  WARRIOR = 'warrior',
  MAGE = 'mage',
  ARCHER = 'archer',
  PRIEST = 'priest',
}

export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  HELMET = 'helmet',
  BOOTS = 'boots',
  ACCESSORY = 'accessory',
  CONSUMABLE = 'consumable',
  MATERIAL = 'material',
}

export interface EntityState {
  id: string;
  type: EntityType;
  position: Vector3;
  rotation: Vector3;
  velocity: Vector3;
  animation: string;
  health: number;
  maxHealth: number;
  speed: number;
}

export interface PlayerState extends EntityState {
  name: string;
  level: number;
  playerClass: PlayerClass;
  exp: number;
  gold: number;
  diamond: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
}

export interface MonsterState extends EntityState {
  monsterId: number;
  name: string;
  level: number;
  attack: number;
  defense: number;
  expReward: number;
  goldReward: number;
}

export interface NPCState extends EntityState {
  npcId: number;
  name: string;
  dialogue: string[];
}

export interface ItemSlot {
  itemId: number;
  quantity: number;
  bound: boolean;
}

export interface ItemData {
  id: number;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  icon: string;
  tradable: boolean;
  stackable: boolean;
  maxStack: number;
  stats?: {
    attack?: number;
    defense?: number;
    health?: number;
    mana?: number;
    speed?: number;
  };
  levelReq?: number;
}

export interface SkillData {
  id: number;
  name: string;
  description: string;
  icon: string;
  damage: number;
  cooldown: number;
  manaCost: number;
  range: number;
  castTime: number;
  targetType: 'single' | 'area' | 'self';
}

export interface SkillState {
  skillId: number;
  level: number;
  currentCooldown: number;
}

export interface ChunkData {
  x: number;
  z: number;
  terrain: number[][];
  objects: ChunkObject[];
}

export interface ChunkObject {
  id: string;
  type: string;
  position: Vector3;
  rotation: Vector3;
  scale?: Vector3;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  channel: 'world' | 'guild' | 'team' | 'private';
  content: string;
  timestamp: number;
}

export interface AuctionOrder {
  id: string;
  sellerId: string;
  sellerName: string;
  itemId: number;
  itemName: string;
  quantity: number;
  price: number;
  expireTime: number;
  timestamp: number;
}

export interface TeamData {
  id: string;
  leaderId: string;
  members: TeamMember[];
  maxMembers: number;
}

export interface TeamMember {
  playerId: string;
  playerName: string;
  level: number;
  playerClass: PlayerClass;
  health: number;
  maxHealth: number;
}

export interface WorldBossState {
  bossId: number;
  name: string;
  level: number;
  health: number;
  maxHealth: number;
  position: Vector3;
  respawnTime: number;
  isAlive: boolean;
}

export type RankEntry = {
  rank: number;
  playerId: string;
  playerName: string;
  level: number;
  value: number;
};

export type RankType = 'level' | 'combat' | 'wealth' | 'boss_damage';
