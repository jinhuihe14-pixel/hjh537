
import { create } from 'zustand';
import {
  PlayerState,
  PlayerClass,
  EntityType,
  ItemSlot,
  ChatMessage,
  AuctionOrder,
  TeamData,
  Vector3,
  SkillState,
  HomelandData,
  VoiceChannel,
  TeleportPoint,
  FeatureState,
  FeatureType,
  BuildingConfig,
  VisitRecord,
  PlayerTradeStats,
  PriceHistory,
  TradeLimitConfig,
  PlayerSettings,
  GraphicsQuality,
} from '../types/game';
import { SKILLS, DEFAULT_FEATURE_STATE } from '../data/gameData';

interface GameState {
  isLoggedIn: boolean;
  isInGame: boolean;
  isLoading: boolean;
  loadingProgress: number;
  
  currentPlayer: PlayerState | null;
  playerId: string;
  
  entities: Map<string, any>;
  otherPlayers: Map<string, PlayerState>;
  
  inventory: ItemSlot[];
  inventorySize: number;
  
  skills: SkillState[];
  
  chatMessages: ChatMessage[];
  
  team: TeamData | null;
  
  auctionOrders: AuctionOrder[];
  
  showInventory: boolean;
  showCharacter: boolean;
  showAuction: boolean;
  showTeam: boolean;
  showActivities: boolean;
  showSettings: boolean;
  
  miniMapZoom: number;
  
  homeland: HomelandData | null;
  buildingConfigs: BuildingConfig[];
  showHomeland: boolean;
  
  voiceChannel: VoiceChannel | null;
  showVoice: boolean;
  
  teleportPoints: TeleportPoint[];
  showTeleport: boolean;
  
  featureState: FeatureState;
  
  tradeStats: PlayerTradeStats | null;
  priceHistories: Record<number, PriceHistory>;
  tradeLimitConfig: TradeLimitConfig | null;
  
  visitRecords: VisitRecord[];
  
  playerSettings: PlayerSettings;
  showHomelandVisit: boolean;
  currentVisitTarget: string | null;
  
  setLoggedIn: (logged: boolean) => void;
  setInGame: (inGame: boolean) => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  
  setCurrentPlayer: (player: PlayerState) => void;
  updatePlayerPosition: (position: Vector3) => void;
  updatePlayerHealth: (health: number) => void;
  updatePlayerMana: (mana: number) => void;
  addExp: (exp: number) => void;
  addGold: (gold: number) => void;
  
  setPlayerId: (id: string) => void;
  
  addOtherPlayer: (player: PlayerState) => void;
  removeOtherPlayer: (id: string) => void;
  updateOtherPlayer: (id: string, data: Partial<PlayerState>) => void;
  clearOtherPlayers: () => void;
  
  setInventory: (items: ItemSlot[]) => void;
  addItem: (itemId: number, quantity: number, bound?: boolean) => void;
  removeItem: (itemId: number, quantity: number) => void;
  useItem: (slotIndex: number) => void;
  
  setSkills: (playerClass: PlayerClass) => void;
  updateSkillCooldown: (skillId: number, cooldown: number) => void;
  
  addChatMessage: (message: ChatMessage) => void;
  
  setTeam: (team: TeamData | null) => void;
  
  setAuctionOrders: (orders: AuctionOrder[]) => void;
  
  toggleInventory: () => void;
  toggleCharacter: () => void;
  toggleAuction: () => void;
  toggleTeam: () => void;
  toggleActivities: () => void;
  toggleSettings: () => void;
  toggleHomeland: () => void;
  toggleVoice: () => void;
  toggleTeleport: () => void;
  
  setMiniMapZoom: (zoom: number) => void;
  
  setHomeland: (homeland: HomelandData | null | ((prev: HomelandData | null) => HomelandData | null)) => void;
  setBuildingConfigs: (configs: BuildingConfig[]) => void;
  updateHomeland: (data: Partial<HomelandData>) => void;
  
