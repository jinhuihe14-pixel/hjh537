
import {
  FeatureType,
  FeatureConfig,
  FeatureState,
  TeleportPoint,
  Vector3,
} from '../../shared/types/game.js';
import { Player } from './PlayerManager.js';

const DEFAULT_FEATURE_STATE: FeatureState = {
  [FeatureType.HOMELAND]: {
    type: FeatureType.HOMELAND,
    enabled: true,
    maintenanceMode: false,
    grayScalePercent: 100,
  },
  [FeatureType.VOICE]: {
    type: FeatureType.VOICE,
    enabled: true,
    maintenanceMode: false,
    grayScalePercent: 100,
  },
  [FeatureType.AUCTION]: {
    type: FeatureType.AUCTION,
    enabled: true,
    maintenanceMode: false,
    grayScalePercent: 100,
  },
  [FeatureType.TEAM]: {
    type: FeatureType.TEAM,
    enabled: true,
    maintenanceMode: false,
    grayScalePercent: 100,
  },
  [FeatureType.ACTIVITIES]: {
    type: FeatureType.ACTIVITIES,
    enabled: true,
    maintenanceMode: false,
    grayScalePercent: 100,
  },
};

const INITIAL_TELEPORT_POINTS: TeleportPoint[] = [
  {
    id: 'tp_main_city',
    name: '圣光主城',
    description: '联盟的中心城市，繁华而安全。',
    position: { x: 32, y: 0, z: 32 },
    icon: '🏰',
    unlocked: true,
    isActive: true,
    category: 'city',
  },
  {
    id: 'tp_forest',
    name: '幽暗森林',
    description: '充满神秘气息的古老森林。',
    position: { x: 80, y: 0, z: 50 },
    icon: '🌲',
    unlocked: false,
    unlockLevel: 10,
    isActive: true,
    category: 'wild',
  },
  {
    id: 'tp_desert',
    name: '沙漠绿洲',
    description: '沙漠中的一片绿洲，藏有宝藏。',
    position: { x: 120, y: 0, z: 80 },
    icon: '🏜️',
    unlocked: false,
    unlockLevel: 20,
    unlockCost: { gold: 1000 },
    isActive: true,
    category: 'wild',
  },
  {
    id: 'tp_dungeon_1',
    name: '暗影副本',
    description: '充满危险的地下城，挑战与机遇并存。',
    position: { x: -50, y: 0, z: 60 },
    icon: '🕳️',
    unlocked: false,
    unlockLevel: 15,
    isActive: true,
    category: 'dungeon',
  },
  {
    id: 'tp_dungeon_2',
    name: '炎魔巢穴',
    description: '传说中炎魔领主的巢穴。',
    position: { x: 100, y: 0, z: 100 },
    icon: '🔥',
    unlocked: false,
    unlockLevel: 40,
    unlockCost: { gold: 5000 },
    isActive: true,
    category: 'dungeon',
  },
  {
    id: 'tp_homeland',
    name: '我的家园',
    description: '返回你的专属家园领地。',
    position: { x: 0, y: 0, z: 0 },
    icon: '🏡',
    unlocked: true,
    isActive: true,
    category: 'homeland',
  },
];

export class FeatureManager {
  private features: FeatureState;
  private teleportPoints: Map<string, TeleportPoint> = new Map();
  private playerUnlockedPoints: Map<string, Set<string>> = new Map();

  constructor() {
    this.features = JSON.parse(JSON.stringify(DEFAULT_FEATURE_STATE));
    this.initTeleportPoints();
  }

  private initTeleportPoints(): void {
    for (const point of INITIAL_TELEPORT_POINTS) {
      this.teleportPoints.set(point.id, { ...point });
    }
  }

  getFeatureState(): FeatureState {
    return { ...this.features };
  }

  isFeatureEnabled(featureType: FeatureType, player?: Player): {
    enabled: boolean;
    message?: string;
  } {
    const feature = this.features[featureType];

    if (!feature) {
      return { enabled: false, message: '功能不存在' };
    }

    if (feature.maintenanceMode) {
      return {
        enabled: false,
        message: feature.maintenanceMessage || '功能维护中',
      };
    }

    if (!feature.enabled) {
      return { enabled: false };
    }

    if (feature.grayScalePercent !== undefined && feature.grayScalePercent < 100 && player) {
      const hash = this.hashPlayerId(player.id);
      const inGray = (hash % 100) < feature.grayScalePercent;
      if (!inGray) {
        return { enabled: false, message: '功能灰度测试中' };
      }
    }

    return { enabled: true };
  }

