
import {
  HomelandData,
  PlotData,
  PlacedBuilding,
  BuildingConfig,
  BuildingType,
  VisitRecord,
  CropData,
} from '../../shared/types/game.js';
import { Player } from './PlayerManager.js';

const DEFAULT_BUILDING_CONFIGS: Record<number, BuildingConfig> = {
  5001: {
    id: 5001,
    name: '小木屋',
    type: BuildingType.HOUSE,
    description: '温馨的小木屋，是家园的核心建筑。',
    icon: '🏠',
    unlockLevel: 1,
    buildTime: 60,
    materials: [{ itemId: 4001, quantity: 10 }],
    goldCost: 500,
    size: { width: 2, height: 2 },
    storageBonus: 10,
  },
  5002: {
    id: 5002,
    name: '石制别墅',
    type: BuildingType.HOUSE,
    description: '坚固的石制别墅，提供更多存储空间。',
    icon: '🏡',
    unlockLevel: 10,
    buildTime: 300,
    materials: [
      { itemId: 4001, quantity: 50 },
      { itemId: 4003, quantity: 5 },
    ],
    goldCost: 5000,
    size: { width: 3, height: 3 },
    storageBonus: 30,
  },
  5101: {
    id: 5101,
    name: '药草园',
    type: BuildingType.FARM,
    description: '种植药草的园地，定期产出草药。',
    icon: '🌱',
    unlockLevel: 2,
    buildTime: 120,
    materials: [{ itemId: 4002, quantity: 5 }],
    goldCost: 300,
    size: { width: 2, height: 2 },
    production: {
      itemId: 4002,
      quantity: 2,
      interval: 300,
    },
  },
  5102: {
    id: 5102,
    name: '矿场',
    type: BuildingType.FARM,
    description: '小型矿场，定期产出铁矿石。',
    icon: '⛏️',
    unlockLevel: 5,
    buildTime: 180,
    materials: [{ itemId: 4001, quantity: 20 }],
    goldCost: 800,
    size: { width: 2, height: 2 },
    production: {
      itemId: 4001,
      quantity: 3,
      interval: 600,
    },
  },
  5103: {
    id: 5103,
    name: '魔晶塔',
    type: BuildingType.FARM,
    description: '神秘的魔晶塔，缓慢产出珍贵魔晶。',
    icon: '💎',
    unlockLevel: 20,
    buildTime: 600,
    materials: [
      { itemId: 4003, quantity: 10 },
      { itemId: 4001, quantity: 100 },
    ],
    goldCost: 10000,
    size: { width: 2, height: 3 },
    production: {
      itemId: 4003,
      quantity: 1,
      interval: 1800,
    },
  },
  5201: {
    id: 5201,
    name: '锻造坊',
    type: BuildingType.WORKSHOP,
    description: '可以锻造装备的工作坊。',
    icon: '🔨',
    unlockLevel: 8,
    buildTime: 240,
    materials: [
      { itemId: 4001, quantity: 30 },
      { itemId: 4002, quantity: 10 },
    ],
    goldCost: 2000,
    size: { width: 2, height: 2 },
  },
  5202: {
    id: 5202,
    name: '炼金室',
    type: BuildingType.WORKSHOP,
    description: '炼制药剂的神秘工坊。',
    icon: '⚗️',
    unlockLevel: 12,
    buildTime: 300,
    materials: [
      { itemId: 4002, quantity: 30 },
      { itemId: 4003, quantity: 3 },
    ],
    goldCost: 3000,
    size: { width: 2, height: 2 },
  },
  5301: {
    id: 5301,
    name: '仓库',
    type: BuildingType.STORAGE,
    description: '扩大背包存储容量。',
    icon: '📦',
    unlockLevel: 3,
    buildTime: 90,
    materials: [{ itemId: 4001, quantity: 15 }],
    goldCost: 600,
    size: { width: 2, height: 1 },
    storageBonus: 20,
  },
  5401: {
    id: 5401,
    name: '花园雕像',
    type: BuildingType.DECORATION,
    description: '精美的花园装饰，提升家园美观度。',
    icon: '🗿',
    unlockLevel: 1,
    buildTime: 30,
    materials: [{ itemId: 4001, quantity: 5 }],
    goldCost: 200,
    size: { width: 1, height: 1 },
  },
  5402: {
    id: 5402,
    name: '喷泉',
    type: BuildingType.DECORATION,
    description: '优雅的喷泉装饰。',
    icon: '⛲',
    unlockLevel: 15,
    buildTime: 200,
    materials: [
      { itemId: 4001, quantity: 40 },
      { itemId: 4003, quantity: 2 },
    ],
    goldCost: 3000,
    size: { width: 2, height: 2 },
  },
};