  setVoiceChannel: (channel: VoiceChannel | null) => void;
  updateVoiceMember: (playerId: string, data: Partial<VoiceChannel['members'][0]>) => void;
  addVoiceMember: (member: VoiceChannel['members'][0]) => void;
  removeVoiceMember: (playerId: string) => void;
  
  setTeleportPoints: (points: TeleportPoint[]) => void;
  updateTeleportPoint: (pointId: string, data: Partial<TeleportPoint>) => void;
  
  setFeatureState: (state: FeatureState) => void;
  isFeatureEnabled: (featureType: FeatureType) => boolean;
  
  setTradeStats: (stats: PlayerTradeStats | null) => void;
  setPriceHistory: (itemId: number, history: PriceHistory) => void;
  setTradeLimitConfig: (config: TradeLimitConfig) => void;
  
  setVisitRecords: (records: VisitRecord[]) => void;
  setCurrentVisitTarget: (targetId: string | null) => void;
  toggleHomelandVisit: () => void;
  
  setPlayerSetting: (key: keyof PlayerSettings, value: any) => void;
  setGraphicsQuality: (quality: GraphicsQuality) => void;
  
  reset: () => void;
}

const initialInventory: ItemSlot[] = Array(30).fill(null).map(() => ({
  itemId: 0,
  quantity: 0,
  bound: false,
}));

initialInventory[0] = { itemId: 1001, quantity: 1, bound: true };
initialInventory[1] = { itemId: 2001, quantity: 1, bound: true };
initialInventory[5] = { itemId: 3001, quantity: 20, bound: true };
initialInventory[6] = { itemId: 3003, quantity: 10, bound: true };
initialInventory[10] = { itemId: 4001, quantity: 50, bound: false };
initialInventory[11] = { itemId: 4002, quantity: 30, bound: false };

