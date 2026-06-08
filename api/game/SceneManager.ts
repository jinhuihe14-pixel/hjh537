
import { Vector3, WorldBossState, RankEntry, RankType } from '../../shared/types/game.js';
import { Player } from './PlayerManager.js';

export class Monster {
  public id: string;
  public monsterId: number;
  public name: string;
  public level: number;
  public position: Vector3;
  public health: number;
  public maxHealth: number;
  public attack: number;
  public defense: number;
  public expReward: number;
  public goldReward: number;
  public isAlive: boolean = true;
  public respawnTime: number = 0;
  public lastAttackTime: number = 0;
  
  constructor(id: string, monsterId: number, position: Vector3) {
    this.id = id;
    this.monsterId = monsterId;
    this.position = { ...position };
    
    this.name = '野狼';
    this.level = 5;
    this.health = 100;
    this.maxHealth = 100;
    this.attack = 15;
    this.defense = 3;
    this.expReward = 50;
    this.goldReward = 20;
    
    if (monsterId === 2) {
      this.name = '哥布林';
      this.level = 8;
      this.health = 150;
      this.maxHealth = 150;
      this.attack = 20;
      this.defense = 5;
      this.expReward = 80;
      this.goldReward = 35;
    } else if (monsterId === 3) {
      this.name = '石头人';
      this.level = 15;
      this.health = 300;
      this.maxHealth = 300;
      this.attack = 30;
      this.defense = 15;
      this.expReward = 150;
      this.goldReward = 60;
    }
  }
  
  takeDamage(damage: number): number {
    const actualDamage = Math.max(1, damage - this.defense);
    this.health = Math.max(0, this.health - actualDamage);
    if (this.health <= 0) {
      this.isAlive = false;
      this.respawnTime = Date.now() + 30000;
    }
    return actualDamage;
  }
  
  respawn(): void {
    this.health = this.maxHealth;
    this.isAlive = true;
  }
}

export class SceneManager {
  private monsters: Map<string, Monster> = new Map();
  private worldBoss: WorldBossState | null = null;
  private bossDamageDealt: Map<string, number> = new Map();
  
  constructor() {
    this.spawnMonsters();
    this.initWorldBoss();
  }
  
  private spawnMonsters(): void {
    const monsterTypes = [1, 2, 3];
    
    for (let i = 0; i < 30; i++) {
      const monsterId = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
      const angle = (i / 30) * Math.PI * 2;
      const radius = 30 + Math.random() * 50;
      const x = 32 + Math.cos(angle) * radius;
      const z = 32 + Math.sin(angle) * radius;
      
      const monster = new Monster(`monster_${i}`, monsterId, { x, y: 0, z });
      this.monsters.set(monster.id, monster);
    }
  }
  
  private initWorldBoss(): void {
    this.worldBoss = {
      bossId: 1,
      name: '炎魔领主',
      level: 50,
      health: 50000,
      maxHealth: 50000,
      position: { x: 100, y: 0, z: 100 },
      respawnTime: 0,
      isAlive: true,
    };
  }
  
  getMonstersInArea(position: Vector3, radius: number): Monster[] {
    const result: Monster[] = [];
    
    for (const monster of this.monsters.values()) {
      if (!monster.isAlive) continue;
      
      const dx = monster.position.x - position.x;
      const dz = monster.position.z - position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist <= radius) {
        result.push(monster);
      }
    }
    
    return result;
  }
  
  getMonster(monsterId: string): Monster | undefined {
    return this.monsters.get(monsterId);
  }
  
  getAllMonsters(): Monster[] {
    return Array.from(this.monsters.values());
  }
  
  attackMonster(player: Player, monsterId: string, damage: number): { actualDamage: number; died: boolean; rewards: { exp: number; gold: number } } {
    const monster = this.monsters.get(monsterId);
    if (!monster || !monster.isAlive) {
      return { actualDamage: 0, died: false, rewards: { exp: 0, gold: 0 } };
    }
    
    const actualDamage = monster.takeDamage(damage);
    const died = !monster.isAlive;
    
    let rewards = { exp: 0, gold: 0 };
    if (died) {
      rewards = { exp: monster.expReward, gold: monster.goldReward };
      player.addExp(monster.expReward);
      player.addGold(monster.goldReward);
    }
    
    return { actualDamage, died, rewards };
  }
  
  attackWorldBoss(player: Player, damage: number): { actualDamage: number; died: boolean; rank: number } {
    if (!this.worldBoss || !this.worldBoss.isAlive) {
      return { actualDamage: 0, died: false, rank: 0 };
    }
    
    const actualDamage = Math.max(1, damage);
    this.worldBoss.health = Math.max(0, this.worldBoss.health - actualDamage);
    
    const currentDamage = (this.bossDamageDealt.get(player.id) || 0) + actualDamage;
    this.bossDamageDealt.set(player.id, currentDamage);
    
    const died = this.worldBoss.health <= 0;
    if (died) {
      this.worldBoss.isAlive = false;
      this.worldBoss.respawnTime = Date.now() + 3600000;
    }
    
    const rank = this.getBossDamageRank(player.id);
    return { actualDamage, died, rank };
  }
  
  getBossDamageRank(playerId: string): number {
    const sorted = Array.from(this.bossDamageDealt.entries())
      .sort((a, b) => b[1] - a[1]);
    
    const index = sorted.findIndex(([id]) => id === playerId);
    return index >= 0 ? index + 1 : 0;
  }
  
  getWorldBoss(): WorldBossState | null {
    return this.worldBoss;
  }
  
  getRank(type: RankType, limit: number = 20): RankEntry[] {
    const entries: RankEntry[] = [];
    
    if (type === 'level') {
      // Level ranking would come from database
    }
    
    return entries.slice(0, limit);
  }
  
  update(): void {
    const now = Date.now();
    
    for (const monster of this.monsters.values()) {
      if (!monster.isAlive && now >= monster.respawnTime) {
        monster.respawn();
      }
    }
    
    if (this.worldBoss && !this.worldBoss.isAlive && now >= this.worldBoss.respawnTime) {
      this.worldBoss.health = this.worldBoss.maxHealth;
      this.worldBoss.isAlive = true;
      this.bossDamageDealt.clear();
    }
  }
}