const INITIAL_PLOTS: PlotData[] = [
  { id: 0, unlocked: true, unlockCost: {}, building: null, crop: null },
  { id: 1, unlocked: true, unlockCost: {}, building: null, crop: null },
  { id: 2, unlocked: true, unlockCost: {}, building: null, crop: null },
  { id: 3, unlocked: false, unlockCost: { gold: 1000 }, building: null, crop: null },
  { id: 4, unlocked: false, unlockCost: { gold: 2000 }, building: null, crop: null },
  { id: 5, unlocked: false, unlockCost: { gold: 5000 }, building: null, crop: null },
  { id: 6, unlocked: false, unlockCost: { gold: 10000, itemId: 4003, quantity: 5 }, building: null, crop: null },
  { id: 7, unlocked: false, unlockCost: { gold: 20000, itemId: 4003, quantity: 10 }, building: null, crop: null },
  { id: 8, unlocked: false, unlockCost: { gold: 50000, itemId: 4003, quantity: 20 }, building: null, crop: null },
];

const CROP_CONFIGS: Record<number, { id: number; name: string; icon: string; growTime: number; yield: number; harvestItemId: number; seedCost: number }> = {
  6001: {
    id: 6001,
    name: '草药种子',
    icon: '🌿',
    growTime: 120,
    yield: 3,
    harvestItemId: 4002,
    seedCost: 10,
  },
  6002: {
    id: 6002,
    name: '铁矿脉',
    icon: '🪨',
    growTime: 300,
    yield: 5,
    harvestItemId: 4001,
    seedCost: 20,
  },
};

export class HomelandManager {
  private homelands: Map<string, HomelandData> = new Map();
  private visitRecords: Map<string, VisitRecord[]> = new Map();
  private buildingConfigs: Record<number, BuildingConfig>;
  private configVersion: number = 1;
  private lastConfigUpdate: number = Date.now();

  constructor() {
    this.buildingConfigs = JSON.parse(JSON.stringify(DEFAULT_BUILDING_CONFIGS));
  }

  getOrCreateHomeland(player: Player): HomelandData {
    let homeland = this.homelands.get(player.id);
    if (!homeland) {
      homeland = this.createHomeland(player);
      this.homelands.set(player.id, homeland);
    }
    return homeland;
  }

  private createHomeland(player: Player): HomelandData {
    const plots = INITIAL_PLOTS.map((p) => ({ ...p }));

    return {
      ownerId: player.id,
      ownerName: player.data.name,
      level: 1,
      exp: 0,
      plots,
      buildings: [],
      crops: [],
      decorationSlots: [],
      likes: 0,
      visitors: [],
      lastVisitTime: {},
      totalVisits: 0,
    };
  }

  getHomeland(playerId: string): HomelandData | undefined {
    return this.homelands.get(playerId);
  }

  updateBuildingConfig(config: BuildingConfig): { success: boolean; message?: string } {
    const oldConfig = this.buildingConfigs[config.id];
    if (oldConfig) {
      this.buildingConfigs[config.id] = { ...config };
    } else {
      this.buildingConfigs[config.id] = { ...config };
    }
    this.configVersion++;
    this.lastConfigUpdate = Date.now();
    return { success: true };
  }