export const useGameStore = create<GameState>((set, get) => ({
  isLoggedIn: false,
  isInGame: false,
  isLoading: false,
  loadingProgress: 0,
  
  currentPlayer: null,
  playerId: '',
  
  entities: new Map(),
  otherPlayers: new Map(),
  
  inventory: initialInventory,
  inventorySize: 30,
  
  skills: [],
  
  chatMessages: [],
  
  team: null,
  
  auctionOrders: [],
  
  showInventory: false,
  showCharacter: false,
  showAuction: false,
  showTeam: false,
  showActivities: false,
  showSettings: false,
  
  miniMapZoom: 1,
  
  homeland: null,
  buildingConfigs: [],
  showHomeland: false,
  
  voiceChannel: null,
  showVoice: false,
  
  teleportPoints: [],
  showTeleport: false,
  
  featureState: { ...DEFAULT_FEATURE_STATE },
  
  tradeStats: null,
  priceHistories: {},
  tradeLimitConfig: null,
  
  visitRecords: [],
  
  playerSettings: {
    graphicsQuality: 'medium',
    sameScreenPlayerLimit: 30,
    voiceEnabled: true,
    voiceVolume: 80,
    musicVolume: 60,
    soundVolume: 70,
  },
  showHomelandVisit: false,
  currentVisitTarget: null,
  
  setLoggedIn: (logged) => set({ isLoggedIn: logged }),
  setInGame: (inGame) => set({ isInGame: inGame }),
  setLoading: (loading) => set({ isLoading: loading }),
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  updatePlayerPosition: (position) =>
    set((state) => ({
      currentPlayer: state.currentPlayer ? { ...state.currentPlayer, position } : null,
    })),
  updatePlayerHealth: (health) =>
    set((state) => ({
      currentPlayer: state.currentPlayer
        ? { ...state.currentPlayer, health: Math.max(0, Math.min(state.currentPlayer.maxHealth, health)) }
        : null,
    })),
  updatePlayerMana: (mana) =>
    set((state) => ({
      currentPlayer: state.currentPlayer
        ? { ...state.currentPlayer, mana: Math.max(0, Math.min(state.currentPlayer.maxMana, mana)) }
        : null,
    })),
  addExp: (exp) =>
    set((state) => {
      if (!state.currentPlayer) return {};
      const newExp = state.currentPlayer.exp + exp;
      let level = state.currentPlayer.level;
      let expRemaining = newExp;
      let expToNext = level * 100;
      
      while (expRemaining >= expToNext && level < 100) {
        expRemaining -= expToNext;
        level++;
        expToNext = level * 100;
      }
      
      return {
        currentPlayer: {
          ...state.currentPlayer,
          level,
          exp: expRemaining,
          maxHealth: 100 + level * 20,
          maxMana: 50 + level * 10,
          attack: 10 + level * 5,
          defense: 5 + level * 3,
        },
      };
    }),
  addGold: (gold) =>
    set((state) => ({
      currentPlayer: state.currentPlayer
        ? { ...state.currentPlayer, gold: Math.max(0, state.currentPlayer.gold + gold) }
        : null,
    })),
  
  setPlayerId: (id) => set({ playerId: id }),
  
  addOtherPlayer: (player) =>
    set((state) => {
      const newMap = new Map(state.otherPlayers);
      newMap.set(player.id, player);
      return { otherPlayers: newMap };
    }),
  removeOtherPlayer: (id) =>
    set((state) => {
      const newMap = new Map(state.otherPlayers);
      newMap.delete(id);
      return { otherPlayers: newMap };
    }),
  updateOtherPlayer: (id, data) =>
    set((state) => {
      const newMap = new Map(state.otherPlayers);
      const existing = newMap.get(id);
      if (existing) {
        newMap.set(id, { ...existing, ...data });
      }
      return { otherPlayers: newMap };
    }),
  clearOtherPlayers: () => set({ otherPlayers: new Map() }),
  
  setInventory: (items) => set({ inventory: items }),
  addItem: (itemId, quantity, bound = false) => {
    const state = get();
    const newInventory = [...state.inventory];
    
    for (let i = 0; i < newInventory.length; i++) {
      const slot = newInventory[i];
      if (slot.itemId === itemId && slot.bound === bound) {
        slot.quantity += quantity;
        set({ inventory: newInventory });
        return;
      }
    }
    
    for (let i = 0; i < newInventory.length; i++) {
      if (newInventory[i].itemId === 0) {
        newInventory[i] = { itemId, quantity, bound };
        break;
      }
    }
    
    set({ inventory: newInventory });
  },
  removeItem: (itemId, quantity) => {
    const state = get();
    const newInventory = [...state.inventory];
    let remaining = quantity;
    
    for (let i = 0; i < newInventory.length && remaining > 0; i++) {
      const slot = newInventory[i];
      if (slot.itemId === itemId) {
        const remove = Math.min(slot.quantity, remaining);
        slot.quantity -= remove;
        remaining -= remove;
        if (slot.quantity <= 0) {
          slot.itemId = 0;
          slot.quantity = 0;
          slot.bound = false;
        }
      }
    }
    
    set({ inventory: newInventory });
  },
  useItem: (slotIndex) => {
    const state = get();
    const slot = state.inventory[slotIndex];
    if (!slot || slot.itemId === 0 || slot.quantity <= 0) return;
    
    state.removeItem(slot.itemId, 1);
  },
  
  setSkills: (playerClass) => {
    const classSkills = SKILLS[playerClass] || [];
    const skills: SkillState[] = classSkills.map((s) => ({
      skillId: s.id,
      level: 1,
      currentCooldown: 0,
    }));
    set({ skills });
  },
  updateSkillCooldown: (skillId, cooldown) =>
    set((state) => ({
      skills: state.skills.map((s) =>
        s.skillId === skillId ? { ...s, currentCooldown: cooldown } : s
      ),
    })),
  
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages.slice(-99), message],
    })),
  
  setTeam: (team) => set({ team }),
  
  setAuctionOrders: (orders) => set({ auctionOrders: orders }),
  
  toggleInventory: () => set((s) => ({ showInventory: !s.showInventory })),
  toggleCharacter: () => set((s) => ({ showCharacter: !s.showCharacter })),
  toggleAuction: () => set((s) => ({ showAuction: !s.showAuction })),
  toggleTeam: () => set((s) => ({ showTeam: !s.showTeam })),
  toggleActivities: () => set((s) => ({ showActivities: !s.showActivities })),
  toggleSettings: () => set((s) => ({ showSettings: !s.showSettings })),
  
  setMiniMapZoom: (zoom) => set({ miniMapZoom: Math.max(0.5, Math.min(2, zoom)) }),
  
  toggleHomeland: () => set((s) => ({ showHomeland: !s.showHomeland })),
  toggleVoice: () => set((s) => ({ showVoice: !s.showVoice })),
  toggleTeleport: () => set((s) => ({ showTeleport: !s.showTeleport })),
  toggleHomelandVisit: () => set((s) => ({ showHomelandVisit: !s.showHomelandVisit })),
  
  setHomeland: (homeland) => set((state) => ({ 
    homeland: typeof homeland === 'function' ? homeland(state.homeland) : homeland 
  })),
  setBuildingConfigs: (configs) => set({ buildingConfigs: configs }),
  updateHomeland: (data) =>
    set((state) => ({
      homeland: state.homeland ? { ...state.homeland, ...data } : null,
    })),
  
  setVoiceChannel: (channel) => set({ voiceChannel: channel }),
  updateVoiceMember: (playerId, data) =>
    set((state) => {
      if (!state.voiceChannel) return {};
      const updated = state.voiceChannel.members.map((m) =>
        m.playerId === playerId ? { ...m, ...data } : m
      );
      return {
        voiceChannel: { ...state.voiceChannel, members: updated },
      };
    }),
  addVoiceMember: (member) =>
    set((state) => {
      if (!state.voiceChannel) return {};
      return {
        voiceChannel: {
          ...state.voiceChannel,
          members: [...state.voiceChannel.members, member],
        },
      };
    }),
  removeVoiceMember: (playerId) =>
    set((state) => {
      if (!state.voiceChannel) return {};
      return {
        voiceChannel: {
          ...state.voiceChannel,
          members: state.voiceChannel.members.filter((m) => m.playerId !== playerId),
        },
      };
    }),
  
  setTeleportPoints: (points) => set({ teleportPoints: points }),
  updateTeleportPoint: (pointId, data) =>
    set((state) => ({
      teleportPoints: state.teleportPoints.map((p) =>
        p.id === pointId ? { ...p, ...data } : p
      ),
    })),
  
  setFeatureState: (state) => set({ featureState: state }),
  isFeatureEnabled: (featureType) => {
    const state = get().featureState;
    const feature = state[featureType];
    return feature?.enabled && !feature?.maintenanceMode;
  },
  
  setTradeStats: (stats) => set({ tradeStats: stats }),
  setPriceHistory: (itemId, history) =>
    set((state) => ({
      priceHistories: { ...state.priceHistories, [itemId]: history },
    })),
  setTradeLimitConfig: (config) => set({ tradeLimitConfig: config }),
  
  setVisitRecords: (records) => set({ visitRecords: records }),
  setCurrentVisitTarget: (targetId) => set({ currentVisitTarget: targetId }),
  
  setPlayerSetting: (key, value) =>
    set((state) => ({
      playerSettings: { ...state.playerSettings, [key]: value },
    })),
  setGraphicsQuality: (quality) =>
    set((state) => ({
      playerSettings: { ...state.playerSettings, graphicsQuality: quality },
    })),
  
  reset: () =>
    set({
      isLoggedIn: false,
      isInGame: false,
      currentPlayer: null,
      otherPlayers: new Map(),
      chatMessages: [],
      team: null,
      showInventory: false,
      showCharacter: false,
      showAuction: false,
      showTeam: false,
      showActivities: false,
      showSettings: false,
      homeland: null,
      showHomeland: false,
      voiceChannel: null,
      showVoice: false,
      teleportPoints: [],
      showTeleport: false,
      tradeStats: null,
      priceHistories: {},
      visitRecords: [],
      currentVisitTarget: null,
    }),
}));