  private hashPlayerId(playerId: string): number {
    let hash = 0;
    for (let i = 0; i < playerId.length; i++) {
      const char = playerId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  setFeatureEnabled(featureType: FeatureType, enabled: boolean): void {
    if (this.features[featureType]) {
      this.features[featureType].enabled = enabled;
    }
  }

  setFeatureMaintenance(
    featureType: FeatureType,
    maintenanceMode: boolean,
    message?: string
  ): void {
    if (this.features[featureType]) {
      this.features[featureType].maintenanceMode = maintenanceMode;
      if (message) {
        this.features[featureType].maintenanceMessage = message;
      }
    }
  }

  setGrayScalePercent(featureType: FeatureType, percent: number): void {
    if (this.features[featureType]) {
      this.features[featureType].grayScalePercent = Math.max(0, Math.min(100, percent));
    }
  }

  getAllTeleportPoints(player?: Player): TeleportPoint[] {
    const points = Array.from(this.teleportPoints.values())
      .filter((p) => p.isActive)
      .sort((a, b) => {
        const categoryOrder = { city: 0, homeland: 1, wild: 2, dungeon: 3 };
        return categoryOrder[a.category] - categoryOrder[b.category];
      });

    if (player) {
      const unlocked = this.getPlayerUnlockedPoints(player.id);
      return points.map((p) => ({
        ...p,
        unlocked: p.unlocked || unlocked.has(p.id),
      }));
    }

    return points;
  }

  getTeleportPoint(pointId: string): TeleportPoint | undefined {
    return this.teleportPoints.get(pointId);
  }

  unlockTeleportPoint(
    player: Player,
    pointId: string
  ): { success: boolean; message?: string; point?: TeleportPoint } {
    const point = this.teleportPoints.get(pointId);
    if (!point) {
      return { success: false, message: '传送点不存在' };
    }

    if (!point.isActive) {
      return { success: false, message: '传送点未启用' };
    }

    const unlocked = this.getPlayerUnlockedPoints(player.id);
    if (unlocked.has(pointId) || point.unlocked) {
      return { success: false, message: '传送点已解锁' };
    }

    if (point.unlockLevel && player.data.level < point.unlockLevel) {
      return {
        success: false,
        message: `需要等级 ${point.unlockLevel}`,
      };
    }

    if (point.unlockCost?.gold && player.data.gold < point.unlockCost.gold) {
      return { success: false, message: '金币不足' };
    }

    if (point.unlockCost?.gold) {
      player.addGold(-point.unlockCost.gold);
    }

    unlocked.add(pointId);
    this.playerUnlockedPoints.set(player.id, unlocked);

    return {
      success: true,
      point: { ...point, unlocked: true },
    };
  }

  private getPlayerUnlockedPoints(playerId: string): Set<string> {
    let unlocked = this.playerUnlockedPoints.get(playerId);
    if (!unlocked) {
      unlocked = new Set();
      this.playerUnlockedPoints.set(playerId, unlocked);
    }
    return unlocked;
  }

  addTeleportPoint(point: Omit<TeleportPoint, 'id'> & { id?: string }): TeleportPoint {
    const id = point.id || `tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newPoint: TeleportPoint = {
      ...point,
      id,
      isActive: point.isActive ?? true,
      unlocked: point.unlocked ?? false,
    };

    this.teleportPoints.set(id, newPoint);
    return newPoint;
  }

  updateTeleportPoint(
    pointId: string,
    updates: Partial<TeleportPoint>
  ): { success: boolean; message?: string; point?: TeleportPoint } {
    const point = this.teleportPoints.get(pointId);
    if (!point) {
      return { success: false, message: '传送点不存在' };
    }

    const updated = { ...point, ...updates };
    this.teleportPoints.set(pointId, updated);

    return { success: true, point: updated };
  }

  removeTeleportPoint(pointId: string): boolean {
    return this.teleportPoints.delete(pointId);
  }

  batchAddTeleportPoints(
    points: Array<Omit<TeleportPoint, 'id'> & { id?: string }>
  ): TeleportPoint[] {
    const results: TeleportPoint[] = [];
    for (const point of points) {
      const newPoint = this.addTeleportPoint(point);
      results.push(newPoint);
    }
    return results;
  }

  batchSetTeleportPointsActive(pointIds: string[], isActive: boolean): { success: number; failed: number } {
    let success = 0;
    let failed = 0;
    for (const id of pointIds) {
      if (this.setTeleportPointActive(id, isActive)) {
        success++;
      } else {
        failed++;
      }
    }
    return { success, failed };
  }

  batchRemoveTeleportPoints(pointIds: string[]): { success: number; failed: number } {
    let success = 0;
    let failed = 0;
    for (const id of pointIds) {
      if (this.removeTeleportPoint(id)) {
        success++;
      } else {
        failed++;
      }
    }
    return { success, failed };
  }

  setTeleportPointActive(pointId: string, isActive: boolean): boolean {
    const point = this.teleportPoints.get(pointId);
    if (!point) return false;

    point.isActive = isActive;
    return true;
  }

  teleportTo(
    player: Player,
    pointId: string
  ): { success: boolean; position?: Vector3; message?: string } {
    const featureCheck = this.isFeatureEnabled(FeatureType.ACTIVITIES, player);
    if (!featureCheck.enabled) {
      return { success: false, message: featureCheck.message || '传送功能不可用' };
    }

    const point = this.teleportPoints.get(pointId);
    if (!point) {
      return { success: false, message: '传送点不存在' };
    }

    if (!point.isActive) {
      return { success: false, message: '传送点未启用' };
    }

    const unlocked = this.getPlayerUnlockedPoints(player.id);
    if (!point.unlocked && !unlocked.has(pointId)) {
      return { success: false, message: '传送点未解锁' };
    }

    return {
      success: true,
      position: { ...point.position },
    };
  }

  getTeleportPointCount(): number {
    return this.teleportPoints.size;
  }
}

export default FeatureManager;