  batchUpdateBuildingConfigs(configs: BuildingConfig[]): { success: boolean; updated: number } {
    let updated = 0;
    for (const config of configs) {
      this.buildingConfigs[config.id] = { ...config };
      updated++;
    }
    this.configVersion++;
    this.lastConfigUpdate = Date.now();
    return { success: true, updated };
  }

  deleteBuildingConfig(buildingId: number): boolean {
    if (this.buildingConfigs[buildingId]) {
      delete this.buildingConfigs[buildingId];
      this.configVersion++;
      this.lastConfigUpdate = Date.now();
      return true;
    }
    return false;
  }

  getConfigVersion(): number {
    return this.configVersion;
  }

  getLastConfigUpdate(): number {
    return this.lastConfigUpdate;
  }

  unlockPlot(player: Player, plotId: number): { success: boolean; message?: string } {
    const homeland = this.getOrCreateHomeland(player);
    const plot = homeland.plots.find((p) => p.id === plotId);

    if (!plot) {
      return { success: false, message: '地块不存在' };
    }

    if (plot.unlocked) {
      return { success: false, message: '地块已解锁' };
    }

    const cost = plot.unlockCost;

    if (cost.gold && player.data.gold < cost.gold) {
      return { success: false, message: '金币不足' };
    }

    if (cost.itemId && cost.quantity) {
      if (!player.hasItem(cost.itemId, cost.quantity)) {
        return { success: false, message: '材料不足' };
      }
    }

    if (cost.gold) {
      player.addGold(-cost.gold);
    }

    if (cost.itemId && cost.quantity) {
      player.removeItem(cost.itemId, cost.quantity);
    }

    plot.unlocked = true;
    this.addHomelandExp(homeland, 50);

    return { success: true };
  }

  buildBuilding(
    player: Player,
    plotId: number,
    buildingId: number
  ): { success: boolean; message?: string; building?: PlacedBuilding } {
    const homeland = this.getOrCreateHomeland(player);
    const plot = homeland.plots.find((p) => p.id === plotId);
    const config = this.buildingConfigs[buildingId];

    if (!plot) {
      return { success: false, message: '地块不存在' };
    }

    if (!plot.unlocked) {
      return { success: false, message: '地块未解锁' };
    }

    if (plot.building) {
      return { success: false, message: '该地块已有建筑' };
    }

    if (!config) {
      return { success: false, message: '建筑配置不存在' };
    }

    if (player.data.level < config.unlockLevel) {
      return { success: false, message: `需要等级 ${config.unlockLevel}` };
    }

    if (player.data.gold < config.goldCost) {
      return { success: false, message: '金币不足' };
    }

    for (const material of config.materials) {
      if (!player.hasItem(material.itemId, material.quantity)) {
        return { success: false, message: '材料不足' };
      }
    }

    player.addGold(-config.goldCost);
    for (const material of config.materials) {
      player.removeItem(material.itemId, material.quantity);
    }

    const now = Date.now();
    const building: PlacedBuilding = {
      instanceId: `building_${player.id}_${plotId}_${now}`,
      buildingId,
      name: config.name,
      icon: config.icon,
      position: { x: plotId % 3, y: Math.floor(plotId / 3) },
      level: 1,
      buildStartTime: now,
      buildEndTime: now + config.buildTime * 1000,
      isBuilt: config.buildTime === 0,
      remainingBuildTime: config.buildTime,
      lastCollectTime: now,
      readyToCollect: 0,
    };

    plot.building = building;
    homeland.buildings.push(building);
    this.addHomelandExp(homeland, 100);

    if (config.storageBonus) {
      player.expandInventory(config.storageBonus);
    }

    return { success: true, building };
  }

