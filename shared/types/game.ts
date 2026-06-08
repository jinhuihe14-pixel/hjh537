
export type Vector3 = {
  x: number;
  y: number;
  z: number;
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

export interface ItemSlot {
  itemId: number;
  quantity: number;
  bound: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  channel: string;
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
  riskTags?: TradeRiskTag[];
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

export interface GameMessage<T = any> {
  seq: number;
  success: boolean;
  data?: T;
  error?: string;
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

export enum BuildingType {
  HOUSE = 'house',
  DECORATION = 'decoration',
  FARM = 'farm',
  WORKSHOP = 'workshop',
  STORAGE = 'storage',
}

export interface BuildingConfig {
  id: number;
  name: string;
  type: BuildingType;
  description: string;
  icon: string;
  unlockLevel: number;
  buildTime: number;
  materials: { itemId: number; quantity: number }[];
  goldCost: number;
  size: { width: number; height: number };
  production?: {
    itemId: number;
    quantity: number;
    interval: number;
  };
  storageBonus?: number;
}

export interface PlacedBuilding {
  instanceId: string;
  buildingId: number;
  name: string;
  icon: string;
  position: { x: number; y: number };
  level: number;
  buildStartTime: number;
  buildEndTime: number;
  isBuilt: boolean;
  remainingBuildTime: number;
  lastCollectTime: number;
  readyToCollect: number;
}

export interface PlotData {
  id: number;
  unlocked: boolean;
  unlockCost: { gold?: number; itemId?: number; quantity?: number };
  building: PlacedBuilding | null;
  crop: CropData | null;
}

export interface CropData {
  cropId: number;
  plantTime: number;
  growTime: number;
  harvestTime: number;
  isReady: boolean;
  yield: number;
}

export interface HomelandData {
  ownerId: string;
  ownerName: string;
  level: number;
  exp: number;
  plots: PlotData[];
  buildings: PlacedBuilding[];
  crops: CropData[];
  decorationSlots: { x: number; y: number; buildingId: number }[];
  likes: number;
  visitors: string[];
  lastVisitTime: Record<string, number>;
  totalVisits: number;
}

export interface VisitRecord {
  visitorId: string;
  visitorName: string;
  visitTime: number;
  liked: boolean;
}

export enum VoiceChannelType {
  TEAM = 'team',
  PARTY = 'party',
}

export interface VoiceMember {
  playerId: string;
  playerName: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isLeader: boolean;
  joinTime: number;
}

export interface VoiceChannel {
  id: string;
  name: string;
  type: VoiceChannelType;
  ownerId: string;
  members: VoiceMember[];
  maxMembers: number;
  createdAt: number;
  allowAllSpeak: boolean;
}

export interface VoiceAuditLog {
  id: string;
  channelId: string;
  playerId: string;
  playerName: string;
  action: 'join' | 'leave' | 'mute' | 'unmute' | 'speak_violation';
  timestamp: number;
  detail?: string;
}

export interface VoiceFilterResult {
  safe: boolean;
  flaggedKeywords: string[];
}

export enum TradeRiskTag {
  NORMAL = 'normal',
  HIGH_PRICE = 'high_price',
  LOW_PRICE = 'low_price',
  EXTREME_PRICE = 'extreme_price',
  FREQUENT_TRADE = 'frequent_trade',
  STUDIO_SUSPECT = 'studio_suspect',
  MANUAL_REVIEW = 'manual_review',
  CROSS_SERVER = 'cross_server',
  FIRST_TRADE = 'first_trade',
  HIGH_VALUE = 'high_value',
}

export interface TradeLimitConfig {
  itemDailyLimit: number;
  itemDailyBuyLimit: number;
  itemDailySellLimit: number;
  accountDailyOrderLimit: number;
  accountDailyBuyLimit: number;
  accountDailySellLimit: number;
  accountDailyTradeAmount: number;
  priceDeviationThreshold: number;
  priceDeviationSoftThreshold: number;
  priceDeviationHardThreshold: number;
  studioBehaviorThreshold: {
    dailyTradeCount: number;
    averageTradeSize: number;
    loginFrequency: number;
    abnormalTradeRate: number;
    goldAccumulationRate: number;
  };
}

export interface PlayerTradeStats {
  playerId: string;
  dailyOrderCount: number;
  dailyTradeAmount: number;
  itemDailyCounts: Record<number, number>;
  lastResetDate: string;
  totalTrades: number;
  riskScore: number;
  isStudioSuspect: boolean;
}

export interface TradeRecord {
  id: string;
  orderId: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  itemId: number;
  itemName: string;
  quantity: number;
  price: number;
  totalAmount: number;
  timestamp: number;
  riskTags: TradeRiskTag[];
  historicalAveragePrice: number;
  priceDeviationPercent: number;
}

export interface PriceHistory {
  itemId: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  sampleCount: number;
  lastUpdated: number;
  dailyPrices: { date: string; avgPrice: number }[];
}

export interface TeleportPoint {
  id: string;
  name: string;
  description: string;
  position: Vector3;
  icon: string;
  unlocked: boolean;
  unlockLevel?: number;
  unlockCost?: { gold?: number };
  isActive: boolean;
  category: 'city' | 'dungeon' | 'wild' | 'homeland';
}

export enum FeatureType {
  HOMELAND = 'homeland',
  VOICE = 'voice',
  AUCTION = 'auction',
  TEAM = 'team',
  ACTIVITIES = 'activities',
}

export interface FeatureConfig {
  type: FeatureType;
  enabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  grayScalePercent?: number;
}

export type FeatureState = Record<FeatureType, FeatureConfig>;

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface PlayerSettings {
  graphicsQuality: GraphicsQuality;
  sameScreenPlayerLimit: number;
  voiceEnabled: boolean;
  voiceVolume: number;
  musicVolume: number;
  soundVolume: number;
}