  collectProduction(player: Player, plotId: number): { success: boolean; rewards?: { itemId: number; quantity: number }[]; message?: string } {
    const homeland = this.getOrCreateHomeland(player);
    const plot = homeland.plots.find((p) => p.id === plotId);

    if (!plot || !plot.building) {
      return { success: false, message: '建筑不存在' };
    }

    const building = plot.building;
    const config = this.buildingConfigs[building.buildingId];

    if (!config || !config.production) {
      return { success: false, message: '该建筑不产生资源' };
    }

    if (!building.isBuilt) {
      return { success: false, message: '建筑尚未建造完成' };
    }

    const now = Date.now();
    const elapsed = now - building.lastCollectTime;
    const intervalMs = config.production.interval * 1000;

    if (elapsed < intervalMs) {
      return { success: false, message: '资源尚未产出' };
    }

    const cycles = Math.floor(elapsed / intervalMs);
    const maxCycles = 10;
    const actualCycles = Math.min(cycles, maxCycles);
    const quantity = config.production.quantity * actualCycles;

    const success = player.addItem(config.production.itemId, quantity, false);
    if (!success) {
      return { success: false, message: '背包空间不足' };
    }

    building.lastCollectTime = building.lastCollectTime + actualCycles * intervalMs;
    building.readyToCollect = 0;

    this.addHomelandExp(homeland, 10 * actualCycles);

    return {
      success: true,
      rewards: [{ itemId: config.production.itemId, quantity }],
    };
  }

  collectAllProduction(player: Player): { success: boolean; totalRewards?: { itemId: number; quantity: number }[]; failed?: { itemId: number; quantity: number }[] } {
    const homeland = this.getOrCreateHomeland(player);
    const totalRewards: { itemId: number; quantity: number }[] = [];
    const failed: { itemId: number; quantity: number }[] = [];

    for (const plot of homeland.plots) {
      if (plot.building && plot.building.isBuilt) {
        const config = this.buildingConfigs[plot.building.buildingId];
        if (config?.production) {
          const result = this.collectProduction(player, plot.id);
          if (result.success && result.rewards) {
            for (const reward of result.rewards) {
              const existing = totalRewards.find((r) => r.itemId === reward.itemId);
              if (existing) {
                existing.quantity += reward.quantity;
              } else {
                totalRewards.push({ ...reward });
              }
            }
          } else if (!result.success && result.message) {
            const now = Date.now();
            const elapsed = now - plot.building.lastCollectTime;
            const intervalMs = config.production.interval * 1000;
            const cycles = Math.floor(elapsed / intervalMs);
            if (cycles > 0) {
              failed.push({ itemId: config.production.itemId, quantity: config.production.quantity * Math.min(cycles, 10) });
            }
          }
        }
      }
    }

    return { success: totalRewards.length > 0, totalRewards, failed };
  }

  plantCrop(player: Player, plotId: number, cropId: number): { success: boolean; message?: string } {
    const homeland = this.getOrCreateHomeland(player);
    const plot = homeland.plots.find((p) => p.id === plotId);
    const cropConfig = CROP_CONFIGS[cropId];

    if (!plot) {
      return { success: false, message: '地块不存在' };
    }

    if (!plot.unlocked) {
      return { success: false, message: '地块未解锁' };
    }

    if (!plot.building || plot.building.buildingId !== 5101) {
      return { success: false, message: '只能在药草园种植' };
    }

    if (!cropConfig) {
      return { success: false, message: '作物配置不存在' };
    }

    if (player.data.gold < cropConfig.seedCost) {
      return { success: false, message: '金币不足' };
    }

    if (plot.crop) {
      return { success: false, message: '该地块已有作物' };
    }

    player.addGold(-cropConfig.seedCost);

    const now = Date.now();
    const crop: CropData = {
      cropId,
      plantTime: now,
      growTime: cropConfig.growTime,
      harvestTime: now + cropConfig.growTime * 1000,
      isReady: false,
      yield: cropConfig.yield,
    };

    plot.crop = crop;
    homeland.crops.push(crop);

    return { success: true };
  }

  harvestCrop(player: Player, plotId: number): { success: boolean; reward?: { itemId: number; quantity: number }; message?: string } {
    const homeland = this.getOrCreateHomeland(player);
    const plot = homeland.plots.find((p) => p.id === plotId);

    if (!plot || !plot.crop) {
      return { success: false, message: '作物不存在' };
    }

    const crop = plot.crop;
    const cropConfig = CROP_CONFIGS[crop.cropId];

    if (!cropConfig) {
      return { success: false, message: '作物配置不存在' };
    }

    if (!crop.isReady && Date.now() < crop.harvestTime) {
      return { success: false, message: '作物尚未成熟' };
    }

    crop.isReady = true;

    const success = player.addItem(cropConfig.harvestItemId, crop.yield, false);
    if (!success) {
      return { success: false, message: '背包空间不足' };
    }

    const cropIndex = homeland.crops.findIndex((c) => c.cropId === crop.cropId && c.plantTime === crop.plantTime);
    if (cropIndex >= 0) {
      homeland.crops.splice(cropIndex, 1);
    }
    plot.crop = null;

    this.addHomelandExp(homeland, 5);

    return {
      success: true,
      reward: { itemId: cropConfig.harvestItemId, quantity: crop.yield },
    };
  }

  visitHomeland(visitor: Player, ownerId: string): { success: boolean; homeland?: HomelandData; visitRecord?: VisitRecord; message?: string } {
    const homeland = this.homelands.get(ownerId);
    if (!homeland) {
      return { success: false, message: '家园不存在' };
    }

    const now = Date.now();
    homeland.lastVisitTime[visitor.id] = now;
    homeland.totalVisits = (homeland.totalVisits || 0) + 1;

    if (!homeland.visitors.includes(visitor.id)) {
      homeland.visitors.push(visitor.id);
    }

    const visitRecord: VisitRecord = {
      visitorId: visitor.id,
      visitorName: visitor.data.name,
      visitTime: now,
      liked: false,
    };

    const records = this.visitRecords.get(ownerId) || [];
    records.push(visitRecord);
    if (records.length > 200) {
      records.shift();
    }
    this.visitRecords.set(ownerId, records);

    return { success: true, homeland, visitRecord };
  }

  likeHomeland(visitor: Player, ownerId: string): { success: boolean; likes?: number; message?: string } {
    const homeland = this.homelands.get(ownerId);
    if (!homeland) {
      return { success: false, message: '家园不存在' };
    }

    const today = new Date().toDateString();
    const likeKey = `${visitor.id}_${today}`;

    const records = this.visitRecords.get(ownerId) || [];
    const todayVisit = records.find(
      (r) => r.visitorId === visitor.id && new Date(r.visitTime).toDateString() === today
    );

    if (todayVisit?.liked) {
      return { success: false, message: '今日已点赞' };
    }

    if (todayVisit) {
      todayVisit.liked = true;
    }

    homeland.likes += 1;

    return { success: true, likes: homeland.likes };
  }

  getVisitRecords(ownerId: string, limit: number = 20): VisitRecord[] {
    const records = this.visitRecords.get(ownerId) || [];
    return records.slice(-limit).reverse();
  }

  getFriendsHomelands(player: Player, friendIds: string[]): { playerId: string; playerName: string; level: number; likes: number; buildings: number }[] {
    const result: { playerId: string; playerName: string; level: number; likes: number; buildings: number }[] = [];

    for (const friendId of friendIds) {
      const homeland = this.homelands.get(friendId);
      if (homeland) {
        result.push({
          playerId: homeland.ownerId,
          playerName: homeland.ownerName,
          level: homeland.level,
          likes: homeland.likes,
          buildings: homeland.buildings.length,
        });
      }
    }

    return result.sort((a, b) => b.level - a.level);
  }

  getRanking(type: 'level' | 'likes' | 'visits', limit: number = 20): { rank: number; playerId: string; playerName: string; value: number }[] {
    const homelands = Array.from(this.homelands.values());

    homelands.sort((a, b) => {
      if (type === 'level') return b.level - a.level;
      if (type === 'likes') return b.likes - a.likes;
      return (b.totalVisits || 0) - (a.totalVisits || 0);
    });

    return homelands.slice(0, limit).map((h, i) => ({
      rank: i + 1,
      playerId: h.ownerId,
      playerName: h.ownerName,
      value: type === 'level' ? h.level : type === 'likes' ? h.likes : h.totalVisits || 0,
    }));
  }

  removeBuilding(player: Player, plotId: number): { success: boolean; message?: string; refund?: { gold: number; items: { itemId: number; quantity: number }[] } } {
    const homeland = this.getOrCreateHomeland(player);
    const plot = homeland.plots.find((p) => p.id === plotId);

    if (!plot || !plot.building) {
      return { success: false, message: '建筑不存在' };
    }

    const building = plot.building;
    const config = this.buildingConfigs[building.buildingId];
    const refundItems: { itemId: number; quantity: number }[] = [];
    let refundGold = 0;

    if (config) {
      refundGold = Math.floor(config.goldCost * 0.5);
      player.addGold(refundGold);

      for (const material of config.materials) {
        const refundQty = Math.floor(material.quantity * 0.5);
        if (refundQty > 0) {
          player.addItem(material.itemId, refundQty, false);
          refundItems.push({ itemId: material.itemId, quantity: refundQty });
        }
      }

      if (config.storageBonus) {
      }
    }

    const index = homeland.buildings.findIndex((b) => b.instanceId === building.instanceId);
    if (index >= 0) {
      homeland.buildings.splice(index, 1);
    }
    plot.building = null;

    return { success: true, refund: { gold: refundGold, items: refundItems } };
  }

  getBuildingConfig(buildingId: number): BuildingConfig | undefined {
    return this.buildingConfigs[buildingId];
  }

  getAllBuildingConfigs(): BuildingConfig[] {
    return Object.values(this.buildingConfigs);
  }

  getCropConfigs(): typeof CROP_CONFIGS {
    return { ...CROP_CONFIGS };
  }

  updateHomelandTick(): void {
    const now = Date.now();

    for (const homeland of this.homelands.values()) {
      for (const plot of homeland.plots) {
        if (plot.building) {
          if (!plot.building.isBuilt) {
            if (now >= plot.building.buildEndTime) {
              plot.building.isBuilt = true;
              plot.building.remainingBuildTime = 0;
            } else {
              plot.building.remainingBuildTime = Math.ceil((plot.building.buildEndTime - now) / 1000);
            }
          }

          const config = this.buildingConfigs[plot.building.buildingId];
          if (plot.building.isBuilt && config?.production) {
            const elapsed = now - plot.building.lastCollectTime;
            const intervalMs = config.production.interval * 1000;
            const cycles = Math.floor(elapsed / intervalMs);
            const maxCycles = 10;
            const actualCycles = Math.min(cycles, maxCycles);
            plot.building.readyToCollect = config.production.quantity * actualCycles;
          }
        }

        if (plot.crop && !plot.crop.isReady) {
          if (now >= plot.crop.harvestTime) {
            plot.crop.isReady = true;
          }
        }
      }
    }
  }

  private addHomelandExp(homeland: HomelandData, exp: number): void {
    homeland.exp += exp;

    let expNeeded = homeland.level * 200;
    while (homeland.exp >= expNeeded && homeland.level < 100) {
      homeland.exp -= expNeeded;
      homeland.level++;
      expNeeded = homeland.level * 200;
    }
  }

  getHomelandCount(): number {
    return this.homelands.size;
  }
}

export default HomelandManager;
